"""Blender 4.x URDF/OBJ comparison renderer; OnRobot RG2 / RG6.
All cameras and lights are fixed between before/after. No browser QA is implied.
"""
import argparse,json,sys,xml.etree.ElementTree as ET
from pathlib import Path
import bpy
from mathutils import Euler,Matrix,Vector
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output')
p.add_argument('--view',choices=['iso','front','side','rear','top','linkage','bracket'],default='iso')
p.add_argument('--model',choices=['rg2','rg6'],default='rg6');p.add_argument('--materials');p.add_argument('--samples',type=int,default=40)
p.add_argument('--resolution',type=int,default=1200);p.add_argument('--pose',default='{}')
a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);src=Path(a.source);qmap=json.loads(a.pose)
props=json.loads(Path(a.materials).read_text()) if a.materials else {}
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
def transform(el):
    org=el.find('origin');xyz=[float(x) for x in org.get('xyz','0 0 0').split()] if org is not None else [0]*3
    rpy=[float(x) for x in org.get('rpy','0 0 0').split()] if org is not None else [0]*3
    return Matrix.Translation(Vector(xyz))@Euler(rpy,'XYZ').to_matrix().to_4x4()
tree=ET.parse(src).getroot();joints=list(tree.findall('joint'));children={j.find('child').get('link') for j in joints}
roots=[l.get('name') for l in tree.findall('link') if l.get('name') not in children];assert len(roots)==1
frames={roots[0]:Matrix.Identity(4)};converted=set()
while joints:
    ready=[j for j in joints if j.find('parent').get('link') in frames];assert ready,'Invalid joint graph'
    for j in ready:
        t=transform(j)
        if j.get('type')!='fixed':
            m=j.find('mimic');q=qmap.get(j.get('name'),0) if m is None else qmap.get(m.get('joint'),0)*float(m.get('multiplier','1'))+float(m.get('offset','0'))
            axis=Vector([float(x) for x in j.find('axis').get('xyz').split()])
            t=t@(Matrix.Translation(axis*q) if j.get('type')=='prismatic' else Matrix.Rotation(q,4,axis))
        frames[j.find('child').get('link')]=frames[j.find('parent').get('link')]@t;joints.remove(j)
for link in tree.findall('link'):
    for visual in link.findall('visual'):
        path=(src.parent/visual.find('geometry/mesh').get('filename')).resolve()
        bpy.ops.wm.obj_import(filepath=str(path),forward_axis='Y',up_axis='Z')
        for obj in bpy.context.selected_objects:
            obj.matrix_world=frames[link.get('name')]@transform(visual)@obj.matrix_world
            for mat in obj.data.materials:
                if not mat or mat.name in converted:continue
                mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF')
                bs.inputs['Base Color'].default_value=(*[linear(v) for v in mat.diffuse_color[:3]],1)
                pr=props.get(mat.name,{'metalness':.12,'roughness':.48})
                bs.inputs['Metallic'].default_value=pr['metalness'];bs.inputs['Roughness'].default_value=pr['roughness'];converted.add(mat.name)
center=Vector((0,0,.14 if a.model=='rg6' else .115));span=.35 if a.model=='rg6' else .285
if a.view=='linkage':center=Vector((-.045 if a.model=='rg6' else -.032,0,.175 if a.model=='rg6' else .15));span=.155 if a.model=='rg6' else .125
elif a.view=='bracket':center=Vector((0,0,.045 if a.model=='rg6' else .04));span=.14 if a.model=='rg6' else .12
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.003));floor=bpy.context.object
mat=bpy.data.materials.new('review_floor');mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF')
bs.inputs['Base Color'].default_value=(.10,.12,.145,1);bs.inputs['Roughness'].default_value=.85;floor.data.materials.append(mat)
floor.hide_render=a.view in ['side','front','top']
direction=Vector({'iso':(2,-4,1.6),'front':(0,-1,.01),'side':(1,0,.01),'rear':(-2,4,1.6),'top':(0,0,1),'linkage':(1,-4,1),'bracket':(2,-4,1)}[a.view]).normalized()
bpy.ops.object.camera_add();cam=bpy.context.object;cam.location=center+direction*12
cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=span
sc=bpy.context.scene;sc.camera=cam;sc.render.engine='CYCLES';sc.cycles.samples=a.samples;sc.cycles.use_denoising=False
sc.render.resolution_x=a.resolution;sc.render.resolution_y=a.resolution;sc.render.resolution_percentage=100
for loc,power,size in [((1,-4,6),1400,4),((-4,-1,4),950,3),((2,4,5),1600,3),((4,1,2),700,3)]:
    bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object
    light.data.energy=power;light.data.shape='DISK';light.data.size=size
    light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
sc.world.use_nodes=True;sc.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.42,.46,.51,1)
sc.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.50;sc.view_settings.view_transform='AgX';sc.view_settings.exposure=-.30
sc.render.image_settings.file_format='PNG';sc.render.filepath=a.output;bpy.ops.render.render(write_still=True)
assert Path(a.output).is_file(),'Missing rendered output'
