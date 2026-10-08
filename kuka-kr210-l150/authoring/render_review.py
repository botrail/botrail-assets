"""Blender 4.x review renderer. Original meshes only; no vendor images or CAD.

blender -b -t 6 --python render_review.py -- model.urdf image.png [--view side]
Alternatively --snapshot accepts the JSON written by export-review.mjs.
Fixed framing, lighting and material treatment make before/after views comparable.
This utility never changes distributed meshes.
"""
import argparse, json, math, sys, xml.etree.ElementTree as ET
from pathlib import Path
import bpy
from mathutils import Euler, Matrix, Vector
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output')
p.add_argument('--view',choices=['iso','side','rear','top'],default='iso')
p.add_argument('--pose',default='zero');p.add_argument('--snapshot',action='store_true')
p.add_argument('--samples',type=int,default=48);p.add_argument('--resolution',type=int,default=1400)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);src=Path(a.source)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
objects=[]
converted_materials=set()
def srgb_to_linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
def material(name,color,metal=.1,rough=.48):
 m=bpy.data.materials.get(name)
 if m:return m
 m=bpy.data.materials.new(name);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1)
 bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough;return m
if a.snapshot:
 data=json.loads(src.read_text())
 for part in data['meshes']:
  mesh=bpy.data.meshes.new(part['name']);mesh.from_pydata(part['vertices'],[],part['faces']);mesh.update()
  obj=bpy.data.objects.new(part['name'],mesh);bpy.context.collection.objects.link(obj)
  # Three matrices are column-major.
  obj.matrix_world=Matrix([part['matrix'][i:i+4] for i in range(0,16,4)]).transposed()
  mat=part['material'];obj.data.materials.append(material(mat['name'],mat['color'],mat['metalness'],mat['roughness']))
  if part.get('normals'):mesh.normals_split_custom_set_from_vertices(part['normals'])
  for poly in mesh.polygons:poly.use_smooth=True
  objects.append(obj)
else:
 tree=ET.parse(src).getroot();joints=list(tree.findall('joint'));child={j.find('child').get('link') for j in joints}
 roots=[l.get('name') for l in tree.findall('link') if l.get('name') not in child];assert len(roots)==1
 frames={roots[0]:Matrix.Identity(4)}
 named={'zero':[0]*6,'reach':[25,35,-35,25,-25,10],'folded':[-30,-35,60,-30,-60,20]}
 values={f'joint_a{i+1}':math.radians(q) for i,q in enumerate(named[a.pose])}
 def transform(el):
  org=el.find('origin');xyz=[float(x) for x in org.get('xyz','0 0 0').split()] if org is not None else [0]*3
  rpy=[float(x) for x in org.get('rpy','0 0 0').split()] if org is not None else [0]*3
  return Matrix.Translation(Vector(xyz))@Euler(rpy,'XYZ').to_matrix().to_4x4()
 while joints:
  ready=[j for j in joints if j.find('parent').get('link') in frames];assert ready,'invalid joint graph'
  for j in ready:
   t=transform(j)
   if j.get('type')=='revolute':t=t@Matrix.Rotation(values.get(j.get('name'),0),4,Vector([float(x) for x in j.find('axis').get('xyz').split()]))
   frames[j.find('child').get('link')]=frames[j.find('parent').get('link')]@t;joints.remove(j)
 for link in tree.findall('link'):
  for visual in link.findall('visual'):
   path=(src.parent/visual.find('geometry/mesh').get('filename')).resolve()
   bpy.ops.wm.obj_import(filepath=str(path),forward_axis='Y',up_axis='Z')
   for obj in bpy.context.selected_objects:
    obj.matrix_world=frames[link.get('name')]@transform(visual)@obj.matrix_world
    for mat in obj.data.materials:
     if not mat:continue
     mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF')
     if mat.name not in converted_materials:
      bs.inputs['Base Color'].default_value=(*[srgb_to_linear(v) for v in mat.diffuse_color[:3]],1)
      converted_materials.add(mat.name)
     bs.inputs['Metallic'].default_value=.75 if 'steel' in mat.name else .12
     bs.inputs['Roughness'].default_value=.32 if 'steel' in mat.name else .48
    objects.append(obj)
# Identical framing covers zero and verification poses without per-model re-fit.
pose_name=data['pose'] if a.snapshot else a.pose
center=Vector((.90,0,1.20)) if pose_name!='zero' else Vector((.72,0,1.18))
span=4.6 if pose_name!='zero' else 3.75
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.003));floor=bpy.context.object
floor.data.materials.append(material('review_floor',(.10,.12,.145),0,.85))
if a.view=='side':floor.hide_render=True
direction=Vector({'iso':(3,-5,2.1),'side':(0,-1,.01),'rear':(-3,4,1.8),'top':(0,0,1)}[a.view]).normalized()
bpy.ops.object.camera_add();cam=bpy.context.object;cam.location=center+direction*10
cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=span
sc=bpy.context.scene;sc.camera=cam;sc.render.engine='CYCLES';sc.cycles.samples=a.samples
sc.cycles.use_denoising=False;sc.render.resolution_x=a.resolution;sc.render.resolution_y=a.resolution;sc.render.resolution_percentage=100
for loc,power,size in [((1,-4,6),1600,4),((-4,-1,4),1100,3),((2,4,5),1900,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power*.50;light.data.shape='DISK';light.data.size=size
 light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
sc.world.color=(.16,.16,.16);sc.view_settings.view_transform='AgX';sc.view_settings.exposure=-.30
sc.render.image_settings.file_format='PNG';sc.render.filepath=a.output
bpy.ops.wm.save_as_mainfile(filepath=str(Path(a.output).with_suffix('.blend')))
bpy.ops.render.render(write_still=True)
