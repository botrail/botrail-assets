"""Asset-specific visual topology and inspection-only drive regression tests.

Mount interfaces, unchanged nonvisual URDF and generic mesh health are also
covered by the repository's authoring/tests regression suite. These authored
geometry checks are not manufacturer dimensional/fit certifications.
"""
from functools import lru_cache
from pathlib import Path
import math
import unittest
import xml.etree.ElementTree as ET
import numpy as np
import trimesh as tm
from pose_preview import drive_endpoints,drive_length

ROOT=Path(__file__).resolve().parents[1]

@lru_cache(None)
def mesh(name):return tm.load(ROOT/'meshes'/f'{name}.stl',force='mesh')


def contains_world(name,points,origin):
    return mesh(name).contains(np.asarray(points)-np.asarray(origin))


class SourceReferenceGeometry(unittest.TestCase):
    def test_raked_plate_has_58_separate_enclosed_apertures(self):
        # Four major windows + six circular access bores + 48 perimeter bores.
        # Euler genus proves they are separate closed apertures, not scallops
        # cut into the outer edge or a merged hole/slot as in the first draft.
        for name,y in [('lower_frame_left',-.070),('lower_frame_right',.070)]:
            m=mesh(name)
            self.assertTrue(m.is_watertight)
            self.assertEqual(len(m.split()),1)
            self.assertEqual(m.euler_number,2-2*58)
            empty=[(-.154,y,.164),(-.021,y,.164),(-.088,y,.323),(.092,y,.225),
                   (-.245,y,.156),(-.169,y,.379),(.023,y,.290),(.004,y,.402)]
            self.assertFalse(contains_world(name,empty,(0,0,.042)).any())
            solid=[(-.255,y,.380),(-.262,y,.193),(-.052,y,.225),(.058,y,.323)]
            self.assertTrue(contains_world(name,solid,(0,0,.042)).all())

    def test_perimeter_and_access_bores_retain_three_mm_web(self):
        centers=[(-.285,z) for z in np.linspace(.094,.324,10)]
        centers += [(x,.072) for x in np.linspace(-.255,.102,14)]
        centers += [(.111+.067*t,.092+.107*t) for t in np.linspace(0,1,9)]
        centers += [(.165-.076*t,.217+.121*t) for t in np.linspace(0,1,9)]
        centers += [(.073-.036*t,.389+.080*t) for t in np.linspace(0,1,6)]
        bores=[(x,z,.006) for x,z in centers]+[(-.185,.399,.037),(-.245,.156,.019)]
        for x,z,r in bores:
            points=[(x+(r+.003)*math.cos(a),-.070,z+(r+.003)*math.sin(a))
                    for a in np.linspace(0,math.tau,64,endpoint=False)]
            self.assertTrue(contains_world('lower_frame_left',points,(0,0,.042)).all(),
                            f'Less than sampled 3 mm clear web around {(x,z,r)}')
        # Rounded access slot enlarged by 3 mm: all sampled outer boundary
        # points must be steel, avoiding ragged grid-bore intersections.
        points=[]
        for sx,sz,start in [(1,1,0),(-1,1,90),(-1,-1,180),(1,-1,270)]:
            cx,cz=-.239+sx*.006,.632+sz*.0105
            for deg in np.linspace(start,start+90,17):
                a=math.radians(deg);points.append((cx+.015*math.cos(a),-.077,cz+.015*math.sin(a)))
        points += [(-.239,-.077,.6065),(-.239,-.077,.6575),(-.260,-.077,.632),(-.218,-.077,.632)]
        self.assertTrue(contains_world('detail_pivot_spine_left',points,(0,0,.042)).all())

    def test_spine_and_fork_are_connected_pierced_plates(self):
        for name,holes in [('detail_pivot_spine_left',21),('detail_pivot_spine_right',21),
                           ('swing_lever_left',27),('swing_lever_right',27)]:
            m=mesh(name)
            self.assertTrue(m.is_watertight)
            self.assertEqual(len(m.split()),1)
            self.assertEqual(m.euler_number,2-2*holes)
        # Keep the bridge face 1 mm behind the cradle to avoid z-fighting,
        # while overlapping both the cradle and fixed-spine layer thickness.
        b=mesh('detail_spine_bridge_right').bounds[:,1]
        cradle=mesh('lower_frame_right').bounds[:,1]
        spine=mesh('detail_pivot_spine_right').bounds[:,1]
        self.assertAlmostEqual(cradle[1]-b[1],.001,places=6)
        self.assertGreater(min(b[1],spine[1])-max(b[0],spine[0]),.0029)
        # The authored rear bridge physically joins the cradle and fixed spine.
        self.assertTrue(contains_world('detail_spine_bridge_left',
            [(-.220,-.060,.510),(-.220,-.060,.580)],(0,0,.042)).all())

    def test_arm_faces_have_real_blind_pockets_and_tip_taper(self):
        origin=(-.0134,0,.632)
        # At root section the face pocket is empty, but its remaining web is solid.
        self.assertFalse(contains_world('right_arm_blade',[(.235,.022,.950)],origin)[0])
        self.assertTrue(contains_world('right_arm_blade',[(.235,.010,.950)],origin)[0])
        # The outer root-width stock is absent at the tapered terminal section.
        self.assertTrue(contains_world('right_arm_blade',[(.259,0,.950)],origin)[0])
        self.assertFalse(contains_world('right_arm_blade',[(.259,0,1.270)],origin)[0])
        self.assertTrue(contains_world('right_arm_blade',[(.177,0,1.270)],origin)[0])

    def test_measured_drive_pin_relation_at_multiple_poses(self):
        lengths=[]
        for deg in [0,2,10,20]:
            q=math.radians(deg);b,c=drive_endpoints(q)
            np.testing.assert_allclose(b,[-.1919,0,.274],atol=1e-14)
            expected=[-.0134+.2675*math.cos(q)-.248*math.sin(q),0,
                      .632-.2675*math.sin(q)-.248*math.cos(q)]
            np.testing.assert_allclose(c,expected,atol=1e-14)
            self.assertAlmostEqual(drive_length(q),math.dist(b,c),places=13)
            lengths.append(drive_length(q))
        self.assertTrue(all(a>b for a,b in zip(lengths,lengths[1:])))
        self.assertAlmostEqual(lengths[0],math.hypot(.446,.110),places=13)
        self.assertAlmostEqual(lengths[0]-lengths[-1],.11269888300603481,places=10)

    def test_illustrative_actuator_not_in_runtime_asset(self):
        tree=ET.parse(ROOT/'urdf/95-020-516-p3u.urdf').getroot()
        self.assertEqual([j.get('name') for j in tree.findall('joint') if j.get('type')!='fixed'],['jaw_opening'])
        for visual in tree.findall('.//visual'):
            name=visual.get('name','').lower()
            self.assertNotIn('inspection',name)
            self.assertNotIn('barrel',name)
            self.assertNotIn('motor_envelope',name)
        used={Path(v.get('filename')).name for v in tree.findall('.//visual/geometry/mesh')}
        self.assertEqual(used,{p.name for p in (ROOT/'meshes').glob('*.stl')})


if __name__=='__main__':unittest.main()
