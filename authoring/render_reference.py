"""Blender-only read/render utility; never exports or rewrites model geometry.

Usage: blender -b -t 6 --python authoring/render_reference.py -- MODEL.urdf OUT.png [JAW_DEGREES]
Writes OUT.png and a review-only OUT.blend scene. No Python package installation
is needed beyond Blender's bundled Python. Applies the same camera/lighting and
material mapping to either the original or refined URDF.
"""
import bpy,sys,os,math,xml.etree.ElementTree as ET
from mathutils import Matrix, Vector, Euler
from pathlib import Path
argv=sys.argv[sys.argv.index('--')+1:]
import argparse
parser=argparse.ArgumentParser()
parser.add_argument('source');parser.add_argument('output');parser.add_argument('jaw_degrees',nargs='?',type=float,default=0)
parser.add_argument('--view',choices=['iso','side','front','top','source'],default='iso')
parser.add_argument('--samples',type=int,default=64);parser.add_argument('--resolution',type=int,default=1400)
args=parser.parse_args(argv);src=Path(args.source);out=args.output;angle=args.jaw_degrees
qmap={'jaw_opening':math.radians(angle)}
if args.view=='source' and 'bx250' in src.name:qmap.update(joint2=math.radians(-12),joint3=math.radians(30))
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
  if j.get('type')!='fixed':
   mimic=j.find('mimic');q=qmap.get(j.get('name'),0) if mimic is None else qmap.get(mimic.get('joint'),0)*float(mimic.get('multiplier','1'))+float(mimic.get('offset','0'))
   axis=Vector(tuple(float(v) for v in j.find('axis').get('xyz').split()))
   t=t@Matrix.Rotation(q,4,axis)
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
bounds=[o.matrix_world@Vector(c) for o in models for c in o.bound_box];mn=Vector([min(v[i] for v in bounds) for i in range(3)]);mx=Vector([max(v[i] for v in bounds) for i in range(3)]);center=(mn+mx)/2;span=max(mx-mn)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,mn.z-.001));floor=bpy.context.object;mat=bpy.data.materials.new('floor');mat.diffuse_color=(.14,.17,.20,1);floor.data.materials.append(mat)
bpy.ops.object.camera_add();cam=bpy.context.object
view=Vector((3.1,4.1,2.35)) if 'bx250' in src.name else Vector((2.8,-5.6,2.2))
if args.view!='iso':view=Vector({'side':(1,0,0),'front':(0,1,0),'top':(0,0,1),'source':(-5,3,1.8)}[args.view])
cam.location=center+view.normalized()*span*3;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=span*1.32
sc=bpy.context.scene;sc.camera=cam;sc.render.engine='CYCLES';sc.cycles.samples=args.samples;sc.cycles.use_denoising=False;sc.render.resolution_x=args.resolution;sc.render.resolution_y=args.resolution;sc.render.resolution_percentage=100
for loc,power,size in [((2,-4,6),1500,4),((-4,-1,3),900,3),((1,4,5),2000,3)]:
 bpy.ops.object.light_add(type='AREA',location=center+Vector(loc)*span/2);li=bpy.context.object;li.data.energy=power*span*span/16;li.data.shape='DISK';li.data.size=size*span/2;li.rotation_euler=(center-li.location).to_track_quat('-Z','Y').to_euler()
sc.world.color=(.10,.10,.10);sc.view_settings.view_transform='AgX';sc.render.image_settings.file_format='PNG';sc.render.filepath=out;sc.render.film_transparent=False;bpy.ops.wm.save_as_mainfile(filepath=str(Path(out).with_suffix('.blend')));bpy.ops.render.render(write_still=True)
