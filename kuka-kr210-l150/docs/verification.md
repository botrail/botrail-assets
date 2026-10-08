# KUKA refinement verification — 2026-10-08

## Result

The floor-mounted KR 210 L150-2 reference geometry is independently re-authored.
The distributed visual contains 61 original component meshes / 34,004 triangles.
No manufacturer photographs, drawings, CAD, or third-party mesh are redistributed.
This is a proposed next revision for review; pinned catalog revisions are unchanged.

## Passed

- 14/14 KUKA model tests, including every actual component's welded closure,
  non-degenerate triangles, positive volume and finite normals
- 27/27 shared authoring-helper tests
- Deterministic OBJ/MTL regeneration and checked-in-file comparison (15 files)
- Whole URDF byte-identical to main baseline e1565dd:
  SHA-256 `e28a9f8a2a5e0c4f4677c03a8ed9c75c87c8f9f4e5c9237af5043a29e8ea09ce`
- All link matrices in five independently frozen poses, including joint limits
- 655 combinations of A1/A2 keep both visual balancer anchors connected
- Four barrel tie rods rotate rigidly with A1, including three A2 positions
- Physical nominal flange recess/bore depths verified by ray intersection
- Pure Three.js projection coverage for preset/slider combinations, four views,
  and narrow/square/wide aspect ratios
- Eight Blender 4.3.2 renders inspected: before/after URDF in identical cameras,
  plus zero, extended, folded, and rear viewer snapshots
- Independent code, source-fidelity, FK, topology, and render review; its two
  findings (preset clipping and barrel roll) were corrected and rechecked

## Not verified / limitations

- Actual browser UI/WebGL smoke test did not run. The cloud browser could not
  reach the isolated local server, and installed Chromium could not create its
  required Unix socket in this environment, including the permitted retry.
  The Node framing/mechanism tests are not a substitute for actual UI coverage
- The nonlinear moving counterbalance is a viewer-only visual; the URDF includes
  its rigid brackets/pins only, preserving the six-axis interface
- Cast sections, base perimeter, motor sizes and balancer anchors are visual
  estimates from the verified exact-model photos, not measured vendor surfaces
- Collision primitives were intentionally preserved. They do not fully enclose
  the refined visual and have not been approved for safety/clearance checks
- No calibrated A6 clocking, thread tolerances, dynamics, force balance, cable
  sweep, structural performance or real-machine collision safety is certified

## Preview files

- `before-after.png`: URDF output only, matched camera/lighting
- `viewer-poses.png`: explicitly labelled viewer-only counterbalance snapshots

Public source links and exact/inferred values are in the model README and
`authoring/provenance.json`. Copyrighted reference photographs are linked there,
not embedded in the archive or previews.
