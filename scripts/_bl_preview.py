import bpy, math, os
from mathutils import Vector
OUT = r"D:\Yellow cat loves Mars\tests\blend-preview.png"
scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.render.resolution_x, scene.render.resolution_y = 1000, 800
sh = scene.display.shading
sh.light='STUDIO'; sh.color_type='MATERIAL'; sh.show_shadows=True
sh.show_cavity=True; sh.cavity_type='BOTH'; sh.show_object_outline=False
bpy.ops.mesh.primitive_plane_add(size=14, location=(0,0,-0.22))
bpy.context.object.name = "SAN_DEMO"
# mục tiêu: giữa thân mèo
tgt = bpy.data.objects.new("MUC_TIEU", None)
scene.collection.objects.link(tgt)
tgt.location = (0.0, 0.0, 0.32)
tgt.empty_display_size = 0.08
# (tên, vị trí) — hướng nhìn do Track To lo, không tự tính góc
VIEWS = [
    ("3-4",      ( 1.55, -1.55, 0.95)),
    ("ben-trai", ( 2.40,  0.00, 0.42)),
    ("truoc",    ( 0.00, -2.40, 0.48)),
    ("tren",     ( 0.02, -0.30, 2.40)),
]
for nm, loc in VIEWS:
    cd = bpy.data.cameras.new("CAM_"+nm)
    cd.lens = 65
    if nm == "tren": cd.lens = 80
    co = bpy.data.objects.new("CAM_"+nm, cd)
    scene.collection.objects.link(co)
    co.location = loc
    c = co.constraints.new('TRACK_TO')
    c.target = tgt
    c.track_axis = 'TRACK_NEGATIVE_Z'
    c.up_axis = 'UP_Y'
    if nm == "3-4": scene.camera = co
scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("RENDER", OUT)
for nm, _ in VIEWS[1:]:
    scene.camera = bpy.data.objects["CAM_"+nm]
    scene.render.filepath = OUT.replace(".png", "-"+nm+".png")
    bpy.ops.render.render(write_still=True)
    print("RENDER", scene.render.filepath)
print("XONG")
