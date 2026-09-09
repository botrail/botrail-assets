"""Drawing-based regression checks independent of the authoring helpers."""
from pathlib import Path
import math
import unittest
import xml.etree.ElementTree as ET
import numpy as np
import trimesh
from scipy.spatial.transform import Rotation

ROOT=Path(__file__).resolve().parents[2]

def rotation(axis,q):
    return Rotation.from_rotvec(np.array(axis)*q).as_matrix()

def forward(tree,angles):
    joints=list(tree.findall('joint')); children={j.find('child').get('link') for j in joints}
    root=next(l.get('name') for l in tree.findall('link') if l.get('name') not in children)
    poses={root:np.eye(4)}
    while joints:
        progress=False
        for j in joints[:]:
            parent=j.find('parent').get('link')
            if parent not in poses:continue
            origin=j.find('origin');t=np.eye(4)
            t[:3,3]=np.fromstring(origin.get('xyz','0 0 0'),sep=' ')
            t[:3,:3]=Rotation.from_euler('xyz',np.fromstring(origin.get('rpy','0 0 0'),sep=' ')).as_matrix()
            if j.get('type')!='fixed':
                mimic=j.find('mimic')
                q=angles.get(j.get('name'),0) if mimic is None else angles[mimic.get('joint')]*float(mimic.get('multiplier','1'))
                t[:3,:3]=t[:3,:3]@rotation(np.fromstring(j.find('axis').get('xyz'),sep=' '),q)
            poses[j.find('child').get('link')]=poses[parent]@t
            joints.remove(j);progress=True
        assert progress,'Disconnected/cyclic joint tree'
    return poses

def drawing_flange(q):
    # BX250L sheet 3 and BX parallel carrier: upper-arm tilt translates J3,
    # but does not rotate the J3 carrier. Independent of URDF joint origins.
    base=rotation([0,0,1],-q[0]);upper=rotation([1,0,0],-q[1])
    elbow=base@(np.array([0,.210,.670])+upper@np.array([0,0,1.100])+np.array([0,.185,.270]))
    arm=base@rotation([1,0,0],q[2]);wrist=arm@rotation([0,1,0],q[3])@rotation([1,0,0],q[4])
    t=np.eye(4);t[:3,3]=elbow+arm@np.array([0,1.350,0])+wrist@np.array([0,.343,0])
    t[:3,:3]=wrist@rotation([0,1,0],q[5])@np.array([[0,1,0],[0,0,1],[1,0,0]])
    return t

class ReferenceModels(unittest.TestCase):
    def test_bx_axes_parallel_closure_and_drawing(self):
        tree=ET.parse(ROOT/'kawasaki-bx250l/urdf/bx250l-b001.urdf').getroot()
        self.assertEqual([j.get('name') for j in tree.findall('joint') if j.get('type')=='revolute'],[f'joint{i}' for i in range(1,7)])
        limits=[(-180,180),(-60,76),(-120,90),(-210,210),(-125,125),(-210,210)]
        for j,(lo,hi),speed in zip(tree.findall('joint')[:6],limits,[125,120,100,140,140,200]):
            lim=j.find('limit')
            np.testing.assert_allclose([math.degrees(float(lim.get(k))) for k in ['lower','upper','velocity']],[lo,hi,speed],atol=1e-8)
            self.assertIsNone(lim.get('effort'))
        for q in ([0]*6,[.3,-.4,.6,.2,-.2,.1],[-.3,.2,-.5,-.2,.4,-.1],[0,math.radians(76),0,0,0,0],[0,math.radians(-60),0,0,0,0]):
            poses=forward(tree,dict(zip([f'joint{i}' for i in range(1,7)],q)))
            np.testing.assert_allclose(poses['flange'],drawing_flange(q),atol=1e-10)
            a=poses['parallel_arm1']@np.array([0,0,1.1,1])
            b=poses['parallel_arm2']@np.array([.287,-.393923,.069459,1])
            np.testing.assert_allclose(a,b,atol=1e-10)

    def test_mount_bores_and_gun(self):
        gun=ET.parse(ROOT/'nimak-multiframegun/urdf/95-020-516-p3u.urdf').getroot()
        poses=forward(gun,{})
        np.testing.assert_allclose(poses['cad_tip'][:3,3],[-.0134,0,1.332])
        bolts=[p for n,p in poses.items() if n.startswith('mount_bolt_h')]
        self.assertEqual(len(bolts),10)
        plate=trimesh.load(ROOT/'nimak-multiframegun/meshes/mount_plate.stl',force='mesh')
        host=trimesh.load(ROOT/'kawasaki-bx250l/meshes/gun_bracket_160.stl',force='mesh')
        # Host visual is link6-local in the world-oriented zero basis.
        frame=np.array([[0,1,0],[0,0,1],[1,0,0]])
        for p in bolts:
            xy=p[:2,3];self.assertAlmostEqual(np.linalg.norm(xy),.080,places=8)
            self.assertFalse(plate.contains([[*xy,.0035]])[0])
            self.assertFalse(host.contains([frame@np.array([*xy,-.005])])[0])
        self.assertTrue(plate.contains([[.025,.025,.0035]])[0])
        # Solid web beside the axes ensures holes weren't achieved by an empty plate.
        self.assertTrue(host.contains([frame@np.array([.06,0,-.005])])[0])
        self.assertFalse(gun.findall('.//collision/geometry/mesh'))
        self.assertFalse(gun.findall('.//inertial'))

    def test_nimak_single_moving_jaw(self):
        gun=ET.parse(ROOT/'nimak-multiframegun/urdf/95-020-516-p3u.urdf').getroot()
        moving=[j for j in gun.findall('joint') if j.get('type')!='fixed']
        self.assertEqual([j.get('name') for j in moving],['jaw_opening'])
        self.assertIsNone(moving[0].find('mimic'))
        lim=moving[0].find('limit')
        self.assertAlmostEqual(float(lim.get('upper')),math.radians(20),places=11)
        self.assertIsNone(lim.get('effort'))
        # Independent planar linkage construction from three measured pin axes.
        # Check both directions: the right electrode retracts, left stays fixed.
        for deg in [0,2,5,10,15,20,10,0]:
            q=math.radians(deg);p=forward(gun,{'jaw_opening':q})
            fixed=np.array([-.0134,0,1.332]);tip=fixed+np.array([.7*math.sin(q),0,.7*(math.cos(q)-1)])
            np.testing.assert_allclose(p['cad_tip'][:3,3],fixed,atol=1e-11)
            np.testing.assert_allclose(p['moving_tip'][:3,3],tip,atol=1e-11)
            np.testing.assert_allclose(p['moving_tip'][:3,2],[-math.cos(q),0,math.sin(q)],atol=1e-11)
            eye=p['moving_jaw']@np.array([.2675,0,-.248,1])
            length=np.linalg.norm(eye[:3]-[-.1919,0,.274])
            retract=math.hypot(.446,.110)-length
            self.assertGreaterEqual(retract,-1e-11)
            self.assertLessEqual(retract,.112699)
            # Each moving visual and its collision must follow the same jaw.
            link=gun.find("link[@name='moving_jaw']")
            self.assertIsNotNone(link.find("visual[@name='right_electrode']"))
            self.assertGreater(len(link.findall('collision')),5)
        np.testing.assert_allclose(forward(gun,{'jaw_opening':0})['moving_tip'][:3,3],fixed)

if __name__=='__main__':unittest.main()
