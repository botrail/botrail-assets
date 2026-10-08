"""Blender-only read/render utility; never exports or rewrites model geometry.

Usage: blender -b -t 6 --python tools/render_reference.py -- MODEL.urdf OUT.png [JAW_DEGREES] [--side] [--actuator-envelope]
Writes OUT.png and a review-only OUT.blend scene. No Python package installation
is needed beyond Blender's bundled Python. Applies the same camera/lighting and
material mapping to either the original or refined URDF.
"""
import argparse
import bpy,sys,os,math,xml.etree.ElementTree as ET
from mathutils import Matrix, Vector, Euler
from pathlib import Path
argv=sys.argv[sys.argv.index('--')+1:]
p=argparse.ArgumentParser(description=__doc__);p.add_argument('urdf');p.add_argument('output');p.add_argument('degrees',nargs='?',type=float,default=0);p.add_argument('--side',action='store_true');p.add_argument('--actuator-envelope',action='store_true');args=p.parse_args(argv)
src=Path(args.urdf);out=args.output;angle=args.degrees;side_view=args.side;actuator_preview=args.actuator_envelope
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
tree=ET.parse(src).getroot(); poses={}; joints=list(tree.findall('joint')); children={j.find('child').get('link') for j in joints}
root=next(l.get('name') for l in tree.findall('link') if l.get('name') not in children);poses[root]=Matrix.Identity(4)
def pose(e):
 o=e.find('origin'); xyz=[float(x) for x in (o.get('xyz','0 0 0') if o is not None else '0 0 0').split()]; rpy=[float(x) for x in (o.get('rpy','0 0 0') if o is not None else '0 0 0').split()]
 return Matrix.Translation(Vector(xyz))@Euler(rpy,'XYZ').to_matrix().to_4x4()
while joints:
 for j in joints[:]:
  p=j.find('parent').get('link')
  if p not in poses:continue
  t=pose(j)
  if j.get('name')=='jaw_opening':t=t@Matrix.Rotation(math.radians(angle),4,Vector((0,1,0)))
  poses[j.find('child').get('link')]=poses[p]@t;joints.remove(j)
models=[]
for l in tree.findall('link'):
 for v in l.findall('visual'):
  mesh=v.find('geometry/mesh')
  if mesh is None:continue
  path=(src.parent/mesh.get('filename')).resolve()
  bpy.ops.wm.stl_import(filepath=str(path));o=bpy.context.object;o.name=v.get('name',path.stem);o.matrix_world=poses[l.get('name')]@pose(v);models.append(o)
  c=v.find('material/color');rgba=tuple(float(x) for x in c.get('rgba').split()) if c is not None else (.5,.5,.5,1)
  mat=bpy.data.materials.new(o.name);mat.diffuse_color=rgba;mat.use_nodes=True; bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=rgba
  metal=1 if any(s in o.name for s in ['bolt','shaft','washer','electrode','holder','blade','pivot','steel','screw','collar']) else .3
  bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=.34 if metal==1 else .4;o.data.materials.append(mat)
  # Same angle-limited shading on both versions, without changing geometry.
  bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35), keep_sharp_edges=True)
# Optional illustration only: barrel/rod/motor dimensions are deliberately
# authored. Only the two pin endpoints and their q-dependent relation are known.
# The preview never writes these objects into the simulation URDF or STL set.
if actuator_preview:
 sys.path.insert(0,str(Path(__file__).resolve().parent))
 from pose_preview import drive_endpoints
 a,b=map(Vector,drive_endpoints(math.radians(angle)));d=(b-a).normalized()
 def drive_cylinder(name,r,start,end,rgba):
  mid=(start+end)/2;bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=r,depth=(end-start).length,location=mid)
  o=bpy.context.object;o.name='INSPECTION_ONLY_'+name;o.rotation_euler=(end-start).to_track_quat('Z','Y').to_euler()
  mat=bpy.data.materials.new(o.name);mat.diffuse_color=rgba;mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=rgba;bs.inputs['Metallic'].default_value=.65;bs.inputs['Roughness'].default_value=.32;o.data.materials.append(mat)
  bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35),keep_sharp_edges=True);models.append(o)
 drive_cylinder('drive_barrel_envelope',.029,a+d*.025,a+d*.285,(.56,.59,.61,1))
 drive_cylinder('drive_end_cap',.035,a+d*.264,a+d*.290,(.40,.44,.45,1))
 drive_cylinder('exposed_rod_envelope',.011,a+d*.280,b-d*.018,(.64,.69,.72,1))
 drive_cylinder('motor_envelope',.041,a-d*.100,a-d*.010,(.25,.30,.32,1))
 for label,p in [('base',a),('eye',b)]:
  drive_cylinder(label+'_pin_envelope',.015,p+Vector((0,-.067,0)),p+Vector((0,.067,0)),(.32,.36,.38,1))
bounds=[o.matrix_world@Vector(c) for o in models for c in o.bound_box];mn=Vector([min(v[i] for v in bounds) for i in range(3)]);mx=Vector([max(v[i] for v in bounds) for i in range(3)]);center=(mn+mx)/2;span=max(mx-mn)
# No floor: inspection renders do not imply a mounting orientation.
bpy.ops.object.camera_add();cam=bpy.context.object
view=Vector((3.1,4.1,2.35)) if 'bx250' in src.name else Vector((2.8,-5.6,2.2));cam.location=center+view.normalized()*span*3;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=span*1.32
sc=bpy.context.scene;sc.camera=cam;sc.render.engine='CYCLES';sc.cycles.samples=64;sc.cycles.use_denoising=False;sc.render.resolution_x=1400;sc.render.resolution_y=1400;sc.render.resolution_percentage=100
for loc,power,size in [((2,-4,6),1500,4),((-4,-1,3),900,3),((1,4,5),2000,3)]:
 bpy.ops.object.light_add(type='AREA',location=center+Vector(loc)*span/2);li=bpy.context.object;li.data.energy=power*span*span/16;li.data.shape='DISK';li.data.size=size*span/2;li.rotation_euler=(center-li.location).to_track_quat('-Z','Y').to_euler()

if side_view:
 cam.location=Vector((-.015,-5,.669));cam.rotation_euler=Matrix(((0,1,0),(0,0,-1),(-1,0,0))).to_euler();cam.data.ortho_scale=1.55
 sc.render.resolution_x=1600;sc.render.resolution_y=950
sc.cycles.samples=32
sc.world.color=(.5,.5,.5);sc.view_settings.view_transform='AgX';sc.render.image_settings.file_format='PNG';sc.render.filepath=out;sc.render.film_transparent=True;bpy.ops.wm.save_as_mainfile(filepath=str(Path(out).with_suffix('.blend')));bpy.ops.render.render(write_still=True)
