# FANUC M-410iC/185 visual refinement verification

Date: 2026-10-09. Base commit: `5a715e3` (remote main verified before work).
Scope: exact /185 variant, pedestal base. This is an independently authored
visual reference, not an as-built digital twin or verified mounting model.

## Passed

- 11 product tests; 27 shared authoring tests in the full checkout. Extracted source
  bundle smoke: the same 11 product tests, 23-file export check, OBJ audit and 15
  bundled standalone shared tests; unrelated cross-asset suites are not bundled
- 180-pose analytic flange FK comparison and closure of all three parallel-link loops
- All 14 links / 13 joints: names, origins, axes, limits, speeds, mimic coefficients,
  primitive collisions and absent inertials match the original model. The URDF is byte-identical
- Independent Blender URDF import for Zero / Reach / Low / Folded, including passive
  mimics: every link matrix agrees with Three.js within `2.96e-7`
- 111 visual components, 34,992 triangles, across 11 OBJ files: finite positions/normals,
  no zero-area triangles, no open/nonmanifold edges after positional welding at `1e-7 m`,
  consistent directed edge winding and positive signed volume, both in-memory and exported OBJ
- Front-face lower-arm pockets are genuine recesses, about 44–48 mm deep at the tested
  centers. The values and blind termination are estimates, not manufacturer dimensions
- Assembled pedestal has daylight through both portal openings; the one-sided cabinet
  does not obstruct the tested sightlines. Wrist fork openings are also geometric holes
- All named poses and full linkage visuals fit tested view frusta in four camera directions
  at desktop aspect `1.6` and narrow aspect `0.6`
- Fresh exports are deterministic and match all 23 checked-in files. OBJ compaction preserves
  every face corner's exact position/UV/normal strings, object order and material assignment;
  no rounding, face removal or cross-object welding
- Shared library sources, package dependency versions, other assets and catalog revisions untouched

## Visual review

`before-after.png` uses the same orthographic camera, lights, renderer settings and
materials treatment for the old/new zero pose. `detail-views.png` repeats that comparison
from side/front. `pose-views.png` shows Reach, Low and Folded with all links included.
The nonzero-pose review camera fits projected bounds of every mesh with an 18% margin and
asserts that all mesh bounds remain inside the frame; zero-pose matched cameras stay fixed.
These are Blender-generated review images, not browser screenshots. Low is an operating-range
inspection pose that extends below floor level; its floor is hidden so it cannot conceal links.

Reference images and the data-sheet drawing were inspected as pixels outside the repository.
No manufacturer imagery, copyrighted diagram, mesh or CAD is part of this CC0 deliverable.
The globally distributed catalog with a reproduction-prohibition clause is excluded as an
input. See `../authoring/provenance.json` for source URLs and the exact fact/estimate split.

## Limits

- Actual browser UI clicks, WebGL rendering and interruption flows were not run. Prior browser
  launch was access-denied; no bypass was attempted. Static module checks, computational
  full-chain camera tests, independent URDF import and Blender renders passed
- Collision proxies are the original conservative/simplified primitives, not complete new
  visual envelopes. Cable sweeps, exact physical interference, assembly clearances, safety,
  dynamics, payload performance, calibration, reachability with coupled limits and cycle time
  are not validated
- J2/J3 limit partition and linkage offsets are inherited authored estimates. Manufacturer
  ranges give spans; real coupled self-interference constraints are not encoded
- Faceplate and bolt/connector details are illustrative. No hole standard or hidden hollow
  wrist-bore size is claimed
- Publication scope is a separate draft pull request only. No merge, catalog rev
  change or deployment is included

## Collision revision (2026-10-10)

The narrowed primitives (kept clear of the arms; the visual stood up to 537 mm outside them) were replaced by
boxes, axis cylinders, a pitched crank box and casting slabs computed from the drawn parts. Joints, mimic
rules, frames, limits and the visual meshes are unchanged; the kinematics baseline no longer carries the
superseded collision primitives.

- Every link visual lies inside its collision (new test, 1 µm)
- 4000 random poses (independent J2/J3, so many lie beyond the real J2/J3 interference limit): pinned pairs
  overlap in every pose (allowed automatically); poses with a false-positive pair 14.3 % (old 20.1 %) and with a
  false-negative pair 0.1 % (old 100 %, the narrowed rods missed every real contact)
- The drawn level rods overlap the arm they run beside (the lower rod and the lower arm's elbow seal by
  about 13 mm, in 11 % of poses with J2 -20..60 / J3 -60..0); the catalog declares both rod/arm pairs.
  The rods against the other arm meet only in folded poses the interference limit forbids
- The catalog build: neutral pose free of self-collision, TCP clear
- URDF SHA-256 `5fed7266f395…`; 12 model tests, `--check` and the OBJ audit pass
