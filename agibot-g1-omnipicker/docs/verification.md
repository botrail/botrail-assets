# Verification — 2026-10-11

## Passing checks

- Target Node tests: 8/8. Connected safe-named graph, two independent seven-axis arm
  chains, finite geometry, positive per-component signed volume, finite representative
  poses, per-joint numerical limit sweeps, 1.30/1.80 m upright envelope and wheel-floor
  contact, assumed 700 mm shoulder-to-TCP chain, 41 samples per gripper over 0–120 mm.
- Deterministic OBJ/MTL + URDF and material/pose output: all 55 generated files match
  fresh in-memory output under `export.mjs --check`.
- Shared authoring tests: 39/39. No shared authoring source was modified.
- Topology audit: 170 visual components; 62,176 raw triangles, 62,064 triangles after
  positional seam welding at 1e-8 m. The 112 collapsed rounded-box seam triangles are
  counted separately, not silently presented as absent from exported meshes. No
  boundary or nonmanifold edges remain per component under this welding tolerance.
  Components intentionally overlap within a link; the whole robot is not one solid.
- Coarse collision OBB broadphase: zero/default pose and all four saved review poses
  have no nonadjacent proxy overlap candidates. Cylinders are bounded by boxes.
  This is a conservative proxy test, not a surface-intersection or clearance proof.
- Additional independent-review proxy checks covered waist low/high limits, raised
  waist max, closed hands, head yaw/pitch limits, and wrist ±0.65 rad. No nonadjacent
  candidate overlap was reported in these chosen cases. Inward shoulder-roll extremes
  can intersect the torso/other arm. Combined-limit collision freedom is not claimed.

The independent zero pose was corrected during review: elbow origins now encode a
bent 1.48 rad home, rather than letting straight-down hands enter the base. Relative
elbow commands and review presets were updated together. Wrist sleeves and supported
rear panels were added; unsupported floating small screws were removed. Exterior
finishing remains photograph-estimated and differs from OEM geometry.

## Render inspection

Blender 4.x offline renders import the actual exported URDF, OBJ and MTL files and
apply the recorded joint pose. Reviewed views include front, side, rear, three-quarter,
low/high lift, reaching, head, closed/open OmniPicker, and wrist pitch endpoints.
The final review set uses one frozen model version. The renderer is included for
reproduction, with no dependency on manufacturer meshes, textures or image pixels.

## Existing repository aggregate gate

The existing `authoring` → `test:models` gate was attempted. It stops at unchanged
`mid-360` USD byte comparison after that model's 5/5 tests pass. Generated hash
`c24a57d282945a4a99345f97443100605c5c80e9f7adbee9701d3fa267e8b40e` differs from
checked-in `d0632062392c5da193c0bc9512c49865e6c32af0483fa30465ba5864ec6935f9`.
A clean archive of main `966507c0474ec916e38ecb83a7918b64a075ccec`, using the same
existing pinned Three 0.185.1 / three-usd-robot 0.11.0 packages and Node 24.19.0,
reproduces the same failure. No unrelated generated USD was changed. Thus the full
existing-model aggregate gate is **not a pass**; its later stages were not reached.

## Unverified and intentionally unsupported

- Cloud browser attempted the local viewer URL and returned `net::ERR_CONNECTION_REFUSED`.
  The HTML/import map and module source exist, but interactive browser rendering,
  sliders, navigation and repeated-input behavior have **not** been browser-verified.
  Offline Blender renders and Node tests do not count as a browser pass.
- No OEM kinematic equivalence, real joint limits, control integration, inertia,
  dynamics, collision-free workspace, flange compatibility, adaptive-gripper contact
  physics, wheel-drive simulation, or hidden internal construction was validated.
- The 700 mm reach endpoint is an independent assumption; exact OEM measurement
  endpoints and link allocation remain unconfirmed.
- No catalog-builder integration, publishing, PR, push or installation in the existing
  catalog was performed. The existing recipe-only vendor-backed r1 remains unchanged.
