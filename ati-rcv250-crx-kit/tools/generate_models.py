#!/usr/bin/env python3
"""CC0 reference geometry from numeric measurements, without CAD input.

All dimensions below are mm. Export once to metres. See docs/measurements.md
for measured values, authored approximations and source hashes. No manufacturer
CAD, tessellation, image or traced contour is needed to regenerate these files.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import xml.etree.ElementTree as ET

import numpy as np
import trimesh as tm

ROOT = Path(__file__).resolve().parents[1]
N = 64
MM = .001
# Measured plate interfaces and body envelope.
PLATE_SIZE = (127., 66.04, 8.89)
PLATE_RADIUS = 3.302
PLATE_BOSS_RADIUS = 15.73149
PLATE_BOSS_HEIGHT = 3.302
PLATE_BORE_RADIUS = 10.16
ROBOT_PCD = 50.
ROBOT_HOLE_RADIUS = 3.38
ROBOT_COUNTERBORE_RADIUS = 5.625
ROBOT_COUNTERBORE_FLOOR = 2.51
BENCH_HALF_PATTERN = (57.15, 9.525)
BRACKET_SIZE = (139.7, 38.1, 12.7)
BRACKET_RADIUS = 3.302
BRACKET_HOLE_RADIUS = 3.378
BRACKET_COUNTERBORE_RADIUS = 5.626
BRACKET_COUNTERBORE_FLOOR = 6.325
TOOL_HALF_PATTERN = (15.875, 9.525)
# Original spindle axis x, side mount center x=30.48, y=-36.46.
SPINDLE_MOUNT_X = 30.48
SPINDLE_AXIS_HEIGHT = 36.46
HOUSING_RADIUS = 41.275
HOUSING_X = (0., 79.)
SIDE_FLAT_END_X = 60.96
REAR_X = (-24.13, 0.)
FRONT_RING_X = (79., 86.493)
NOSE_X = (86.493, 101.733, 175.774, 195.002)
SPINDLE_HALF_PATTERN = (9.525, 15.875)
# Appearance only: manufacturer thread depth/collet details are not asserted.
VISUAL_THREAD_DEPTH = 12.
VISUAL_COUNTERBORE_FLOOR = 6.325
COLLET_BORE_RADIUS = 3.2


def box(size, center):
    return tm.creation.box(size, transform=tm.transformations.translation_matrix(center))


def cyl(radius, z0, z1, x=0., y=0.):
    m = tm.creation.cylinder(radius=radius, height=z1-z0, sections=N)
    m.apply_translation([x, y, (z0+z1)/2])
    return m


def union(meshes):
    return tm.boolean.union(meshes, engine='manifold')


def subtract(mesh, cuts):
    return tm.boolean.difference([mesh, *cuts], engine='manifold')


def rounded_plate(size, radius):
    x,y,z=size
    return union([box((x-2*radius,y,z),(0,0,z/2)), box((x,y-2*radius,z),(0,0,z/2)),
                  *(cyl(radius,0,z,a,b) for a in (-x/2+radius,x/2-radius) for b in (-y/2+radius,y/2-radius))])


def grid(x,y):
    return [(a,b) for a in (-x,x) for b in (-y,y)]


def robot_plate():
    h=PLATE_SIZE[2]
    body=union([rounded_plate(PLATE_SIZE,PLATE_RADIUS),cyl(PLATE_BOSS_RADIUS,-PLATE_BOSS_HEIGHT,0)])
    holes=[cyl(PLATE_BORE_RADIUS,-4,10)]
    for x,y in grid(ROBOT_PCD/(2*np.sqrt(2)),ROBOT_PCD/(2*np.sqrt(2))):
        holes += [cyl(ROBOT_HOLE_RADIUS,-1,h+1,x,y),cyl(ROBOT_COUNTERBORE_RADIUS,ROBOT_COUNTERBORE_FLOOR,h+1,x,y)]
    for x,y in grid(*BENCH_HALF_PATTERN): holes.append(cyl(3.,-1,h+1,x,y))
    for x,y in [(25.,0.),(0.,-25.)]:holes.append(cyl(3.02387,-1,h+1,x,y))
    for x in (-57.15,57.15):holes.append(cyl(2.996565,-1,h+1,x,0))
    # Other measured attachment holes are retained visually, without assigning
    # undocumented compatibility to their patterns.
    for x in (-47.5,47.5):
        holes.append(cyl(2.02311,-1,h+1,x,0))
        for y in (-12.5,12.5):holes.append(cyl(3.,-1,h+1,x,y))
    for x in (-43.,43.):
        holes.append(cyl(2.52349,-1,h+1,x,3.162))
        for y in (-19.838,26.162):holes.append(cyl(3.,-1,h+1,x,y))
    return subtract(body,holes)


def bracket_plate():
    h=BRACKET_SIZE[2]
    holes=[]
    for x,y in grid(*BENCH_HALF_PATTERN):
        holes += [cyl(BRACKET_HOLE_RADIUS,-1,h+1,x,y),cyl(BRACKET_COUNTERBORE_RADIUS,BRACKET_COUNTERBORE_FLOOR,h+1,x,y)]
    for x,y in grid(*TOOL_HALF_PATTERN):
        # The supplied STEP has these screws installed. Counterbore and
        # clearance envelope are authored approximations, not fit evidence.
        holes += [cyl(BRACKET_HOLE_RADIUS,-1,h+1,x,y),cyl(BRACKET_COUNTERBORE_RADIUS,-1,VISUAL_COUNTERBORE_FLOOR,x,y)]
    for x,y,r in [(-57.15,0,3.02387),(57.15,0,3.02387),(0,-9.525,2.996565),(0,9.525,2.996565)]:
        holes.append(cyl(r,-1,h+1,x,y))
    return subtract(rounded_plate(BRACKET_SIZE,BRACKET_RADIUS),holes)


def axial(radius,x0,x1):
    m=cyl(radius,x0,x1)
    m.apply_transform(tm.transformations.rotation_matrix(np.pi/2,[0,1,0]))
    m.apply_translation([-SPINDLE_MOUNT_X,0,SPINDLE_AXIS_HEIGHT])
    return m


def spindle_housing():
    body=axial(HOUSING_RADIUS,*HOUSING_X)
    # Preserve the mounting flat only over its measured axial interval.
    body=subtract(body,[box((SIDE_FLAT_END_X,120,80),(SIDE_FLAT_END_X/2-SPINDLE_MOUNT_X,0,-40))])
    holes=[cyl(3.,-1,VISUAL_THREAD_DEPTH,x,y) for x,y in grid(*SPINDLE_HALF_PATTERN)]
    holes += [cyl(3.02387,-1,8.,x,0) for x in (-9.525,9.525)]
    return subtract(body,holes)


def spindle_nose():
    a,b,c,d=NOSE_X
    parts=[axial(22.5,a,b),axial(12.7,b,c),axial(7.,c,d)]
    # Empty reference collet; no unselected cutting bit or tool-tip frame.
    return subtract(union(parts),[axial(COLLET_BORE_RADIUS,c-1,d+1)])


def spindle_ports():
    # Connector envelopes measured from CAD bounds. Hex facets are authored.
    rear=axial(9.75,-30.309,REAR_X[0])
    side=cyl(5.9944,SPINDLE_AXIS_HEIGHT+34.3407,SPINDLE_AXIS_HEIGHT+62.9158,-17.54105-SPINDLE_MOUNT_X,0)
    return tm.util.concatenate([rear,side])


def visual(link,mesh,color):
    v=ET.SubElement(link,'visual')
    ET.SubElement(ET.SubElement(v,'geometry'),'mesh',filename='../meshes/'+mesh+'.stl')
    ET.SubElement(ET.SubElement(v,'material',name=mesh),'color',rgba=color)


def collision(link,kind,size,xyz,rpy=(0,0,0)):
    c=ET.SubElement(link,'collision')
    ET.SubElement(c,'origin',xyz=' '.join(str(v*MM) for v in xyz),rpy=' '.join(map(str,rpy)))
    g=ET.SubElement(c,'geometry')
    if kind=='box':ET.SubElement(g,'box',size=' '.join(str(v*MM) for v in size))
    else:ET.SubElement(g,'cylinder',radius=str(size[0]*MM),length=str(size[1]*MM))


def frame(robot,name,z):
    ET.SubElement(robot,'link',name=name)
    j=ET.SubElement(robot,'joint',name=name+'_joint',type='fixed')
    ET.SubElement(j,'parent',link='mount'); ET.SubElement(j,'child',link=name)
    ET.SubElement(j,'origin',xyz=f'0 0 {z*MM}',rpy='0 0 0')


def model(name,meshes):
    r=ET.Element('robot',name=name)
    r.append(ET.Comment('CC0 procedural reference. See ../README.md; no physical fit or calibrated cutting TCP is asserted.'))
    link=ET.SubElement(r,'link',name='mount')
    for mesh,color in meshes:visual(link,mesh,color)
    frame(r,'tcp',0)  # Explicit uncalibrated mounting reference, not a cutting tip.
    return r,link


def all_models():
    plate,link=model('ati_3700_50_9210',[('robot_plate','.16 .18 .21 1')])
    collision(link,'box',PLATE_SIZE,(0,0,PLATE_SIZE[2]/2))
    collision(link,'cylinder',(PLATE_BOSS_RADIUS,PLATE_BOSS_HEIGHT),(0,0,-PLATE_BOSS_HEIGHT/2))
    frame(plate,'flange',PLATE_SIZE[2])
    bracket,link=model('ati_9005_50_6091',[('bracket_plate','.24 .27 .30 1')])
    collision(link,'box',BRACKET_SIZE,(0,0,BRACKET_SIZE[2]/2))
    frame(bracket,'flange',BRACKET_SIZE[2])
    spindle,link=model('ati_rcv250',[
        ('spindle_housing','.93 .42 .055 1'),('spindle_rear','.13 .15 .18 1'),
        ('spindle_front','.14 .16 .18 1'),('spindle_nose','.55 .59 .63 1'),('spindle_ports','.65 .68 .70 1')])
    # Conservative neutral envelopes, not bore/fastener/contact geometry.
    collision(link,'box',(SIDE_FLAT_END_X,2*HOUSING_RADIUS,SPINDLE_AXIS_HEIGHT+HOUSING_RADIUS),
              (0,0,(SPINDLE_AXIS_HEIGHT+HOUSING_RADIUS)/2))
    for radius,x0,x1 in [(HOUSING_RADIUS,*REAR_X),(HOUSING_RADIUS,SIDE_FLAT_END_X,FRONT_RING_X[1]),
                         (22.5,NOSE_X[0],NOSE_X[1]),(12.7,NOSE_X[1],NOSE_X[2]),(7.,NOSE_X[2],NOSE_X[3]),(9.75,-30.309,REAR_X[0])]:
        collision(link,'cylinder',(radius,x1-x0),((x0+x1)/2-SPINDLE_MOUNT_X,0,SPINDLE_AXIS_HEIGHT),(0,np.pi/2,0))
    collision(link,'cylinder',(5.9944,28.5751),(-17.54105-SPINDLE_MOUNT_X,0,SPINDLE_AXIS_HEIGHT+48.62825))
    return {'3700-50-9210':plate,'9005-50-6091':bracket,'9150-rcv250':spindle}


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    meshes={'robot_plate':robot_plate(),'bracket_plate':bracket_plate(),'spindle_housing':spindle_housing(),
            'spindle_rear':axial(HOUSING_RADIUS,*REAR_X),'spindle_front':axial(40.08438,*FRONT_RING_X),
            'spindle_nose':spindle_nose(),'spindle_ports':spindle_ports()}
    for name,m in meshes.items():
        assert m.is_watertight and m.is_volume,name
        m.apply_scale(MM)
        content=m.export(file_type='stl');path=ROOT/'meshes'/f'{name}.stl'
        if args.check:assert path.read_bytes()==content,path
        else:path.write_bytes(content)
    for name,r in all_models().items():
        ET.indent(r)
        content=ET.tostring(r,encoding='unicode')+'\n';path=ROOT/'urdf'/f'{name}.urdf'
        if args.check:assert path.read_text()==content,path
        else:path.write_text(content)
    print('Verified' if args.check else 'Generated',len(meshes),'meshes and 3 URDF models')

if __name__=='__main__':main()
