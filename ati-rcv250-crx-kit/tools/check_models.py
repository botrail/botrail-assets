#!/usr/bin/env python3
"""Check frame/shape correspondence against the measured mounting patterns.

These checks detect filled 'hole markers', wrong clocking and misplaced roots.
They do not certify tolerances, threads, fastener access or calibrated TCPs.
"""
from pathlib import Path
import xml.etree.ElementTree as ET

import numpy as np
import trimesh as tm

ROOT=Path(__file__).resolve().parents[1]


def mesh(name):
    m=tm.load_mesh(ROOT/'meshes'/f'{name}.stl')
    assert m.is_watertight and m.is_volume,name
    return m


def ray(m,x,y):
    points,_,_=m.ray.intersects_location([[x/1000,y/1000,-.02]],[[0,0,1]])
    return sorted(points[:,2]*1000)


def check():
    p=mesh('robot_plate');b=mesh('bracket_plate');s=mesh('spindle_housing')
    # Numeric targets measured independently from ATI CAD, in local face XY mm.
    diagonal=17.67766952966369
    for x in (-diagonal,diagonal):
        for y in (-diagonal,diagonal):assert ray(p,x,y)==[],('robot hole',x,y)
    for x in (-57.15,57.15):
        for y in (-9.525,9.525):
            assert ray(p,x,y)==[],('plate output',x,y)
            assert ray(b,x,y)==[],('bracket input',x,y)
    for x in (-15.875,15.875):
        for y in (-9.525,9.525):assert ray(b,x,y)==[],('bracket output',x,y)
    for x in (-9.525,9.525):
        for y in (-15.875,15.875):
            hits=ray(s,x,y)
            assert hits and 8<hits[0]<16,('spindle blind bore',x,y,hits)
    for m,x,y in [(p,32,0),(b,40,0),(s,0,12)]:
        assert abs(ray(m,x,y)[0])<1e-5,'mount must be on the support plane'
    np.testing.assert_allclose(p.bounds*1000,[[-63.5,-33.02,-3.302],[63.5,33.02,8.89]],atol=1e-4)
    np.testing.assert_allclose(b.bounds*1000,[[-69.85,-19.05,0],[69.85,19.05,12.7]],atol=1e-4)
    for file,height in [('3700-50-9210',.00889),('9005-50-6091',.0127),('9150-rcv250',None)]:
        root=ET.parse(ROOT/'urdf'/f'{file}.urdf').getroot()
        assert root.find("link[@name='mount']") is not None
        assert root.find("joint[@name='tcp_joint']/origin").get('xyz')=='0 0 0.0'
        if height is not None:
            assert float(root.find("joint[@name='flange_joint']/origin").get('xyz').split()[2])==height
        assert not root.findall('link/collision/geometry/mesh'),'use explicit neutral envelopes'
        for v in root.findall('link/visual/geometry/mesh'):
            assert (ROOT/'urdf'/v.get('filename')).is_file()
    print('Checked 3 support frames, 16 through holes, 4 blind bores and primitive collisions')

if __name__=='__main__':check()
