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
p.add_argument('--view',choices=['iso','side','front','rear','top'],default='iso')
p.add_argument('--pose',choices=['zero','reach','low','folded'],default='zero');p.add_argument('--snapshot',action='store_true')
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
 named={'zero':[0,0,0,0],'reach':[30,79,0,40],'low':[-20,100,-90,0],'folded':[0,-44,-26,0]}
 values={f'J{i+1}':math.radians(q) for i,q in enumerate(named[a.pose])}
 by_name={j.get('name'):j for j in joints}
 def value(j):
  mimic=j.find('mimic')
  if mimic is not None:return value(by_name[mimic.get('joint')])*float(mimic.get('multiplier','1'))+float(mimic.get('offset','0'))
  return values.get(j.get('name'),0)
 def transform(el):
  org=el.find('origin');xyz=[float(x) for x in org.get('xyz','0 0 0').split()] if org is not None else [0]*3
  rpy=[float(x) for x in org.get('rpy','0 0 0').split()] if org is not None else [0]*3
  return Matrix.Translation(Vector(xyz))@Euler(rpy,'XYZ').to_matrix().to_4x4()
 while joints:
  ready=[j for j in joints if j.find('parent').get('link') in frames];assert ready,'invalid joint graph'
  for j in ready:
   t=transform(j)
   if j.get('type') in ('revolute','continuous'):t=t@Matrix.Rotation(value(j),4,Vector([float(x) for x in j.find('axis').get('xyz').split()]))
   frames[j.find('child').get('link')]=frames[j.find('parent').get('link')]@t;joints.remove(j)
 Path(a.output+'.frames.json').write_text(json.dumps({k:[list(row) for row in v] for k,v in frames.items()}))
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
# Zero-pose before/after use identical framing. Other poses are fitted to every
# mesh in camera space so distal wrists and complete linkage rods cannot clip.
pose_name=data['pose'] if a.snapshot else a.pose
center=Vector((1.00,0,1.12)) if pose_name!='low' else Vector((.55,0,.40))
span=4.3 if pose_name!='low' else 4.8
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.003));floor=bpy.context.object
floor.data.materials.append(material('review_floor',(.10,.12,.145),0,.85))
if a.view in ['side','front','top'] or pose_name=='low':floor.hide_render=True
direction=Vector({'iso':(3,-5,2.1),'side':(0,-1,.01),'front':(1,0,.01),'rear':(-3,4,1.8),'top':(0,0,1)}[a.view]).normalized()
points=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
right=Vector((0,0,1)).cross(direction)
if right.length<1e-8:right=Vector((1,0,0))
right.normalize();up=direction.cross(right).normalized()
if pose_name!='zero':
 center=sum(points,Vector())/len(points)
 x=[(v-center).dot(right) for v in points];y=[(v-center).dot(up) for v in points]
 center+=right*((max(x)+min(x))/2)+up*((max(y)+min(y))/2)
 span=max(max(x)-min(x),max(y)-min(y))*1.18
x=[(v-center).dot(right) for v in points];y=[(v-center).dot(up) for v in points]
assert max(abs(v) for v in x+y)<span/2, f'Clipped robot in {pose_name}/{a.view}'
Path(a.output+'.framing.json').write_text(json.dumps({'pose':pose_name,'view':a.view,'span':span,
 'camera_center':list(center),'horizontal_bounds':[min(x),max(x)],'vertical_bounds':[min(y),max(y)],'all_mesh_bounds_inside':True}))
bpy.ops.object.camera_add();cam=bpy.context.object;cam.location=center+direction*10
cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=span
sc=bpy.context.scene;sc.camera=cam;sc.render.engine='CYCLES';sc.cycles.samples=a.samples
sc.cycles.use_denoising=False;sc.render.resolution_x=a.resolution;sc.render.resolution_y=a.resolution;sc.render.resolution_percentage=100
for loc,power,size in [((1,-4,6),1600,4),((-4,-1,4),1100,3),((2,4,5),1900,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power*.50;light.data.shape='DISK';light.data.size=size
 light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
sc.world.color=(.16,.16,.16);sc.view_settings.view_transform='AgX';sc.view_settings.exposure=-.30
sc.render.image_settings.file_format='PNG';sc.render.filepath=a.output
# Review images are derived artifacts; no .blend file is distributed.
bpy.ops.render.render(write_still=True)
