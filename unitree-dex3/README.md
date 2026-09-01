# Unitree Dex3-1 catalog entries

Catalog-entry URDFs for the Unitree Dex3-1 three-finger dexterous hand,
derived from `unitreerobotics/xr_teleoperate` `assets/unitree_hand/`
(Apache-2.0). The upstream file is teleop-oriented: its root is a
retarget frame and it decorates the fingertips and wrist with marker
spheres that would become collision geometry. These entries re-root at a
`mount` face (palm origin, fingers extending +Z as tools do), keep the
fingertip frames bare (`thumb_tip` / `index_tip` / `middle_tip` — the
`grasp_frames`), reference the upstream-shipped `*.convex.stl` for
collision, and add a `grasp_center` frame at the zero-pose fingertip
centroid. Meshes are not vendored here — recipes fetch them from the
upstream repository alongside this entry.

- `urdf/dex3-1-right.urdf` — right hand (7 DOF: thumb 3, index 2, middle 2)

License: Apache-2.0 (a derivative of the upstream description).
