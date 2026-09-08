"""Independently authored 95.020.516/P3U reference: received closed pose.

Numeric CAD measurements are facts, not imported CAD topology. Drive stroke,
opening speed and calibrated TCP are unknown. No invented motion is emitted.
"""
from pathlib import Path
import argparse
import sys
import math
import numpy as np
import trimesh as tm

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT.parent/'authoring'))
from reference_urdf import Model, cylinder

ALUMINUM=(.68,.71,.72,1)
STEEL=(.40,.44,.46,1)
DARK=(.12,.15,.16,1)
COPPER=(.65,.36,.19,1)
BLUE=(.12,.34,.47,1)
HOLES=[(-69.282032,-40),(-69.282032,40),(-40,-69.282032),(-40,69.282032),
       (0,-80),(0,80),(40,-69.282032),(40,69.282032),(69.282032,-40),(69.282032,40)]


def zcyl(r,z0,z1,x=0,y=0):
    return cylinder(r,(x,y,z0),(x,y,z1))[0]


def build():
    m=Model(ROOT,'95-020-516-p3u')
    for name,origin in [('mount',(0,0,0)),('coupling',(0,0,0)),('flange',(0,0,.019)),
                        ('body',(0,0,.042)),('cad_tip',(-.0134,0,1.332))]:
        m.link(name,origin)
    for parent,child in [('mount','coupling'),('coupling','flange'),('flange','body')]:
        m.joint(parent+'_to_'+child,parent,child)
    m.joint('cad_tip_joint','body','cad_tip',rpy=(0,math.pi/2,0))
    # Contact geometry: 7-mm clearance-hole plate, 1-mm washers, 25-mm screws.
    plate=tm.creation.box((.182,.186,.007),transform=tm.transformations.translation_matrix((0,0,.0035)))
    pilot=zcyl(.050,-.005,0)
    cuts=[zcyl(.0055,-.006,.008,x/1000,y/1000) for x,y in HOLES]
    plate=tm.boolean.difference([tm.boolean.union([plate,pilot],engine='manifold'),*cuts],engine='manifold')
    m.mesh('coupling','mount_plate',plate,STEEL)
    m.collision('coupling','box',(0,0,.0035),size=(.182,.186,.007))
    # Housing contour is approximate; the two supporting planes are measured.
    housing=zcyl(.083,.007,.019)
    housing=tm.boolean.difference([housing,*[zcyl(.0085,.006,.020,x/1000,y/1000) for x,y in HOLES]],engine='manifold')
    m.mesh('coupling','quick_coupling_housing',housing,ALUMINUM)
    m.collision('coupling','cylinder',(0,0,.013),radius=.083,length=.012)
    m.cylinder('coupling','location_pin',.005,(-.08,0,-.011),(-.08,0,.007),STEEL,False)
    for i,(x,y) in enumerate(HOLES,1):
        x,y=x/1000,y/1000
        washer=tm.boolean.difference([zcyl(.008,.007,.008,x,y),zcyl(.0052,.006,.009,x,y)],engine='manifold')
        m.mesh('coupling',f'washer_h{i}',washer,STEEL)
        name=f'mount_bolt_h{i}';m.link(name,(x,y,.008));m.joint(name+'_joint','coupling',name)
        m.cylinder(name,f'CB10_25_shaft_h{i}',.005,(x,y,-.017),(x,y,.008),DARK,False)
        m.cylinder(name,f'CB10_25_head_h{i}',.008,(x,y,.008),(x,y,.018),DARK,False)
    # Flange outline is simplified, but its measured 19/42-mm support planes stay.
    m.box('flange','flange_plate',(.177,.172,.023),(0,0,.0305),ALUMINUM)
    # Main supports and transformer: independently arranged simple solids within
    # measured part envelopes. Small ports, flexible hoses and internal drive omitted.
    for side,slug in [(-1,'left'),(1,'right')]:
        y=side*.058
        m.box('body',f'lower_frame_{slug}',(.15,.012,.47),(-.0134,y,.277),ALUMINUM)
        m.box('body',f'transformer_cheek_{slug}',(.32,.012,.14),(-.12,y,.51),ALUMINUM)
    m.box('body','transformer_core',(.24,.142,.25),(-.16,0,.20),BLUE)
    for z in [.095,.145,.195,.245,.295]:
        m.box('body',f'transformer_rib_{int(z*1000)}',(.245,.148,.008),(-.16,0,z),ALUMINUM,False)
    m.cylinder('body','drive_housing',.05,(-.30,0,.38),(-.045,0,.49),DARK)
    m.cylinder('body','drive_rod_closed_pose',.018,(-.045,0,.49),(.20,0,.60),STEEL)
    m.cylinder('body','gun_pivot',.045,(-.0134,-.09,.632),(-.0134,.09,.632),STEEL)
    for x,slug in [(-.2259,'left'),(.1991,'right')]:
        m.box('body',f'{slug}_arm_clamp',(.18,.10,.10),(x,0,.632),ALUMINUM)
        m.box('body',f'{slug}_arm_lower',(.09,.040,.20),(x,0,.682),COPPER)
        # Blade extends to the numeric electrode holder height, leaving the
        # throat empty. Collision consists of these individual primitives.
        arm_x=x+(.025 if x<0 else -.025)
        m.box('body',f'{slug}_arm_blade',(.055,.040,.53),(arm_x,0,1.047),COPPER)
        holder_x=-.1634 if x<0 else .1366
        m.cylinder('body',f'{slug}_arm_tip_bend',.020,(arm_x,0,1.300),(holder_x,0,1.332),COPPER)
    m.box('body','cross_support',(.40,.075,.075),(-.0134,0,.61),ALUMINUM)
    m.cylinder('body','left_holder',.0132,(-.1634,0,1.332),(-.0334,0,1.332),COPPER)
    m.cylinder('body','right_holder',.0132,(.1366,0,1.332),(.0066,0,1.332),COPPER)
    m.cylinder('body','left_electrode',.008,(-.0334,0,1.332),(-.0134,0,1.332),COPPER)
    m.cylinder('body','right_electrode',.008,(.0066,0,1.332),(-.0134,0,1.332),COPPER)
    return m


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args()
    print('files',build().write(a.check))
