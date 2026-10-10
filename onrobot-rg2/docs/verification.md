# RG2 verification — 2026-10-10

Base: main `61759a3219bf36677374d733f2cfbd19aa2ac72a`. Local work only; no push/PR/publication.

## Passed

- Both model tests plus 6 strict contract tests (8 total)
- Shared Node suite: 35 tests, including two exact OBJ corner/material/object compaction checks
- 5 Python validator tests
- Complete URDF byte equality; SHA-256 `95d0f45ed89717e5b41c498bd1961c2b520116dcd12ad622da9bb8dae1794626`
- Deterministic compact OBJ/MTL export comparison without overwriting generated files
- Analytic continuous monotonic pad gap, 1,001-pose mirrored closure/parallelism, pivot closure and fixed TCP
- Independent OBJ audit: 102 closed outward components, 20,920 triangles, no nonmanifold or zero-area faces
- Exact solid Boolean sweep at 101 evenly spaced poses, with FK read from actual URDF and meshes read from actual OBJ
- All 10 expected assembly support interfaces have zero measured separation across the sampled sweep
- No non-whitelisted component intersection exceeds 0.01 mm³. Expected shaft/eye and seated carrier/rubber overlaps remain reported
- Actual Blender 4.3.2 imported OBJ/URDF renders inspected for shape, assembly support and coplanar-surface artifacts
- Portable source ZIP extracted into a fresh directory: both exports, all 10 focused tests and both topology audits pass using existing locked dependencies
- `git diff --check`

See [reproducible audit instructions](../../authoring/audits/onrobot-motion.md) and [exact report](./motion-audit.json).
The 101-pose sweep is not an exhaustive continuous-motion collision proof. The analytic continuous check only covers pad-gap monotonicity.

## Retained limitations

In this refinement the inherited collision proxy was kept: it covered only about 31.5% of each new fitted boot's solid volume,
whose centre sits 19 mm further out; its contact X plane follows the same 110 mm stroke.
That proxy and the old TCP are superseded by the revision below.
The published length drawing uses a bracket-shoulder datum and bare metal fingertips, so do not compare it directly to mount-to-fitted-boot coordinates.

The sampled visual overlap whitelist is limited to matching pivot shafts/solid eyes, support sockets, bracket/body contact and seated carrier/rubber.
There are no modeled bearing bores or manufacturing tolerances. Whole-model union watertightness is not claimed; components are independently closed solids.

## Aggregate gate exception

The broader unchanged-USD aggregate `npm --prefix authoring run test:models` stops at **unchanged Mid-360**.
Its generated hash is `c24a57d282945a4a99345f97443100605c5c80e9f7adbee9701d3fa267e8b40e`,
while the tracked hash is `d0632062392c5da193c0bc9512c49865e6c32af0483fa30465ba5864ec6935f9`.
The only textual differences are two material-color components at ~1e-18 floating-point precision.
Mid-360 and its shared generation sources are identical to main. They were not edited or regenerated in the repository.
This environment-sensitive existing aggregate mismatch is disclosed, not counted as a passing whole-repository gate.
The environment used Node 24.19.0; CI specifies Node 22. Remote CI has not run because nothing was pushed.

Browser UI interaction was not tested; this environment has previously blocked browser launch sockets.
A Blender render and Node scene test are not browser interaction tests. No physical fit, certified safety, dynamics, contact-force or switch-function validation is claimed.

## TCP and collision revision (2026-10-10)

A follow-up change replaced the inherited TCP and collision proxies. Joints, limits, mimic rules,
mount and mesh paths are unchanged, and the visual meshes are byte-identical.

- TCP: the closed-pose centre of the two visible boots, 217.1 mm from mount (was 198.1 mm).
  A fixed TCP; the pads swing towards the mount as the gripper opens
- Collision: per-link boxes, one cylinder over each pivot's bosses and, on the truss arm, a box over the
  switch cover. The boot box shares the visible contact plane. Every visual vertex lies inside its link's
  collision except the carrier's lower-axle ends (at most 2.9 mm, inside the moment-arm plates) and the
  body cover reliefs (at most 0.6 mm)
- 101-pose audit, visual volume outside collision (mm³): bracket 29,052 → 0, moment arm 624 → 0, truss arm 4,277 → 0, boot 2,347 → 0, carrier 3,774 → 163
- Collision overlaps in the sweep are the designed pivots and fixed seats, present in every pose;
  no pair overlaps in only part of the stroke. The inherited moment-arm/truss-arm boxes shared one layer and overlapped near closure; that intermittent pair is gone.
- URDF SHA-256 `9e0c06cfab05…`, pinned in `authoring/test/onrobot-contract.test.mjs` and the audit
- Passed: 12 RG2/RG6 model and contract tests (enclosure and TCP-at-boot-centre added), 5 audit unit tests,
  both `--check-refined` audits (report regenerated in `motion-audit.json`), OBJ export check and topology audit

## STEP-measured revision (2026-10-11)

Base: main `c945d9e6257a66539b4d0495c30f89d1040b95bf`. Local work only. The official product-page STEP
(`303_rg2_tool.step`, SHA-256 `b3c41f38…`) was read as a measuring instrument; nothing from it is in the repository
(sources and readings: `authoring/provenance.json`).

- Re-sized from the measurements: pivots and housing 13.6 mm closer to the mount (QC tool face, robot flange + 13.6 mm);
  housing outline and depth; bracket base, cheeks and tilt discs; links (20 mm deep, distal clevis), carriers, pads
  (contact face 4.45 mm past the bare finger) and the dark cover plates; front label, screws and M3 holes
- Joints: 0 = 110 mm between the bare fingers, upper limit 1.2326 rad where the standard pads meet
  (101.1 mm pad travel); TCP 205.07 mm from mount at the pads' centre there (was 217.1 mm); closed pad tip 219.97 mm
- Datasheet check, datum = top of the robot-side QC (mount + 2.5 mm): open 174.6 / closed 213.1 / housing 132.0 mm
  against 174 / 213 / 132; neck / head / depth 54 / 64.9 / 36 mm against 54 / 65 / 36; bracket 75.0 against 75
- Collision: boxes and cylinders; every link's visual vertices lie inside to 1 µm (no exceptions). Audit volume of
  visual outside collision (tessellated cylinders): bracket 9.69 mm³, moment arm 0.08, truss arm 0.01, others 0
- 101-pose `--check-refined` audit (report in `motion-audit.json`): pad travel 101.100 mm, closed gap 2e-7 mm,
  monotonic, pad normals on x, parallelogram closure and fixed TCP exact, all 10 joint/seat interfaces in contact,
  no non-whitelisted visual intersection. 88 closed components, 15,404 triangles
- Passed: 16 Node tests (RG2/RG6 model 4, contract 10, compaction 2), 5 audit unit tests, export `--check`,
  OBJ topology audit. URDF SHA-256 `e3b627fc28e6…`
- Renders: Blender 5.2.2 Cycles (32 samples) of the exported OBJ/URDF; the before-after pair uses the same arm angle
