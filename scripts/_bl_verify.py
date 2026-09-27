import bpy
print("VERIFY file:", bpy.data.filepath)
ms = [o for o in bpy.data.objects if o.type=='MESH']
print("VERIFY mesh:", len(ms), "->", sorted(o.name for o in ms))
print("VERIFY materials:", sorted(m.name for m in bpy.data.materials))
tris = 0
for o in ms:
    o.data.calc_loop_triangles(); tris += len(o.data.loop_triangles)
print("VERIFY tris:", tris)
print("VERIFY co UV:", all(len(o.data.uv_layers)>0 for o in ms))
