# AGIBOT G1 + original OmniPicker — independent visual study

CC0-1.0 independently authored approximation. **Not the manufacturer's simulation asset,
not a certified digital twin, and not a replacement for the existing catalog recipe.**
The real reference is AGIBOT Genie G1, the wheeled lifting-pedestal dual-arm robot,
with the original two-finger OmniPicker. It is neither Unitree G1 nor Galbot G1.

## References and rights

- [Official G1 product](https://www.agibot.com/products/G1)
- [Official Japanese G1 specifications](https://www.agibot.com/jp/products/G1)
- [Original OmniPicker component on the official X1 page](https://agibot.com/products/X1)

Accessed 2026-10-11. External OEM photos/video were inspected privately for the exterior
silhouette. No OEM image, video, CAD, mesh, USD, URDF, logo texture, or manual drawing is
included, converted, traced into mesh topology, or copied into this model. The independent
surface construction, linkage illustration, and numerical allocations live in `authoring/model.mjs`.
The official full-body promotional render has dexterous hands; those hands are **not** used
here. The original OmniPicker component image governs the two-finger visual treatment.
Do not confuse the component with the newer OmniPicker 3.

The existing `agibot/g1/g1-omnipicker/r1` recipe imports separately licensed vendor data
(CC-BY-NC-SA-4.0, recipe-only). This asset does not relicense or replace that data, and
no catalog recipe or published revision is changed. It requires a separately reviewed
future catalog integration. CC0 applies to our authored files, not external OEM media,
trademarks, industrial-design rights, or any promise of commercial clearance.

## Published facts versus independent model choices

| Item | Published | This model | Status |
|---|---:|---:|---|
| Adjustable overall height | 1.30–1.80 m | 1.30–1.80 m, upright head | Envelope target |
| Single-arm reach | 0.70 m | 0.70 m shoulder pivot to TCP in straight pose | Endpoint assumption, **not verified OEM kinematics** |
| Original OmniPicker maximum opening | 120 mm | 0–120 mm between parallel contact-pad planes | Simplified four-bar-style visual motion |
| Robot mass | 150 kg | Not assigned to links | No fabricated inertia tensors |
| OmniPicker mass | 0.43 kg | Not assigned to links | No dynamics claim |
| Lift stroke | Not independently established | 0.50 m | Chosen from height envelope; differs from legacy vendor simulation |
| Base footprint | Not established | 650 × 520 mm | Photo estimate |
| Upper arm / forearm / wrist spacing | Not established | 265 / 235 / 32 mm | Independent allocation; 18 mm mount plus 150 mm TCP offset completes reach |
| Wheel diameter | Not established | 210 mm | Photo estimate, decorative fixed wheels |
| Head / torso / mast / fasteners | Not established | See source constants | Visual estimates |

No hole pattern, flange fit, service hatch, sensor position, joint axis, range, speed,
force, wheel arrangement, hidden mechanism, or collision proxy is certified. The visible
wheel discs do not establish the manufacturer's omnidirectional drive construction.
The rear screen, mast seams, and chest trim are simplified independent external details;
manufacturer logo lettering is intentionally omitted.

## Coordinates and articulation

Metres, Z up, +X front, +Y left. Root `base_link` is the floor reference. Independently
named joints include `lift`, `waist_pitch`, `head_yaw`, `head_pitch`, seven illustrative
axes per arm, and two gripper opening drives with mimic followers. The gripper drive is
an **angle**, 0–asin(60/70) radians, not a linear stroke command. Pad gap is `0.14*sin(q)`
metres. Counter-rotating distal fingers keep pads parallel; the linkage is an illustration,
not the actual adaptive mechanism or contact dynamics. `left_tcp` / `right_tcp` are
chosen at the mid-plane of the nominal finger region. They are not OEM grasp frames.

The independent zero pose has both elbows pre-bent by 1.48 rad in the joint origins,
so a plain URDF load keeps the hands above the base. Elbow commands are offsets from
that home pose; +1.48 rad straightens an arm. This is our home convention, not an OEM one.

All joint limits and the placeholder effort/velocity values of 1 are illustrative UI/export
bounds, not hardware data. Do not command a real robot from this URDF. Wheels are fixed
visuals. Collision boxes/cylinders are independent coarse proxies, not certified body
clearance. Some extreme combinations of the illustrative joint limits can self-intersect.
The test sweep checks numerical and graph stability, **not collision-free motion**.
No mass/inertial blocks or dynamic simulation claims are supplied.

## Reproduce and inspect

Use **Node 24.19.0** for byte-identical generation (also pinned in `authoring/.nvmrc`
and the asset-specific CI job). The eight geometry/motion tests also pass on Node 22,
but its floating-point output differs in `torso.obj`; do not regenerate committed
files with a different runtime. Existing models retain their own Node 22 CI job.

From repository root, using the shared author's pinned dependencies:

```sh
npm --prefix authoring ci
# Node package resolution for this asset uses its adjacent link into the shared dependencies.
ln -s ../../authoring/node_modules agibot-g1-omnipicker/authoring/node_modules
node agibot-g1-omnipicker/authoring/export.mjs
node agibot-g1-omnipicker/authoring/export.mjs --check
node --test agibot-g1-omnipicker/authoring/model.test.mjs
python3 -m http.server 8000
```

Open `/agibot-g1-omnipicker/authoring/index.html`. No external textures or vendor assets
are needed. The source ZIP includes shared helper source, but excludes installed npm
packages. Blender 4.x can render the exported OBJ/MTL/URDF via `authoring/render_review.py`;
`docs/poses.json` records the exact independent review poses. Browser interaction testing
and Blender offline rendering are separate verification stages.

Geometry is generated deterministically. Lossless target-local OBJ compaction preserves
all faces, corner attributes, normals, materials and object boundaries. Collision geometry
is separate from visual geometry. Read `docs/verification.md` for actual test coverage and limits.
