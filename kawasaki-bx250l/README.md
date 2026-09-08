# Kawasaki BX250L-B001 reference model

An independently authored, CC0 kinematic reference for the real BX250L-B001 with its standard GUN BRACKET 160. Six commanded axes and two mimic joints reproduce the BX parallel-link mechanism. This is not manufacturer-supplied geometry or a controller-calibrated model.

| Quantity | Source | Model |
| --- | --- | --- |
| J1/J2 height; J2 offset | BX250L drawing: 670 / 210 mm | 670 / 210 mm |
| J2 to elbow carrier | BX250L drawing: 1100 mm | 1100 mm |
| Carrier to J3 | BX250L drawing: 185 mm forward, 270 mm up | 185 / 270 mm |
| J3 to J5; J5 to flange | BX250L drawing: 1350 / 343 mm | 1350 / 343 mm |
| Zero-pose flange | Drawing dimensions, checked against BX250L STEP | (0, 2088, 2040) mm, outward +Y |
| Axis limits J1..J6 | BX250L specification, degrees | ±180, −60..76, −120..90, ±210, ±125, ±210 |
| Axis speeds J1..J6 | BX250L specification, degrees/s | 125, 120, 100, 140, 140, 200 |
| Flange | Drawing: PCD160, 10×M10; Ø100 H7 recess, depth 11; 2×Ø10 H7 pins | Nominal bore axes and recess; no threads or toleranced solid fits |
| Parallel rod pivot centers | BX250L STEP cylinder axes: Y −183.923, Z 739.459 / 1839.459 mm | Rounded centers, rod length 1100 mm; axial placement X287 mm is an authored choice |

Sources:

- [BX250L specification and drawing, 90151-0028DED, sheets 1–3](https://kawasakirobotics.com/uploads/sites/2/2022/01/BX250L-B_E-E.pdf).
- [BX250L-B001 STEP](https://kawasakirobotics.com/uploads/sites/2/2022/01/BX250L-B001-STEP.zip): numeric dimensions and cylinder axes only. No imported surfaces, tessellation or traced contours occur in this asset.
- [Official BX mechanism declaration](https://github.com/Kawasaki-Robotics/khi_ros2/blob/32a34658cd80343bfe7b7fb82cabce3bfd2b4381/khi_description/urdf/bx/khi_joint_link.xacro), pinned for the joint-sign and parallel-link convention. That repository supplies BX300L; this model uses BX250L's own dimensions, speeds and limits. Code here is independently authored.
- [BX-NIMAK-HW-A assembly declaration](../nimak-multiframegun/docs/assembly.md).

At zero, the model faces +Y. Joint axes in the zero-pose world basis are −Z, −X, +X, +Y, +X, +Y. The carrier counter-rotates with J2, so J3 is not a conventional serial elbow that simply adds J2. `flange` has local +Z along the output axis; its local X points world +Z and local Y points world +X.

Body shells, fork, bracket outer contour and covers are approximate primitive shapes. Balancers, internal mechanisms, cabling and connectors are omitted or simplified. Visual bores do not establish thread fit. Collisions use separate boxes/cylinders, filling mounting bores; they are approximate and do not represent a complete CAD swept volume. No actuator effort, link masses or inertias are invented. Published mass 1460 kg, payload 250 kg and reach 2812 mm are product facts, not dynamic validation.

Regenerate from the repository root with Python 3.13:

```sh
python -m pip install -r authoring/reference-requirements.txt
python kawasaki-bx250l/tools/generate_model.py
python kawasaki-bx250l/tools/generate_model.py --check
python -m unittest discover -s authoring/tests -p 'test_reference_models.py'
```

URDF uses metres/radians and explicit analytic collisions. `base_link` is the floor origin and `flange` the mounting face. The catalog builder produces prebuilt URDF and USD from this asset; end users do not need the authoring tools.
