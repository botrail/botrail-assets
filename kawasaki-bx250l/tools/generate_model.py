"""BX250L-B001 reference geometry, independently authored from numeric facts.

No manufacturer CAD/STL or BX300L inertia/speed values are used as inputs.
All units metres/radians. See README.md for sources and approximations.
"""
from pathlib import Path
import argparse
import sys
import math
import numpy as np
import trimesh as tm
from scipy.spatial.transform import Rotation

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent/'authoring'))
from reference_urdf import Model, cylinder

WHITE = (.79, .82, .80, 1)
DARK = (.16, .19, .19, 1)
STEEL = (.44, .48, .49, 1)
LIMITS = [(-180, 180), (-60, 76), (-120, 90), (-210, 210), (-125, 125), (-210, 210)]
SPEED = [125, 120, 100, 140, 140, 200]
# Nominal zero pose from 90151-0028DED sheet3, checked against the BX250L STEP.
ORIGINS = {'base_link': (0, 0, 0), 'link1': (0, 0, .670), 'link2': (0, .210, .670),
    'parallel_arm1': (.287, -.183923, .739459),
    'parallel_arm2': (0, .210, 1.770), 'link3': (0, .395, 2.040),
    'link4': (0, .722, 2.040), 'link5': (0, 1.745, 2.040), 'link6': (0, 2.088, 2.040),
    'flange': (0, 2.088, 2.040)}
# Actuator signs follow the manufacturer's BX-series mechanism declaration.
AXES = [(0,0,-1), (-1,0,0), (1,0,0), (0,1,0), (1,0,0), (0,1,0)]
HOLES = [(-69.282032,-40),(-69.282032,40),(-40,-69.282032),(-40,69.282032),
         (0,-80),(0,80),(40,-69.282032),(40,69.282032),(69.282032,-40),(69.282032,40)]


def build():
    m = Model(ROOT, 'bx250l-b001')
    for name, p in ORIGINS.items(): m.link(name, p)
    for i, (parent, child) in enumerate([('base_link','link1'),('link1','link2'),
        ('parallel_arm2','link3'),('link3','link4'),('link4','link5'),('link5','link6')]):
        m.joint(f'joint{i+1}', parent, child, AXES[i],
                tuple(math.radians(v) for v in LIMITS[i]), math.radians(SPEED[i]))
    # The elbow carrier keeps its orientation when JT2 moves. JT3 is defined
    # relative to this carrier, not by summing JT2 and JT3 as a serial elbow.
    m.joint('parallel_joint2', 'link2', 'parallel_arm2', (-1,0,0), mimic=('joint2',-1))
    m.joint('parallel_joint1', 'link1', 'parallel_arm1', (-1,0,0), mimic=('joint2',1))
    flange_R = np.array([[0,1,0],[0,0,1],[1,0,0]])
    m.joint('flange_joint','link6','flange',rpy=Rotation.from_matrix(flange_R).as_euler('xyz').tolist())
    from reference_geometry import add_cast_geometry
    add_cast_geometry(m)
    # Mounting-face recess and ten M10 axes retain their real nominal layout.
    plate, _ = cylinder(.100,(0,0,-.038),(0,0,0))
    recess, _ = cylinder(.050,(0,0,-.011),(0,0,.001))
    cuts = [recess]
    for x,y in HOLES:
        cut,_ = cylinder(.005,(x/1000,y/1000,-.039),(x/1000,y/1000,.001));cuts.append(cut)
    for x in (-.080,.080):
        cut,_ = cylinder(.005,(x,0,-.012),(x,0,.001));cuts.append(cut)
    plate = tm.boolean.difference([plate,*cuts],engine='manifold')
    T=np.eye(4); T[:3,:3]=flange_R;T[:3,3]=ORIGINS['flange'];plate.apply_transform(T)
    m.mesh('link6','gun_bracket_160',plate,STEEL)
    # Conservative wrist envelope: holes/recess are visual, not exact fit collision.
    m.collision('link6','cylinder',(0,2.060,2.04),(math.pi/2,0,0),radius=.100,length=.056)
    return m


if __name__ == '__main__':
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args()
    print('files',build().write(a.check))
