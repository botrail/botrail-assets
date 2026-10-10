# RG6 verification — 2026-10-10

Base: main `61759a3219bf36677374d733f2cfbd19aa2ac72a`. Local work only; no push/PR/publication.

## Passed

- Both model tests plus 6 strict contract tests (8 total)
- Shared Node suite: 35 tests, including two exact OBJ corner/material/object compaction checks
- 5 Python validator tests
- Complete URDF byte equality; SHA-256 `7e1a0d322ceef6d61ad1ebd98069728e553c1c600ae9557932fa11f8b417d65e`
- Deterministic compact OBJ/MTL export comparison without overwriting generated files
- Analytic continuous monotonic pad gap, 1,001-pose mirrored closure/parallelism, pivot closure and fixed TCP
- Independent OBJ audit: 102 closed outward components, 21,048 triangles, no nonmanifold or zero-area faces
- Exact solid Boolean sweep at 101 evenly spaced poses, with FK read from actual URDF and meshes read from actual OBJ
- All 10 expected assembly support interfaces have zero measured separation across the sampled sweep
- No non-whitelisted component intersection exceeds 0.01 mm³. Expected shaft/eye and seated carrier/rubber overlaps remain reported
- Actual Blender 4.3.2 imported OBJ/URDF renders inspected for shape, assembly support and coplanar-surface artifacts
- Portable source ZIP extracted into a fresh directory: both exports, all 10 focused tests and both topology audits pass using existing locked dependencies
- `git diff --check`

See [reproducible audit instructions](../../authoring/audits/onrobot-motion.md) and [exact report](./motion-audit.json).
The 101-pose sweep is not an exhaustive continuous-motion collision proof. The analytic continuous check only covers pad-gap monotonicity.

## Retained limitations

In this refinement the inherited collision proxy was kept: it covered only about 19.5% of each new fitted boot's solid volume,
whose centre sits 25.5 mm further out; its contact X plane follows the same 160 mm stroke.
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

- TCP: the closed-pose centre of the two visible boots, 272.5 mm from mount (was 268.1 mm).
  A fixed TCP; the pads swing towards the mount as the gripper opens
- Collision: per-link boxes, one cylinder over each pivot's bosses and, on the truss arm, a box over the
  switch cover. The boot box shares the visible contact plane. Every visual vertex lies inside its link's
  collision except the carrier's lower-axle ends (at most 3.9 mm, inside the moment-arm plates) and the
  body cover reliefs (at most 1.3 mm)
- 101-pose audit, visual volume outside collision (mm³): bracket 9,196 → 0, moment arm 2,163 → 0, truss arm 9,797 → 0, boot 4,567 → 0, carrier 5,096 → 299
- Collision overlaps in the sweep are the designed pivots and fixed seats, present in every pose;
  no pair overlaps in only part of the stroke. - URDF SHA-256 `9ff2b058bb0d…`, pinned in `authoring/test/onrobot-contract.test.mjs` and the audit
- Passed: 12 RG2/RG6 model and contract tests (enclosure and TCP-at-boot-centre added), 5 audit unit tests,
  both `--check-refined` audits (report regenerated in `motion-audit.json`), OBJ export check and topology audit
