# Robotiq 2F-85 and GRP-ES-CPL-062 reference model declarations

These CC0 URDF declarations use separately fetched **BSD-2-Clause meshes**
from [MuJoCo Menagerie, robotiq_2f85_v4](https://github.com/google-deepmind/mujoco_menagerie/tree/8161bba264d7fa7c99ca301e91e7fb44737676ad/robotiq_2f85_v4).
The upstream mesh files are not part of this CC0 repository. Their original
license must accompany any package made from them. The catalog recipe fetches
the two sources separately and keeps the license mapping.

The referenced products are [Robotiq 2F-85](https://robotiq.com/products/adaptive-grippers)
and the ES-062 configuration of AGC-ES-UR-KIT-85 described in
[quick-start X-990037-B](https://blog.robotiq.com/hubfs/support-files/Quick_start_2Finger_e-Series_nocropmarks_EN.pdf).
This is a reference for cell simulation, not a complete manufacturer CAD assembly.

| Declared value | Source | Model |
|---|---|---|
| Robot-side PCD50, four 6.4 mm bores | ES-062 instructions; published coupling mesh section | Preserved in the upstream housing mesh |
| Gripper-side four axes at +/-27, +/-16 mm | Published housing mesh; ES-062 dimensional audit | Preserved; M5 thread helices are not modeled |
| 13.9 mm reference mount-to-annulus offset | Published coupling mesh and prior ES-062 datum declaration | 13.9 mm; physical seating datum remains unverified |
| Nominal 85 mm hand stroke | Robotiq product specifications | Geometric parallel motion; teach the closing position against the actual workpiece |
| TCP at approximately 130.23 mm above hand mount | Previous Botrail r2 geometric frame declaration | Retained teaching frame; not a calibrated physical TCP |

`tools/kinematic-tree.urdf` retains Botrail's authored r2 joint axes, joint
names and geometric teaching frames. These numerical declarations were derived
from the 20190924 CAD dimensional audit. They contain no manufacturer mesh or
CAD file. `tools/generate_urdf.py` positions the published Menagerie visual
parts on that tree. It does not reproduce Menagerie's closed-loop/adaptive
dynamics, copied inertias or actuator parameters. Effort, velocity, mass and
payload are not inferred from a different model revision.

The public reference meshes differ from the previous independently converted
CAD in details and finger pose. Re-teach contact positions and validate motions
when selecting this source. The preserved TCP identifies a teaching convention;
it is not asserted to be the new pads' measured centroid. Geometry limitations
do not turn the standard purchased kit's mechanical support into a precision
fit certification.

The coupling represents the external mounting housing only. Its four robot-side
bores and four hand-side axes match the declared ES-062 mounting pattern.
The upstream filename does not identify a complete ES-062 electronics variant.
Electronics, spring contacts, cable, protector and installation fasteners have
no geometry in this representation. In particular, absence of modeled cable
geometry does not establish cable clearance. The catalog keeps the documented
ES-062 purchase identity and labels the representation as a reference.

To regenerate, place the pinned upstream folder `robotiq_2f85_v4/` beside this
directory, retaining its `2f85.xml`, `assets/` and `LICENSE`, then run:

```bash
python robotiq-2f85/tools/generate_urdf.py
```

Generation needs NumPy and SciPy. Consumers use the prebuilt catalog package
and need neither this generator nor CAD conversion tools.
