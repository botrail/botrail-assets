"""Blender 4.x static URDF/OBJ review renderer for the WB-P352L reference.

node export-materials.mjs > /tmp/daihen-materials.json
blender -b -t 6 --python render_review.py -- model.urdf image.png \
    --view iso --materials /tmp/daihen-materials.json

Fixed cabinet-scale camera/lighting; no vendor images or model changes.
The optional material map restores authored PBR values absent from OBJ/MTL.
"""
import argparse,json,sys,xml.etree.ElementTree as ET
from pathlib import Path
import bpy
from mathutils import Euler,Matrix,Vector
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output')
p.add_argument('--view',choices=['iso','front','side','rear','top'],default='iso')
p.add_argument('--materials');p.add_argument('--samples',type=int,default=48)
p.add_argument('--resolution',type=int,default=1200);p.add_argument('--save-blend',action='store_true')
a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);src=Path(a.source)
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
        assert j.get('type')=='fixed','This renderer intentionally supports this static reference only'
        frames[j.find('child').get('link')]=frames[j.find('parent').get('link')]@transform(j);joints.remove(j)
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
                bs.inputs['Metallic'].default_value=pr['metalness'];bs.inputs['Roughness'].default_value=pr['roughness']
                converted.add(mat.name)
center=Vector((0,0,.34));span=1.0
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.003));floor=bpy.context.object
mat=bpy.data.materials.new('review_floor');mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF')
bs.inputs['Base Color'].default_value=(.10,.12,.145,1);bs.inputs['Roughness'].default_value=.85;floor.data.materials.append(mat)
floor.hide_render=a.view in ['side','front','top']
direction=Vector({'iso':(-3,-5,2.3),'front':(0,-1,.01),'side':(-1,0,.01),'rear':(-3,4,1.8),'top':(0,0,1)}[a.view]).normalized()
bpy.ops.object.camera_add();cam=bpy.context.object;cam.location=center+direction*10
cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=span
sc=bpy.context.scene;sc.camera=cam;sc.render.engine='CYCLES';sc.cycles.samples=a.samples
# This portable Blender build has no OpenImageDenoise. Never require it for review.
sc.cycles.use_denoising=False;sc.render.resolution_x=a.resolution;sc.render.resolution_y=a.resolution;sc.render.resolution_percentage=100
for loc,power,size in [((1,-4,6),1600,4),((-4,-1,4),1100,3),((2,4,5),1900,3)]:
    bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object
    light.data.energy=power*.35;light.data.shape='DISK';light.data.size=size
    light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
sc.world.color=(.16,.16,.16);sc.view_settings.view_transform='AgX';sc.view_settings.exposure=-.30
sc.render.image_settings.file_format='PNG';sc.render.filepath=a.output
if a.save_blend:bpy.ops.wm.save_as_mainfile(filepath=str(Path(a.output).with_suffix('.blend')))
bpy.ops.render.render(write_still=True)
assert Path(a.output).is_file(),'Missing rendered output'
