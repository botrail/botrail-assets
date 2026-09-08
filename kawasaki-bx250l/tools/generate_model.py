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
GREEN = (.13, .42, .22, 1)
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
    m.box('base_link','foot',( .750,.875,.030),(0,-.0625,.015),DARK)
    m.cylinder('base_link','base_pedestal',.245,(0,0,.030),(0,0,.270),WHITE)
    m.box('base_link','connector_box',(.38,.15,.19),(0,-.40,.13),DARK)
    m.cylinder('link1','turntable',.300,(0,0,.270),(0,0,.40),WHITE)
    m.box('link1','shoulder_web',(.33,.38,.27),(0,.16,.50),WHITE)
    m.cylinder('link1','shoulder_housing',.193,(-.23,.21,.67),(-.07,.21,.67),WHITE)
    m.cylinder('link1','shoulder_motor',.145,(-.32,.21,.67),(-.23,.21,.67),DARK)
    m.cylinder('link1','parallel_lower_bracket',.045,(.287,.21,.67),ORIGINS['parallel_arm1'],WHITE)
    m.cylinder('link2','upper_arm_root',.1625,(-.065,.21,.67),(.19,.21,.67),WHITE)
    m.box('link2','upper_arm',(.24,.255,.95),(.08,.21,1.235),WHITE)
    m.box('link2','upper_arm_cover',(.025,.22,.80),(.215,.21,1.20),GREEN,False)
    m.cylinder('link2','upper_arm_elbow',.092,(-.06,.21,1.77),(.22,.21,1.77),WHITE)
    # Authored carrier web matches the two documented pivot locations.
    m.box('parallel_arm2','elbow_carrier',(.16,.27,.30),(.25,.3025,1.915),WHITE)
    m.cylinder('parallel_arm2','carrier_bearing',.12,(.22,.395,2.04),(.37,.395,2.04),DARK)
    m.cylinder('parallel_arm1','parallel_rod',.042,(.287,-.183923,.739459),(.287,-.183923,1.839459),WHITE)
    m.box('parallel_arm2','parallel_carrier_rear',(.09,.43,.075),(.287,.015,1.839459),WHITE)
    m.cylinder('link3','elbow_housing',.178,(-.18,.395,2.04),(.18,.395,2.04),WHITE)
    m.cylinder('link3','wrist_swivel_base',.1735,(0,.42,2.04),(0,.722,2.04),WHITE)
    m.cylinder('link4','forearm',.125,(0,.722,2.04),(0,1.65,2.04),WHITE)
    m.box('link4','forearm_cover',(.20,.70,.025),(0,1.16,2.16),GREEN,False)
    for x in (-.13,.13):
        m.box('link4',f'wrist_fork_{"left" if x<0 else "right"}',(.085,.22,.23),(x,1.745,2.04),WHITE)
    m.cylinder('link5','wrist_bend',.120,(-.088,1.745,2.04),(.088,1.745,2.04),STEEL)
    m.cylinder('link5','wrist_body',.098,(0,1.75,2.04),(0,1.96,2.04),WHITE)
    m.cylinder('link6','wrist_output_housing',.090,(0,1.955,2.04),(0,2.050,2.04),STEEL)
    # Mounting-face recess and ten M10 axes retain their real nominal layout.
    plate, _ = cylinder(.105,(0,0,-.038),(0,0,0))
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
    m.collision('link6','cylinder',(0,2.060,2.04),(math.pi/2,0,0),radius=.105,length=.056)
    return m


if __name__ == '__main__':
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args()
    print('files',build().write(a.check))
