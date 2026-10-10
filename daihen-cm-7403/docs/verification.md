# CM-7403 verification — 2026-10-09

Base: main `9c3c564cca1fd80ab596a60e8a2f46edc10fa58d`. Local-only refinement; no publication implied.

## Passed

- 10 target Node tests: byte-identical URDF SHA-256, exact visual envelope, required components and finite coordinates/normals, spool axial/radial spacing, handle clearance, no textures/logos, export identity, exact OBJ face-corner preservation, feed-mechanism support contacts, rear bridge/spool separation
- 27 shared authoring tests
- Deterministic OBJ/MTL/URDF regeneration with `--check`
- Independent Python topology audit: 116 components; 84,392 triangles; no degenerate triangles, nonmanifold edges, inconsistent edge orientation or non-positive component volumes
- Visual bounds: x = −0.127…0.127 m; y = −0.2935…0.3175 m; z = 0…0.393 m, within float32 tolerance
- `git diff --check`
- CI path filters and a focused CM-7403 test/export/topology step added; remote CI is not run because this work is not published
- Blender 4.3.2 imports the actual OBJ through the actual URDF; comparison and detail cameras use the same fixed lighting/material conversion

## Compatibility and remaining limits

URDF SHA-256: `d5443b5b06ecac12051525bd7b3fa32d6015186d151775ed2bde7aca6e1f29e4`.
All existing frames, collision and fixed joints are unchanged, including their shortcomings.
The lower-front photo-estimated visual connector is not at the old high-center outlet datum.
The legacy collision still contains a large solid holder and outboard spool; it does not represent the new shell's openings or envelope.

Only the current official product page's 254 × 611 × 393 mm envelope is newly verified dimensional evidence.
Small geometry, loaded spool, feed mechanism, opaque opposite cover and omitted side glazing are approximate.
The declared 4 mm rear-bridge clearance and support-contact tests check this authored model, not physical machinery.
Topology tests operate per component; overlap at intended assembly joints is allowed and is not a whole-model boolean-union test.

Browser UI interaction is untested; this cloud environment's browser launch was previously blocked by socket restrictions.
No actual browser pass, physical fit, dynamics, cable routing, load rating, or production/safety validation is claimed.
No manufacturer media is redistributed. See `authoring/provenance.json` and the asset README for sources and uncertainty.
