# AX legacy visual verification — 2026-10-10

## Executed and passed

- 8 target Node tests, 35 shared-authoring tests
- Fresh OBJ/MTL/material JSON/URDF export check; two independently constructed scenes export identically
- Lossless OBJ compaction preserves every exact face-corner attribute, material and object boundary
- Whole URDF SHA-256 remains `d01d8d818a02a9e458da0c1ed015921b4c124c56da7d66ace82c906ec1fe85ac`
- Independent Python OBJ topology audit: 98 fixed and 22 moving closed solids, no degenerate triangles, boundary/nonmanifold edges, inconsistent winding or nonpositive signed volumes
- Independent exported-OBJ/URDF motion audit plus source-scene tests: all 2,156 fixed/moving component pairs have a separating axis over the complete 0–1.5 m swept interval
- Smallest conservative axis gap: 0.9999997 mm, at the illustrative guide/shoe interface
- 1,501 lift FK samples keep `robot_mount` at `[0, 0.160, 0.550 + q]` m with unchanged orientation and the visual plate top on that plane
- All four illustrative guide saddles (two per rail) remain within their respective guide lengths at both stroke ends; extremal longitudinal margins are 80 mm at low stroke and 130 mm at high stroke
- Backing-strip/mast contact, cabinet-door seating and non-coplanar rail-end caps are regression-tested
- `git diff --check` passes

The small floating-guide/door gaps found during independent review were corrected before final render/export. Guide backing strips connect to the mast, cabinet door and fasteners are seated, and rail-end caps do not share an exposed coplanar face with their underlying rails.

## Meaning of the motion result

A component's AABB is expanded through the full +Z translation, then compared with every fixed component AABB. For this model's sole rigid prismatic motion, **disjoint swept bounds are sufficient to certify visual nonintersection across the full continuous stroke**, not merely at the sampled poses. The test fails if any pair of those conservative bounds overlaps, so it does not silently reinterpret an overlap as an acceptable mesh intersection.

This proof is limited to the authored external rigid visuals. It says nothing about real bearing tolerances, load paths, flexible cables, OEM mechanism internals, or the older broad collision proxies. The guide saddles have a deliberate 1 mm illustrative lateral gap; that is not measured bearing clearance or an assertion of load-bearing contact.

`topology.json` and `motion-audit.json` contain exact counts, mesh hashes, bounds and guide margins. Geometry hashes tie the latter to the inspected exports.

## Visual review

The comparison renderer reads the actual exported URDF/OBJ/MTL. It uses the same orthographic camera, floor, resolution and lighting for before/after. The preserved legacy material properties are mapped separately from the newly authored material names. Low/mid/high views use q = 0, 0.75, 1.5 m. Detail views expose the base, cantilever, cabinet, side and rear.

Final screenshots are Blender 4.3.2 / Cycles renders, not browser screenshots. Only independently authored meshes appear; no OEM image is composited into them.

## Explicitly not run / not established

- Interactive browser/WebGL QA: not run; the available browser UI route was blocked in this environment. Static import paths and the DOM-to-joint hookup were inspected, but this is not interactive validation
- Remote CI, publication or a new catalog rev: not run; no branch push or PR is part of this local task
- Repository-wide per-product USD regeneration suite: not run; shared helper tests and this affected asset's export/contract/topology/motion checks were run
- Manufacturing fit, OEM certification, real anchor pattern, payload/stiffness, actual guide design, safe lift force/speed and cable routing: not established
- The old full-slab base collision and simple carriage/cabinet boxes intentionally remain byte-identical and differ from the refined visuals

## Reproduce

From repository root:

```sh
node --test robotiq-ax-series-base/authoring/model.test.mjs
node robotiq-ax-series-base/authoring/export.mjs --check
python3 robotiq-ax-series-base/authoring/verify_obj.py
python3 robotiq-ax-series-base/authoring/verify_motion.py
npm --prefix authoring test
```

The portable subset includes the target and its shared runtime, not unrelated asset test fixtures; run the target commands there. Run the shared test command in the complete repository.

## Collision revision (2026-10-11)

The collisions are now axis-aligned boxes around the drawn parts, generated from the visual groups in
`authoring/model.mjs` (base 16, carriage 6; the cantilever deck and its triangular cheeks in four slabs
along the reach). Joints, frames, limits and drive settings are byte-identical to r1, and the meshes are
unchanged; only the `<collision>` elements of the URDF differ.

- Every visual vertex lies inside its link's boxes to 1 µm (new test); the open base frame stays open
  (sample points inside the frame opening are in no box); the robot plate box top is the `robot_mount` plane
- r1's proxies left the visual up to 80 mm outside on the base (status lights, sensors, guide rails,
  cabinet details) and 55 mm on the carriage (triangular cheeks)
- Passed: 9 target Node tests, export `--check`, OBJ topology audit, the full-stroke motion audit
  (report regenerated; only the URDF hash and the limitation text change)
- URDF SHA-256 `a1a117ad6565…`, pinned in `model.test.mjs` and `verify_motion.py`
