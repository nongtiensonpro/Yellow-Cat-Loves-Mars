# -*- coding: utf-8 -*-
"""
Dựng Mèo Vàng — Hero Asset Master cho Yellow Cat Loves Mars.

QUY ƯỚC TRỤC (Blender):
  +X = trước mặt (FORWARD)
  +Y = bên trái (LEFT)
  +Z = lên (UP)
GỐC TỌA ĐỘ (0,0,0) = mặt yên xe.

Tạo ra:
  1. assets/models/meo-vang.blend (file nguồn đầy đủ vật liệu, ánh sáng, viewport)
  2. public/assets/models/meo-vang.glb (file nén Draco xuất cho WebGL runtime)

Chạy:
  blender -b --factory-startup --python scripts/build-meo-vang.py
"""
import bpy, sys, os, math
from mathutils import Vector, Euler, Matrix

OUT_DIR    = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "assets", "models"))
BLEND_PATH = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "models", "meo-vang.blend"))
GLB_NAME   = os.environ.get("GLBNAME", "meo-vang.glb")

# Dọn sạch scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "MeoVang"

# ───────────────────────── VẬT LIỆU PBR ─────────────────────────
def create_mat(name, color, rough=0.6, metal=0.0, emit=None, emit_str=0.0, clearcoat=0.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color[:3], alpha)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if "Alpha" in b.inputs:
        b.inputs["Alpha"].default_value = alpha
    if "Coat Weight" in b.inputs:
        b.inputs["Coat Weight"].default_value = clearcoat
    elif "Clearcoat" in b.inputs:
        b.inputs["Clearcoat"].default_value = clearcoat
    if emit is not None and "Emission Color" in b.inputs:
        b.inputs["Emission Color"].default_value = (*emit[:3], 1.0)
        b.inputs["Emission Strength"].default_value = emit_str
    
    m.diffuse_color = (*color[:3], alpha)
    m.roughness = rough
    m.metallic = metal
    if alpha < 0.99:
        if hasattr(m, "blend_method"):
            m.blend_method = 'BLEND'
        if hasattr(m, "surface_render_method"):
            m.surface_render_method = 'BLENDED'
    return m

M_FUR        = create_mat("fur",        (0.96, 0.62, 0.10), rough=0.68)
M_FUR_DARK   = create_mat("furDark",    (0.58, 0.20, 0.04), rough=0.72)
M_CREAM      = create_mat("cream",      (0.99, 0.94, 0.82), rough=0.60)
M_PINK       = create_mat("pink",       (0.98, 0.48, 0.56), rough=0.40)
M_EYE_WHITE  = create_mat("eyeWhite",   (0.98, 0.98, 0.98), rough=0.08, clearcoat=0.9)
M_EYE_IRIS   = create_mat("eyeIris",    (0.06, 0.82, 0.50), rough=0.12, emit=(0.04, 0.40, 0.22), emit_str=0.9, clearcoat=1.0)
M_EYE_PUPIL  = create_mat("eyePupil",   (0.015, 0.015, 0.015), rough=0.05)
M_EYE_SPARK  = create_mat("eyeSparkle", (1.00, 1.00, 1.00), rough=0.05, emit=(1.0, 1.0, 1.0), emit_str=3.0)
M_SCARF      = create_mat("scarfRed",   (0.90, 0.14, 0.12), rough=0.50)
M_SUIT       = create_mat("suitWhite",  (0.94, 0.95, 0.97), rough=0.32, clearcoat=0.6)
M_SUIT_DARK  = create_mat("suitDark",   (0.16, 0.18, 0.22), rough=0.45)
M_GOLD       = create_mat("gold",       (1.00, 0.80, 0.18), rough=0.20, metal=0.88)
M_VISOR      = create_mat("visor",      (0.40, 0.78, 0.92), rough=0.08, alpha=0.30, clearcoat=1.0, emit=(0.10, 0.35, 0.50), emit_str=0.25)
M_LAMP       = create_mat("lamp",       (1.00, 0.92, 0.55), rough=0.15, emit=(1.0, 0.90, 0.45), emit_str=4.0)
M_PACK_CYAN  = create_mat("packCyan",   (0.10, 0.68, 0.82), rough=0.28, metal=0.55)

# ───────────────────────── HÀM DỰNG KHỐI HỌC ─────────────────────────
def sphere(name, r, loc, scale=(1,1,1), rot=(0,0,0), mat=None, segs=20, rings=14):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=rings, radius=r, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat: o.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return o

def cylinder(name, r, depth, loc, rot=(0,0,0), scale=(1,1,1), mat=None, segs=18):
    bpy.ops.mesh.primitive_cylinder_add(vertices=segs, radius=r, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat: o.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return o

def cone(name, r1, r2, depth, loc, rot=(0,0,0), scale=(1,1,1), mat=None, segs=18):
    bpy.ops.mesh.primitive_cone_add(vertices=segs, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat: o.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return o

def box(name, sx, sy, sz, loc, rot=(0,0,0), mat=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat: o.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return o

def torus(name, major_r, minor_r, loc, rot=(0,0,0), scale=(1,1,1), mat=None, segs=24, rings=10):
    bpy.ops.mesh.primitive_torus_add(major_radius=major_r, minor_radius=minor_r,
                                     major_segments=segs, minor_segments=rings,
                                     location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat: o.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return o

def segment(name, p1, p2, r, mat=None, segs=16):
    """Cylinder kết nối chuẩn xác giữa hai điểm p1 và p2."""
    v1 = Vector(p1); v2 = Vector(p2)
    diff = v2 - v1
    length = diff.length
    if length < 1e-5:
        return sphere(name, r, v1, mat=mat)
    mid = (v1 + v2) * 0.5
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=length, location=(0,0,0), vertices=segs)
    o = bpy.context.object
    o.name = name
    rot = Vector((0, 0, 1)).rotation_difference(diff)
    o.rotation_euler = rot.to_euler()
    o.location = mid
    if mat: o.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return o

def capsule_seg(name, p1, p2, r, mat=None, segs=16, rings=10):
    """Capsule nối giữa p1 và p2 với hai đầu cầu bo tròn hoàn hảo."""
    v1 = Vector(p1); v2 = Vector(p2)
    diff = v2 - v1
    length = diff.length
    mid = (v1 + v2) * 0.5
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=length, location=(0,0,0), vertices=segs)
    cyl = bpy.context.object
    cyl.name = name + "_cyl"
    rot = Vector((0, 0, 1)).rotation_difference(diff)
    cyl.rotation_euler = rot.to_euler()
    cyl.location = mid
    if mat: cyl.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    
    cap1 = sphere(name + "_cap1", r, v1, mat=mat, segs=segs, rings=rings)
    cap2 = sphere(name + "_cap2", r, v2, mat=mat, segs=segs, rings=rings)
    
    bpy.ops.object.select_all(action='DESELECT')
    cyl.select_set(True); cap1.select_set(True); cap2.select_set(True)
    bpy.context.view_layer.objects.active = cyl
    bpy.ops.object.join()
    res = bpy.context.view_layer.objects.active
    res.name = name
    return res

# ==============================================================================
# 1. ĐẦU (GỐC XOAY PIVOT: 0.30, 0.0, 0.53)
# ==============================================================================
head_parts = []
HX, HY, HZ = 0.30, 0.0, 0.53

# Hộp sọ & má phồng mèo
head_parts.append(sphere("skull", 0.185, (HX, 0, HZ), (1.02, 1.05, 0.96), mat=M_FUR, segs=24, rings=16))
for s in (1, -1):
    head_parts.append(sphere("cheek", 0.100, (HX + 0.05, s*0.115, HZ - 0.04), (1.0, 1.05, 0.90), mat=M_CREAM, segs=20, rings=14))
    head_parts.append(sphere("muzzle", 0.068, (HX + 0.145, s*0.046, HZ - 0.06), (1.08, 1.05, 0.90), mat=M_CREAM, segs=18, rings=12))

# Sống mũi, mũi hồng, cằm, khóe miệng cười
head_parts.append(box("noseBridge", 0.08, 0.045, 0.065, (HX + 0.13, 0, HZ - 0.02), mat=M_CREAM))
head_parts.append(sphere("nose", 0.030, (HX + 0.195, 0, HZ - 0.038), (0.85, 1.20, 0.78), mat=M_PINK, segs=16, rings=12))
head_parts.append(sphere("chin", 0.052, (HX + 0.12, 0, HZ - 0.105), (0.95, 0.85, 0.85), mat=M_CREAM, segs=16, rings=10))
for s in (1, -1):
    head_parts.append(sphere("smile", 0.016, (HX + 0.175, s*0.030, HZ - 0.075), (0.5, 1.0, 1.2), mat=M_FUR_DARK, segs=12, rings=8))

# Mắt mèo biểu cảm: lòng trắng, mống ngọc bích, đồng tử dọc, ánh sáng lấp lánh (catchlights)
for s in (1, -1):
    eye_rot = (0, 0.05, s*0.18)
    head_parts.append(sphere("eyeSclera", 0.058, (HX + 0.125, s*0.096, HZ + 0.02), (0.75, 1.02, 1.08), rot=eye_rot, mat=M_EYE_WHITE, segs=22, rings=16))
    head_parts.append(sphere("eyeIris", 0.048, (HX + 0.155, s*0.094, HZ + 0.02), (0.35, 0.95, 1.00), rot=eye_rot, mat=M_EYE_IRIS, segs=20, rings=14))
    head_parts.append(sphere("eyePupil", 0.024, (HX + 0.168, s*0.094, HZ + 0.02), (0.20, 0.55, 1.15), rot=eye_rot, mat=M_EYE_PUPIL, segs=16, rings=12))
    # Điểm sáng long lanh
    head_parts.append(sphere("eyeSpark1", 0.012, (HX + 0.171, s*0.094 + 0.010, HZ + 0.035), mat=M_EYE_SPARK, segs=12, rings=8))
    head_parts.append(sphere("eyeSpark2", 0.007, (HX + 0.170, s*0.094 - 0.010, HZ + 0.008), mat=M_EYE_SPARK, segs=10, rings=6))
    head_parts.append(torus("eyeLid", 0.052, 0.008, (HX + 0.135, s*0.096, HZ + 0.042), rot=(math.pi/2, 0, s*0.18), mat=M_FUR_DARK, segs=16, rings=8))

# Đôi tai mèo vểnh tinh nghịch
for s in (1, -1):
    ear_rot = (s*0.35, 0.12, s*0.08)
    head_parts.append(cone("earOuter", 0.015, 0.075, 0.155, (HX - 0.02, s*0.125, HZ + 0.16), rot=ear_rot, mat=M_FUR, segs=20))
    head_parts.append(cone("earTip", 0.005, 0.035, 0.065, (HX - 0.01, s*0.150, HZ + 0.215), rot=ear_rot, mat=M_FUR_DARK, segs=18))
    head_parts.append(cone("earInner", 0.010, 0.050, 0.125, (HX + 0.00, s*0.125, HZ + 0.16), rot=ear_rot, mat=M_PINK, segs=18))
    head_parts.append(sphere("earTuft", 0.024, (HX + 0.02, s*0.115, HZ + 0.11), (0.8, 1.2, 0.8), mat=M_CREAM, segs=12, rings=8))

# Hoa văn chữ 'M' tabby trên trán
head_parts.append(box("tabbyC", 0.06, 0.016, 0.022, (HX + 0.08, 0, HZ + 0.13), rot=(0, -0.65, 0), mat=M_FUR_DARK))
for s in (1, -1):
    head_parts.append(box("tabbyS", 0.05, 0.014, 0.020, (HX + 0.06, s*0.045, HZ + 0.14), rot=(0, -0.60, s*0.25), mat=M_FUR_DARK))
    head_parts.append(box("tabbyW", 0.045, 0.012, 0.018, (HX + 0.04, s*0.085, HZ + 0.145), rot=(0, -0.55, s*0.45), mat=M_FUR_DARK))

# Ria mép thanh thoát xòe hai bên
for s in (1, -1):
    for k in range(3):
        p_base = (HX + 0.15, s * 0.08, HZ - 0.045 - k * 0.018)
        p_tip  = (HX + 0.12 - k * 0.02, s * (0.23 + k * 0.02), HZ - 0.055 - k * 0.025)
        head_parts.append(segment("whisker_%d_%d" % (1 if s>0 else 0, k), p_base, p_tip, r=0.0035, mat=M_CREAM))

# Mũ phi hành gia & Phụ kiện công nghệ cao
# Vòng đệm cổ & chốt khóa
head_parts.append(torus("helCollar", 0.205, 0.025, (HX - 0.04, 0, HZ - 0.145), rot=(0, 0.20, 0), mat=M_SUIT_DARK, segs=28, rings=10))
for s in (1, -1):
    head_parts.append(box("collarClamp", 0.035, 0.025, 0.035, (HX - 0.03, s*0.20, HZ - 0.14), mat=M_GOLD))

# Vỏ mũ bảo hiểm khí động học (ôm nửa trên và sau gáy)
head_parts.append(sphere("helShell", 0.222, (HX - 0.06, 0, HZ + 0.03), (1.05, 1.02, 0.98), mat=M_SUIT, segs=28, rings=18))
head_parts.append(torus("helCrownStripe", 0.224, 0.016, (HX - 0.06, 0, HZ + 0.03), rot=(0, math.pi/2, 0), scale=(1, 0.25, 1), mat=M_SCARF, segs=24, rings=8))

# Hốc đệm tai chống áp suất
for s in (1, -1):
    head_parts.append(sphere("earPod", 0.085, (HX - 0.05, s*0.145, HZ + 0.15), (0.9, 1.0, 1.2), rot=(s*0.35, 0.12, 0), mat=M_SUIT, segs=18, rings=12))
    head_parts.append(torus("earPodRing", 0.075, 0.012, (HX - 0.05, s*0.155, HZ + 0.16), rot=(0, math.pi/2 + s*0.35, 0), mat=M_GOLD, segs=18, rings=8))

# Viền vàng sang trọng bao quanh khung kính (tôn lên gương mặt dễ thương)
head_parts.append(torus("visorBezel", 0.192, 0.014, (HX + 0.08, 0, HZ), rot=(0, math.pi/2 - 0.15, 0), scale=(0.88, 1.0, 1.0), mat=M_GOLD, segs=28, rings=10))

# Kính vòm trong suốt tinh tế phía trước
bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.205, location=(HX + 0.07, 0, HZ))
vis_obj = bpy.context.object
vis_obj.name = "visorGlass"
vis_obj.scale = (0.75, 0.96, 0.90)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
# Cắt bỏ phần sau để kính chỉ là vòm chắn gió phía trước
bpy.ops.object.select_all(action='DESELECT')
vis_obj.select_set(True); bpy.context.view_layer.objects.active = vis_obj
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='DESELECT')
for v in vis_obj.data.vertices:
    if v.co.x < HX + 0.08:
        v.select = True
bpy.ops.mesh.delete(type='VERT')
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.shade_smooth()
vis_obj.data.materials.append(M_VISOR)
head_parts.append(vis_obj)

# Ăngten liên lạc không gian trên tai trái
head_parts.append(cylinder("antennaStalk", 0.006, 0.17, (HX - 0.08, 0.21, HZ + 0.24), rot=(0.25, -0.20, 0), mat=M_GOLD, segs=12))
head_parts.append(sphere("antennaTip", 0.018, (HX - 0.10, 0.24, HZ + 0.32), mat=M_LAMP, segs=14, rings=10))

# Đèn pha đôi siêu sáng phía trên trán
head_parts.append(box("lampHousing", 0.045, 0.09, 0.038, (HX + 0.12, 0, HZ + 0.20), rot=(0, 0.35, 0), mat=M_SUIT_DARK))
for s in (1, -1):
    head_parts.append(cylinder("lampLens", 0.016, 0.012, (HX + 0.14, s*0.026, HZ + 0.21), rot=(0, math.pi/2 + 0.35, 0), mat=M_LAMP, segs=14))

# ==============================================================================
# 2. THÂN & BỘ ĐỒ PHI HÀNH (GỐC XOAY PIVOT: 0.0, 0.0, 0.27)
# ==============================================================================
body_parts = []
# Thân mèo cong tự nhiên khi lái xe
body_parts.append(sphere("torsoChest", 0.215, (0.16, 0, 0.26), (1.10, 1.00, 0.95), mat=M_FUR, segs=22, rings=16))
body_parts.append(sphere("torsoMid", 0.195, (0.00, 0, 0.20), (1.15, 0.92, 0.88), mat=M_FUR, segs=22, rings=16))
body_parts.append(sphere("torsoHips", 0.210, (-0.16, 0, 0.16), (1.12, 0.95, 0.90), mat=M_FUR, segs=22, rings=16))
body_parts.append(sphere("bellyCream", 0.175, (0.05, 0, 0.11), (1.30, 0.78, 0.72), mat=M_CREAM, segs=20, rings=14))
body_parts.append(sphere("chestCream", 0.155, (0.22, 0, 0.24), (0.85, 0.82, 0.95), mat=M_CREAM, segs=18, rings=14))

# Sọc tabby lưng & sườn ôm sát thân mượt mà
for i, (lx, width, r_spine) in enumerate([(0.12, 0.16, 0.21), (0.02, 0.18, 0.20), (-0.08, 0.18, 0.20), (-0.18, 0.15, 0.21)]):
    for s in (1, -1):
        p_top = (-0.02 + lx, 0, 0.20 + r_spine)
        p_side = (-0.02 + lx, s * width, 0.20 + r_spine * 0.4)
        body_parts.append(segment("bodyStripe_%d_%d" % (i, 1 if s>0 else 0), p_top, p_side, r=0.014, mat=M_FUR_DARK))

# Khăn quàng cổ đỏ kiêu hùng & dải khăn bay phấp phới
body_parts.append(torus("scarfWrap", 0.185, 0.058, (0.19, 0, 0.38), rot=(0, 0.22, 0), scale=(1, 1, 0.82), mat=M_SCARF, segs=26, rings=10))
body_parts.append(sphere("scarfKnot", 0.058, (0.13, 0.15, 0.37), (1.0, 0.85, 1.1), rot=(0.2, 0.1, 0.4), mat=M_SCARF, segs=16, rings=12))

# Hai dải khăn lụa bay uốn lượn theo gió
tail1_pts = [(0.10, 0.15, 0.37), (-0.05, 0.18, 0.34), (-0.20, 0.21, 0.30), (-0.35, 0.24, 0.27)]
for k in range(len(tail1_pts)-1):
    body_parts.append(segment("scarfTail1_%d" % k, tail1_pts[k], tail1_pts[k+1], r=0.028 - k*0.005, mat=M_SCARF))

tail2_pts = [(0.08, 0.13, 0.34), (-0.08, 0.16, 0.29), (-0.22, 0.18, 0.23), (-0.32, 0.19, 0.18)]
for k in range(len(tail2_pts)-1):
    body_parts.append(segment("scarfTail2_%d" % k, tail2_pts[k], tail2_pts[k+1], r=0.024 - k*0.004, mat=M_SCARF))

# Dây đai an toàn, huy hiệu Mèo Vàng, thắt lưng
for s in (1, -1):
    p_harn1 = (0.19, s * 0.08, 0.36)
    p_harn2 = (0.05, s * 0.17, 0.16)
    body_parts.append(segment("harness_%d" % (1 if s>0 else 0), p_harn1, p_harn2, r=0.016, mat=M_SUIT_DARK))

body_parts.append(cylinder("patchBase", 0.045, 0.010, (0.27, 0.12, 0.26), rot=(0, math.pi/2 - 0.25, 0), mat=M_SCARF, segs=16))
body_parts.append(cylinder("patchPaw", 0.028, 0.012, (0.275, 0.12, 0.26), rot=(0, math.pi/2 - 0.25, 0), mat=M_GOLD, segs=16))
body_parts.append(torus("belt", 0.198, 0.016, (-0.02, 0, 0.16), rot=(0, math.pi/2, 0), scale=(0.88, 1.0, 0.80), mat=M_SUIT_DARK, segs=24, rings=8))
body_parts.append(box("beltBuckle", 0.025, 0.055, 0.040, (0.16, 0, 0.15), mat=M_GOLD))
for s in (1, -1):
    body_parts.append(box("beltPouch", 0.065, 0.038, 0.065, (-0.02, s*0.20, 0.17), rot=(0, 0, s*0.15), mat=M_SUIT_DARK))

# Balo hỗ trợ sự sống PLSS (Twin Oxygen/Thruster Backpack)
body_parts.append(box("plssCase", 0.18, 0.22, 0.20, (-0.10, 0, 0.35), rot=(0, -0.20, 0), mat=M_SUIT))
for s in (1, -1):
    body_parts.append(cylinder("o2Tank", 0.042, 0.22, (-0.09, s*0.078, 0.36), rot=(0, -0.20, 0), mat=M_PACK_CYAN, segs=18))
    body_parts.append(sphere("o2CapTop", 0.042, (-0.07, s*0.078, 0.47), mat=M_GOLD, segs=14, rings=8))
    body_parts.append(sphere("o2CapBot", 0.042, (-0.11, s*0.078, 0.25), mat=M_SUIT_DARK, segs=14, rings=8))
    body_parts.append(cone("thrusterBell", 0.024, 0.010, 0.045, (-0.18, s*0.08, 0.23), rot=(0, -0.75, 0), mat=M_SUIT_DARK, segs=14))
body_parts.append(box("plssSolar", 0.12, 0.09, 0.015, (-0.18, 0, 0.37), rot=(0, -0.20, 0), mat=M_GOLD))
body_parts.append(box("plssLED", 0.020, 0.08, 0.015, (-0.06, 0, 0.46), rot=(0, -0.20, 0), mat=M_LAMP))
body_parts.append(torus("tailGrommet", 0.068, 0.016, (-0.28, 0, 0.14), rot=(0, -0.45, 0), mat=M_SUIT_DARK, segs=20, rings=8))

# ==============================================================================
# 3. CHÂN & ỦNG PHI HÀNH (GỐC XOAY PIVOT: 0.0, 0.0, 0.0)
# ==============================================================================
leg_parts = []
for s in (1, -1):
    # Đùi mèo săn chắc ôm lấy yên xe
    leg_parts.append(sphere("thigh", 0.135, (-0.16, s*0.17, 0.12), (1.25, 0.82, 1.05), rot=(0, 0.25, s*0.12), mat=M_FUR, segs=20, rings=14))
    leg_parts.append(torus("thighStripe", 0.125, 0.014, (-0.14, s*0.17, 0.14), rot=(math.pi/2, 0.35, s*0.15), scale=(1, 0.90, 1), mat=M_FUR_DARK, segs=16, rings=8))
    # Ống chân
    p_knee = (-0.14, s * 0.18, 0.04)
    p_ankle = (-0.05, s * 0.185, -0.14)
    leg_parts.append(capsule_seg("shin_%d" % (1 if s>0 else 0), p_knee, p_ankle, r=0.060, mat=M_SUIT))
    
    # Ủng phi hành đỏ rực rỡ, đế đen chống trượt đạp vững lên bàn đạp/chỗ để chân xe
    leg_parts.append(sphere("bootUpper", 0.075, (-0.04, s*0.185, -0.16), (1.30, 0.85, 0.80), rot=(0, 0.10, s*0.08), mat=M_SCARF, segs=18, rings=12))
    leg_parts.append(box("bootToe", 0.085, 0.090, 0.055, (0.02, s*0.185, -0.18), rot=(0, 0.05, s*0.08), mat=M_SCARF))
    leg_parts.append(box("bootSole", 0.150, 0.096, 0.028, (-0.02, s*0.185, -0.215), rot=(0, 0.05, s*0.08), mat=M_SUIT_DARK))
    leg_parts.append(torus("bootCuff", 0.068, 0.012, (-0.06, s*0.185, -0.11), rot=(0, 0.40, s*0.10), mat=M_GOLD, segs=18, rings=8))

# ==============================================================================
# 4. TAY LÁI & BÀN TAY MÈO (GỐC XOAY PIVOT: 0.10, 0.0, 0.41)
# Bàn tay ôm chắc chắn ghi đông xe tại x ≈ 0.95 đến 1.05, y = ±0.24, z = -0.21
# ==============================================================================
arm_parts = []
for s in (1, -1):
    p_shoulder = (0.18, s * 0.18, 0.25)
    p_elbow    = (0.46, s * 0.22, 0.06)
    p_wrist    = (0.78, s * 0.24, -0.10)
    p_paw      = (0.95, s * 0.24, -0.18)
    
    # Khớp vai
    arm_parts.append(sphere("shoulder_%d" % (1 if s>0 else 0), 0.080, p_shoulder, mat=M_FUR, segs=18, rings=12))
    # Cánh tay trên
    arm_parts.append(capsule_seg("upperArm_%d" % (1 if s>0 else 0), p_shoulder, p_elbow, r=0.062, mat=M_FUR))
    # Khớp khuỷu tay áo
    arm_parts.append(torus("elbowCuff_%d" % (1 if s>0 else 0), 0.062, 0.015, p_elbow, rot=(0, 0.55, s*0.10), mat=M_SUIT_DARK, segs=18, rings=8))
    # Cẳng tay
    arm_parts.append(capsule_seg("foreArm_%d" % (1 if s>0 else 0), p_elbow, p_wrist, r=0.056, mat=M_FUR))
    # Cổ găng tay mạ vàng
    arm_parts.append(torus("gloveCuff_%d" % (1 if s>0 else 0), 0.060, 0.015, p_wrist, rot=(0, 0.65, s*0.05), mat=M_GOLD, segs=18, rings=8))
    # Lòng bàn tay mèo
    arm_parts.append(sphere("pawMain_%d" % (1 if s>0 else 0), 0.068, p_paw, (1.15, 0.95, 0.75), rot=(0, 0.35, s*0.10), mat=M_CREAM, segs=18, rings=12))
    
    # 4 ngón tay đệm mũm mĩm ôm vòng quanh tay cầm ghi đông
    for f in range(4):
        fy = s * 0.24 + (f - 1.5) * 0.026
        p_f_base = (0.96, fy, -0.17)
        p_f_tip  = (1.04, fy, -0.21)
        arm_parts.append(capsule_seg("finger_%d_%d" % (1 if s>0 else 0, f), p_f_base, p_f_tip, r=0.015, mat=M_CREAM))
        arm_parts.append(cone("claw_%d_%d" % (1 if s>0 else 0, f), 0.006, 0.001, 0.018, (1.05, fy, -0.23), rot=(-math.pi/2, 0.35, 0), mat=M_SUIT_DARK, segs=10))
        # Đệm ngón hồng hào (toe beans)
        arm_parts.append(sphere("toeBean_%d_%d" % (1 if s>0 else 0, f), 0.008, (1.00, fy, -0.20), mat=M_PINK, segs=10, rings=6))
    
    # Ngón tay cái đối diện ôm dưới ghi đông
    p_th_base = (0.93, s * 0.24 - s * 0.035, -0.20)
    p_th_tip  = (0.96, s * 0.24 - s * 0.045, -0.24)
    arm_parts.append(capsule_seg("thumb_%d" % (1 if s>0 else 0), p_th_base, p_th_tip, r=0.016, mat=M_CREAM))
    
    # Đệm thịt lòng bàn tay hồng xinh xắn
    arm_parts.append(sphere("palmBean_%d" % (1 if s>0 else 0), 0.024, (0.95, s*0.24, -0.20), (1.0, 1.2, 0.35), rot=(0, 0.35, s*0.10), mat=M_PINK, segs=14, rings=8))

# ==============================================================================
# 5. CHUỖI ĐUÔI (tail_1 đến tail_5, tail_tip) — ĐƯỜNG CONG CHỮ S UỐN LƯỢN KIÊU HÃNH
# ==============================================================================
tail_nodes = []
TAIL_POINTS = [
    ("tail_1",   (-0.28, 0.00, 0.14), (-0.36, 0.00, 0.18), 0.056, M_FUR),
    ("tail_2",   (-0.36, 0.00, 0.18), (-0.44, 0.00, 0.24), 0.052, M_FUR_DARK),
    ("tail_3",   (-0.44, 0.00, 0.24), (-0.52, 0.00, 0.33), 0.048, M_FUR),
    ("tail_4",   (-0.52, 0.00, 0.33), (-0.60, 0.00, 0.43), 0.044, M_FUR_DARK),
    ("tail_5",   (-0.60, 0.00, 0.43), (-0.67, 0.00, 0.53), 0.040, M_FUR),
    ("tail_tip", (-0.67, 0.00, 0.53), (-0.73, 0.00, 0.62), 0.036, M_CREAM),
]

for name, p_start, p_end, r, mat in TAIL_POINTS:
    seg = capsule_seg(name, p_start, p_end, r=r, mat=mat, segs=16, rings=10)
    tail_nodes.append((name, p_start, seg))

# ==============================================================================
# GỘP THEO CỤM CỬ ĐỘNG & ĐẶT GỐC PIVOT
# ==============================================================================
PIVOTS = {
    "body":     (0.00,  0.0, 0.27),
    "head":     (0.30,  0.0, 0.53),
    "arms":     (0.10,  0.0, 0.41),
    "legs":     (0.00,  0.0, 0.00),
    "tail_1":   (-0.28, 0.0, 0.14),
    "tail_2":   (-0.36, 0.0, 0.18),
    "tail_3":   (-0.44, 0.0, 0.24),
    "tail_4":   (-0.52, 0.0, 0.33),
    "tail_5":   (-0.60, 0.0, 0.43),
    "tail_tip": (-0.67, 0.0, 0.53),
}

def join_group(name, objects, pivot):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if len(objects) > 1:
        bpy.ops.object.join()
    res = bpy.context.view_layer.objects.active
    res.name = name
    res.data.name = name + "_mesh"
    bpy.context.scene.cursor.location = pivot
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR', center='MEDIAN')
    bpy.context.scene.cursor.location = (0, 0, 0)
    return res

merged = {}
merged["head"] = join_group("head", head_parts, PIVOTS["head"])
merged["body"] = join_group("body", body_parts, PIVOTS["body"])
merged["legs"] = join_group("legs", leg_parts, PIVOTS["legs"])
merged["arms"] = join_group("arms", arm_parts, PIVOTS["arms"])

for name, p_start, seg in tail_nodes:
    merged[name] = join_group(name, [seg], PIVOTS[name])

# Thống kê lưới và số tam giác
n_mesh = len([o for o in bpy.data.objects if o.type == 'MESH'])
tris = 0
for o in bpy.data.objects:
    if o.type == 'MESH':
        o.data.calc_loop_triangles()
        tris += len(o.data.loop_triangles)

print(f"[meo] Dựng xong: {n_mesh} mesh, {tris} tam giác", flush=True)
for gname, ob in sorted(merged.items()):
    mn = Vector((1e9,)*3); mx = Vector((-1e9,)*3)
    for v in ob.bound_box:
        w = ob.matrix_world @ Vector(v)
        for i in range(3):
            mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
    print("   %-9s x[%7.3f %7.3f] y[%7.3f %7.3f] z[%7.3f %7.3f]" % (
        gname, mn.x, mx.x, mn.y, mx.y, mn.z, mx.z), flush=True)

# ───────────────────────── LƯU .BLEND ─────────────────────────
os.makedirs(os.path.dirname(BLEND_PATH), exist_ok=True)
for a in bpy.context.window.screen.areas:
    if a.type == 'VIEW_3D':
        for sp in a.spaces:
            if sp.type == 'VIEW_3D':
                sp.shading.type = 'MATERIAL'
                sp.overlay.show_floor = True
                sp.overlay.show_axis_x = True
                sp.overlay.show_axis_y = True
bpy.ops.object.select_all(action='DESELECT')
bpy.context.scene.cursor.location = (0, 0, 0.3)
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH, compress=True)
print(f"[meo] LƯU .blend: {BLEND_PATH} ({os.path.getsize(BLEND_PATH)/1024.0:.1f} KB)", flush=True)

# ───────────────────────── XUẤT GLTF/GLB ─────────────────────────
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
print(f"[meo] XUẤT glTF: {glb} ({os.path.getsize(glb)/1024.0:.1f} KB)", flush=True)
print("[meo] HOÀN TẤT THÀNH CÔNG!")
