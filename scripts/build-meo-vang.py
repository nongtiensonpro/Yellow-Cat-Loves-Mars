# -*- coding: utf-8 -*-
"""
Dựng Mèo Vàng — hero asset cho Yellow Cat Loves Mars.

QUY ƯỚC TRỤC (Blender):  +X = trước mặt   +Y = BÊN TRÁI   +Z = LÊN
glTF exporter tự đổi thành Y-up: glTF +X = trước, +Y = lên, +Z = phải.

GỐC TẠI ĐỘ (0,0,0) = điểm ngồi trên yên. Trong game đặt cat tại local
(0, 1.25, 0) của phương tiện, nhờ vậy các mốc dưới đây khớp đúng với bản
procedural đang chạy (thân -0.05/1.52, đầu 0.30/1.78, vai 0.10/1.66).

Chạy:  blender -b --factory-startup --python scripts/build-meo-vang.py
"""
import bpy, sys, os, math
from mathutils import Vector

OUT_DIR  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "assets", "models")
OUT_DIR  = os.path.normpath(OUT_DIR)
GLB_NAME = os.environ.get("GLBNAME", "meo-vang.glb")

# ───────────────────────── dọn sân ─────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "MeoVang"

def mat(name, color, rough=0.62, metal=0.0, emit=None, emit_str=0.0, clearcoat=0.0):
    m = bpy.data.materials.new(name)
    if not m.use_nodes: m.use_nodes = True      # 5.x cảnh báo deprecated nếu gán
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if "Clearcoat" in b.inputs:
        b.inputs["Clearcoat"].default_value = clearcoat
        b.inputs["Clearcoat Roughness"].default_value = 0.15
    if emit is not None:
        b.inputs["Emission Color"].default_value = (*emit, 1.0)
        b.inputs["Emission Strength"].default_value = emit_str
    return m

M_FUR    = mat("fur",      (0.96, 0.64, 0.12), 0.80)            # vàng mèo
M_FUR_D  = mat("furDark",  (0.72, 0.38, 0.06), 0.82)            # sọc tabby
M_CREAM  = mat("cream",    (0.99, 0.92, 0.76), 0.85)            # bụng, mõm
M_RED    = mat("scarfRed", (0.86, 0.16, 0.13), 0.70)
M_PINK   = mat("pink",     (0.96, 0.62, 0.62), 0.66)
M_DARK   = mat("dark",     (0.10, 0.07, 0.05), 0.50)
M_WHITE  = mat("white",    (0.95, 0.95, 0.95), 0.34, clearcoat=0.6)
M_GLASS  = mat("visor",    (0.10, 0.22, 0.30), 0.10, metal=0.0,
               emit=(0.25, 0.55, 0.70), emit_str=0.35, clearcoat=0.9)
M_LAMP   = mat("lamp",     (1.00, 0.86, 0.45), 0.30,
               emit=(1.00, 0.80, 0.35), emit_str=2.4)

# ───────────────────────── hàm dựng khối ─────────────────────────
def sphere(name, r, loc, scale=(1,1,1), material=None, segs=16, rings=10):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=rings,
                                         radius=r, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    if material: o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return o

def capsule(name, r, length, loc, rot=(0,0,0), material=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=8, radius=r, location=(0,0,0))
    o = bpy.context.object
    o.name = name
    # kéo dài thành capsule
    o.scale = (1, 1, (length / (2*r)) + 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.location = loc
    o.rotation_euler = rot
    if material: o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return o

def cone(name, r1, r2, depth, loc, rot=(0,0,0), material=None):
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=r1, radius2=r2,
                                   depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    if material: o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return o

def box(name, sx, sy, sz, loc, rot=(0,0,0), material=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material: o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return o

def offset(objs, d):
    """Dịch một nhóm mesh tới vị trí nhóm.

    BẪY ĐÃ DÍNH: tạo node rỗng rồi thêm mesh vào đó KHÔNG làm mesh thành con —
    Blender phải gán .parent + .matrix_parent_inverse. Nhưng code cũ chỉ tạo
    node rỗng cho có, còn mesh vẫn đặt ở toạ độ cục bộ quanh GỐC THẾ GIỚI, nên
    cả đầu + mũ + hai tay nằm chồng lên gốc tọa độ thay vì lên vai/đầu mèo.
    Sửa bằng cách dịch tường minh — rõ ràng, không phụ thuộc parenting.
    """
    for o in objs:
        o.location = (o.location[0]+d[0], o.location[1]+d[1], o.location[2]+d[2])
    return objs

# ───────────────────────── THÂN ─────────────────────────
# Tọa độ lấy từ bản procedural, trừ 1.25 (gốc = yên xe)
body_parts = []
body_parts.append(sphere("body",     0.300, (-0.05, 0, 0.27), (1.34, 0.86, 0.84), M_FUR))
body_parts.append(sphere("chest",    0.215, ( 0.21, 0, 0.34), (1.00, 1.10, 0.92), M_FUR))
body_parts.append(sphere("belly",    0.205, ( 0.15, 0, 0.14), (1.08, 0.90, 0.78), M_CREAM))
for s in (1, -1):                                   # hông + bắp đùi
    body_parts.append(sphere("hip",   0.185, (-0.30, s*0.12, 0.24), (1.05, 0.80, 1.02), M_FUR))
    body_parts.append(sphere("thigh", 0.115, (-0.20, s*0.155, 0.31), (1.25, 0.80, 1.00), M_FUR))
# sọc tabby: vòng tròn quanh thân (trục quanh X)
for i, (lx, tr) in enumerate([(0.30,0.011),(0.17,0.012),(0.03,0.013),(-0.12,0.012),(-0.26,0.010)]):
    rr = 0.285*math.sqrt(max(0.04, 1-(lx/0.384)**2))*1.03
    bpy.ops.mesh.primitive_torus_add(major_radius=rr, minor_radius=tr,
                                     major_segments=20, minor_segments=8,
                                     location=(-0.05+lx, 0, 0.27),
                                     rotation=(0, math.pi/2, 0))
    o = bpy.context.object; o.name = "stripe%d" % i
    o.scale = (1, 0.96, 1)
    o.data.materials.append(M_FUR_D)
    bpy.ops.object.shade_smooth()
    body_parts.append(o)

# ───────────────────────── ĐẦU ─────────────────────────
head = bpy.data.objects.new("head", None)
scene.collection.objects.link(head)
head.location = (0.30, 0, 0.53)
hp = []
hp.append(sphere("skull",  0.183, (0, 0, 0.00), (1.00, 0.94, 0.96), M_FUR))
hp.append(sphere("cheekL", 0.088, (0.05,  0.085, -0.02), (1.0,1.0,0.85), M_CREAM))
hp.append(sphere("cheekR", 0.088, (0.05, -0.085, -0.02), (1.0,1.0,0.85), M_CREAM))
hp.append(sphere("muzzle", 0.078, (0.155, 0, -0.055), (1.0,1.15,0.85), M_CREAM))
hp.append(sphere("nose",   0.026, (0.215, 0, -0.035), (1.0,1.2,0.9), M_PINK))
for s in (1, -1):                                   # tai
    hp.append(cone("ear", 0.010, 0.080, 0.17, (0.0, s*0.118, 0.205),
                   rot=(s*0.26, 0, 0), material=M_FUR))
    hp.append(cone("earIn", 0.006, 0.046, 0.11, (0.012, s*0.115, 0.202),
                   rot=(s*0.26, 0, 0), material=M_PINK))
# mắt: dùng sphere đen + đốm sáng để đọc được ở xa
for s in (1, -1):
    hp.append(sphere("eye",  0.046, (0.145, s*0.088, 0.030), (0.8,1.0,1.0), M_DARK, 18, 12))
    hp.append(sphere("pupilHi", 0.014, (0.172, s*0.100, 0.052), (1,1,1), M_WHITE, 10, 8))
# ria mép
for s in (1, -1):
    for k in range(3):
        hp.append(capsule("whisker", 0.0035, 0.10,
                          (0.16, s*(0.045+0.022*k), -0.055-0.018*k),
                          rot=(0, math.pi/2, s*(0.12+0.10*k)), material=M_WHITE))

offset(hp, (0.30, 0.0, 0.53))   # đầu lên đúng cao

# ───────────────────────── MŨ BẢO HIỂM ─────────────────────────
hel = bpy.data.objects.new("helmet", None)
scene.collection.objects.link(hel)
hel.location = (0.30, 0, 0.545)
hpp = []
hpp.append(sphere("helShell", 0.213, (0, 0, 0.0), (1.06, 1.02, 0.94), M_WHITE))
hpp.append(sphere("helBrim",  0.206, (0.02, 0, -0.10), (1.12, 1.02, 0.42), M_WHITE))
hpp.append(cone("helStripe", 0.012, 0.012, 0.30, (-0.01, 0, 0.16),
                rot=(math.pi/2, 0, 0), material=M_RED))
# kính: nửa vỏ cầu phía trước
bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=14, radius=0.223, location=(0,0,0))
vis = bpy.context.object; vis.name = "visor"
vis.scale = (0.86, 0.94, 0.62)
vis.location = (0.10, 0, -0.02)
bpy.ops.object.shade_smooth()
# chỉ giữ mặt trước (xo > 0) để kính không nuốt trọn mũ
for p in vis.data.polygons:
    p.material_index = 0
bpy.ops.object.select_all(action='DESELECT')
vis.select_set(True); bpy.context.view_layer.objects.active = vis
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')
vis.data.materials.append(M_GLASS)
hpp.append(vis)
# đèn trên mũ
hpp.append(sphere("lamp", 0.038, (0.12, 0, 0.205), (1.0,1.0,0.7), M_LAMP, 14, 10))
offset(hpp, (0.30, 0.0, 0.545))  # mũ lên đúng đầu

# ───────────────────────── KHĂN ĐỎ ─────────────────────────
bpy.ops.mesh.primitive_torus_add(major_radius=0.20, minor_radius=0.062,
                                 major_segments=24, minor_segments=10,
                                 location=(0.06, 0, 0.21), rotation=(0, math.pi/2, 0))
scarf = bpy.context.object; scarf.name = "scarf"
scarf.scale = (1, 1, 0.85)
scarf.data.materials.append(M_RED)
bpy.ops.object.shade_smooth()
scarf2 = sphere("scarfKnot", 0.055, (0.02, 0.11, 0.20), (1,1,0.9), M_RED, 14, 10)
scarf3 = box("scarfTail", 0.055, 0.10, 0.16, (0.0, 0.15, 0.08), rot=(0.5,0,0.4), material=M_RED)

# ───────────────────────── TAY (ôm ghi đông) ─────────────────────────
arms = []
for s in (1, -1):
    sh = bpy.data.objects.new("armL" if s > 0 else "armR", None)
    scene.collection.objects.link(sh)
    sh.location = (0.10, s*0.19, 0.41)
    ap = []
    ap.append(sphere("deltoid", 0.088, (0, 0, 0), (0.90,1.0,0.95), M_FUR, 16, 12))
    ap.append(capsule("upperArm", 0.062, 0.16, (0.15, 0, 0), rot=(0, math.pi/2, 0), material=M_FUR))
    ap.append(capsule("foreArm",  0.052, 0.15, (0.27, 0, 0), rot=(0, math.pi/2, 0), material=M_FUR))
    wr = bpy.data.objects.new("handL" if s > 0 else "handR", None)
    scene.collection.objects.link(wr)
    wr.location = (0.34, 0, 0)
    ap.append(sphere("paw", 0.082, (0.022, 0, 0), (1.15, 0.95, 0.72), M_CREAM, 16, 12))
    for f in range(4):                              # 4 ngón + vuốt
        ty = (f-1.5)*0.042
        ap.append(capsule("toe", 0.021, 0.055, (0.075, ty, -0.030),
                          rot=(math.pi/2, 0, -0.55), material=M_CREAM))
        ap.append(cone("claw", 0.011, 0.002, 0.028, (0.098, ty, -0.046),
                       rot=(-math.pi/2, 0, -0.55), material=M_DARK))
    ap.append(capsule("thumb", 0.019, 0.04, (0.02, s*0.062, -0.032),
                      rot=(math.pi/2, 0, 0.5), material=M_CREAM))
    ap.append(sphere("pawBean", 0.026, (0.028, 0, -0.046), (1.0,1.2,0.35), M_PINK, 12, 8))
    offset(ap, (0.10, s*0.19, 0.41))   # tay về đúng vai
    arms.append((sh, wr, ap))

# ───────────────────────── CHÂN ─────────────────────────
legs = []
for s in (1, -1):
    lp = []
    lp.append(capsule("shin",  0.075, 0.16, (-0.18, s*0.20, -0.02), rot=(0, 0, 0.15), material=M_FUR))
    lp.append(sphere("boot",  0.095, (-0.26, s*0.21, -0.11), (1.25,0.80,0.65), M_RED, 16, 12))
    legs.append(lp)

# ───────────────────────── ĐUÔI (5 đoạn) ─────────────────────────
tail = []
prev = None
tx, ty, tz = -0.48, 0.16, 0.0
for i in range(5):
    r = 0.052 - i*0.004
    bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=10, radius=r, location=(0,0,0))
    o = bpy.context.object
    o.name = "tail%d" % (i+1)
    o.scale = (1.25, 1.0, 1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.location = (tx - i*0.075, ty + (i*0.012), tz + math.sin(i*0.9)*0.035)
    o.rotation_euler = (0, -0.25 - i*0.20, 0)
    o.data.materials.append(M_FUR if i % 2 == 0 else M_FUR_D)
    bpy.ops.object.shade_smooth()
    tail.append(o)
tip = sphere("tailTip", 0.040, (tx-0.40, ty+0.075, tz+0.10), (1,1,1), M_CREAM, 14, 10)
tail.append(tip)

# ───────────────────────── GỘP THEO NHÓM CẬN CHIẾN ─────────────────────────
# 77 mesh rời = 77 draw call, trong khi cả game mới 225. Gộp theo nhóm để
# phần TĨNH còn 1 draw call mỗi nhóm, nhưng vẫn giữ các phần CẦN CỬ ĐỘNG
# (đầu, hai tay, chuỗi đuôi) là node riêng để Three.js animate được.
# Bỏ qua UV ở bản này: vật liệu PBR thủ tục của game tự sinh map, chưa cần
# texture dán từ ảnh — nhưng vẫn export texcoords để sau này dán texture vào.
STATIC_BODY = {"body","chest","belly","hip","thigh","stripe0","stripe1","stripe2",
               "stripe3","stripe4","scarf","scarfKnot","scarfTail"}
STATIC_LEGS = {"shin","boot"}
HEAD_SET    = {"skull","cheekL","cheekR","muzzle","nose","eye","pupilHi","whisker",
               "ear","earIn","helShell","helBrim","helStripe","visor","lamp"}
TAIL_SET    = {"tail1","tail2","tail3","tail4","tail5","tailTip"}

# Gốc xoay cho từng nhóm (khớp với bản procedural đang chạy, trừ 1.25 về yên)
PIVOTS = {
    "body":   (0.0,  0.0, 0.27),   # giữa thân
    "head":   (0.30, 0.0, 0.53),   # đầu
    "arms":   (0.10, 0.0, 0.41),   # giữa hai vai
    "legs":   (0.0,  0.0, 0.0),
    "tail_1": (-0.480, 0.0, 0.160),
    "tail_2": (-0.555, 0.0, 0.172),
    "tail_3": (-0.630, 0.0, 0.184),
    "tail_4": (-0.705, 0.0, 0.196),
    "tail_5": (-0.780, 0.0, 0.208),
    "tail_tip":(-0.860, 0.0, 0.240),
}

def group_of(name):
    if name in HEAD_SET:    return "head"
    if name in TAIL_SET:    return "tail_%s" % name[-1] if name.startswith("tail") and name[-1].isdigit() else "tail_tip"
    if name in STATIC_LEGS: return "legs"
    if name in STATIC_BODY: return "body"
    return "arms"           # deltoid/upperArm/foreArm/paw/toe/claw/thumb/pawBean

# Xoá node rỗng (chỉ để gắn con) TRƯỚC khi join. Nếu xoá sau, tên "head" của
# empty vẫn còn trong Blender và mesh gộp bị đổi thành "head.001" -> Three.js
# không tìm được node theo tên quy ước của asset-pipeline.md.
empties = [o for o in bpy.data.objects if o.type == 'EMPTY']
for e in empties:
    bpy.data.objects.remove(e, do_unlink=True)

groups = {}
for o in list(bpy.data.objects):
    if o.type != 'MESH':
        continue
    g = group_of(o.name)
    groups.setdefault(g, []).append(o)
merged = {}
for gname, objs in groups.items():
    meshes = [o for o in objs if o.type == 'MESH']
    if not meshes: continue
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes: o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()          # giữ material slot của tất cả
    merged[gname] = bpy.context.view_layer.objects.active
    merged[gname].name = gname
    merged[gname].data.name = gname + "_mesh"
    # PIVOT: sau khi join, gốc object nằm ở world origin → xoay nhóm 'arms' sẽ
    # quay quanh tâm cảnh chứ không quanh vai. Đặt lại gốc về khớp xương thật.
    piv = PIVOTS.get(gname, (0,0,0))
    bpy.context.scene.cursor.location = piv
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR', center='MEDIAN')
    bpy.context.scene.cursor.location = (0,0,0)
n_mesh = len([o for o in bpy.data.objects if o.type == 'MESH'])
tris = 0
for o in bpy.data.objects:
    if o.type == 'MESH':
        o.data.calc_loop_triangles()
        tris += len(o.data.loop_triangles)
print("[meo] sau khi gop: %d mesh (truoc: 77) · %d tam giac" % (n_mesh, tris), flush=True)
# In bounds TỪNG NHÓM — cách nhanh nhất thấy node nào lệch chỗ.
for gname, ob in sorted(merged.items()):
    if ob is None: continue
    mn = Vector((1e9,)*3); mx = Vector((-1e9,)*3)
    for v in ob.bound_box:
        w = ob.matrix_world @ Vector(v)
        for i in range(3):
            mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
    print("   %-9s x[%7.3f %7.3f] y[%7.3f %7.3f] z[%7.3f %7.3f]" % (
        gname, mn.x, mx.x, mn.y, mx.y, mn.z, mx.z), flush=True)
print("[meo] nhom:", sorted(merged.keys()), flush=True)

# ───────────────────────── xuất glTF ─────────────────────────
os.makedirs(OUT_DIR, exist_ok=True)
glb = os.path.join(OUT_DIR, GLB_NAME)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=glb,
    export_format='GLB',
    export_apply=True,
    export_yup=True,
    export_materials='EXPORT',
    export_normals=True,
    export_texcoords=True,
    export_draco_mesh_compression_enable=os.environ.get("DRACO","1")=="1",
    export_draco_mesh_compression_level=6,
)
size = os.path.getsize(glb)
print("[meo] XUAT:", glb, "%.1f KB" % (size/1024.0))
print("[meo] BOUNDS:", flush=True)
import mathutils
mn = Vector(( 1e9, 1e9, 1e9)); mx = Vector((-1e9,-1e9,-1e9))
for o in bpy.data.objects:
    if o.type != 'MESH': continue
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c)
        for i in range(3):
            mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
print("  x[%.3f %.3f]  y[%.3f %.3f]  z[%.3f %.3f]" % (mn.x,mx.x, mn.y,mx.y, mn.z,mx.z), flush=True)
print("[meo] XONG")
