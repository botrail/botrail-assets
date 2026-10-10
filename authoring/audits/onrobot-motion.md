# RG2 / RG6 verification

Run from the repository root after exporting both models:

```sh
node --test authoring/test/onrobot-contract.test.mjs \
  onrobot-rg2/authoring/model.test.mjs onrobot-rg6/authoring/model.test.mjs
python authoring/audits/test_onrobot_motion.py
python authoring/audits/onrobot-motion.py --asset onrobot-rg2 \
  --samples 101 --check-refined --output /tmp/rg2-audit.json
python authoring/audits/onrobot-motion.py --asset onrobot-rg6 \
  --samples 101 --check-refined --output /tmp/rg6-audit.json
```

The Python audit needs NumPy, SciPy, trimesh and manifold3d. It does not install
packages or download meshes. The validation environment used trimesh 5.1.0 and
manifold3d 3.5.3. If these are in a separate existing dependency directory, set
`PYTHONPATH` to that directory. No renderer or vendor CAD is used by these tests.

## What is verified

- SHA-256 equality of the complete URDF bytes of the 2026-10-11 contract, including
  all joint origins, axes, limits, mimic relations, frames, collisions and filenames
- Fresh compact OBJ/MTL exports exactly match committed files
- Visible mounting face at mount z=0; closed pad tips at z=219.97 mm (RG2)
  and z=270.49 mm (RG6); the TCP is the centre of the pads where they meet
  (205.07 / 251.99 mm); joint 0 spaces the bare fingers by the datasheet stroke;
  every link's collision encloses its visual (authoring tests)
- One independent drive, analytic monotonic pad closure over the entire joint
  interval, 1,001 sampled poses, a TCP fixed during actuation, mirrored contact planes and
  parallelogram pivot closure
- Each generated OBJ object's finite vertices, valid indices, nondegenerate
  triangles, closed two-face edges, consistent winding and positive volume
  after normal/UV seam welding at 0.00001 mm
- Boolean intersection volumes of the actual tessellated visual solids across
  a configurable sampled FK sweep, separately from unchanged collision solids
- Minimum solid separation for body/moment, body/truss, moment/carrier,
  truss/carrier and carrier/boot interfaces on each finger
- Per-link visual/collision volume differences and visual mesh hashes, so a
  report identifies the precise geometry inspected

## Regression gates and interpretation

`--check-refined` writes the report and exits nonzero if a gate fails:

- Whole URDF bytes must match the published contract
- Travel between the fitted pads must be within 0.001 mm of 101.1 mm (RG2) /
  150 mm (RG6); the datasheet strokes of 110 / 160 mm are between the bare fingers
- Closed contact error and sampled pad overlap must be at most 0.00001 mm
- Contact normals must remain x-parallel (off-axis norm at most 1e-10)
- Pivot closure and TCP motion must be at most 0.0000001 mm
- Each expected joint/seat interface must have a gap no larger than 0.05 mm
  at any sampled pose; the distance search is capped at 25 mm
- No non-whitelisted component intersection may exceed 0.01 mm³

Every component is tested at every sampled pose where its link solids overlap.
Small contacts below 0.001 mm³ are omitted from component reporting; the failure
threshold is 0.01 mm³. Per-object overlap volumes are not additive because
objects within one link can already overlap.

The explicit whitelist in `allowed_joint_interface` allows only the authored
base pivot bosses/sockets, matching distal shafts/eyes, fixed bracket/body
interface and carrier/rubber seating. These models use solid, unbored visual
pivot eyes: shaft/eye overlap is an intentional display convention, not a
manufacturing-tolerance certificate. All such overlaps remain in the report.
In particular, lower shafts intersecting truss guards, plate/cover penetration,
wrong-pivot contact and opposing-finger interference are **not** whitelisted.

Collision shapes (2026-10-11) are boxes and cylinders enclosing each link's
visual to 1 µm. Their overlaps are reported, not gated: the designed pivots and fixed
seats overlap in every pose, and no pair overlaps in only part of the stroke.
They are envelopes for planning, not a collision-accurate reproduction of the
refined shell; the per-link visual-outside-collision volumes remain reported.

AABBs only reject separated pairs; reported overlap volumes come from
manifold3d Boolean operations on closed tessellated solids. Welding and floating
point tolerances are explicit. This is **sampled motion verification, not an
exhaustive continuous-motion collision proof**. Analytic continuous coverage is
limited to the pad-gap derivative. Increasing `--samples` improves motion
coverage but does not change that limitation.

To compare against another stored asset tree, add `--baseline PATH`.
That audits both trees and asserts whole-URDF byte equality. The baseline path
must contain its own `urdf` and `meshes` directories.
