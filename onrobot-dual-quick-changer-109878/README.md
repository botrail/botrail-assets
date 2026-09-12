# OnRobot Dual Quick Changer v3 — 109878

Independent CC0 reference model of the [109878 Dual Quick Changer](https://b2b.onrobot.com/dual-quick-changer/).
Source dimensions: [Quick Changers datasheet v2.0, page 8](https://onrobot.com/storage/datasheets/quick-changers/datasheet_quick_changers_v2.0_en.pdf).
No manufacturer CAD, drawings, images or meshes are redistributed.

| Figure | Published | Model |
| --- | --- | --- |
| Width / height | 127 / 93.5 mm | Nominal face extents 127 / 93.5 mm |
| QC face diameter | 71 mm | 71 mm |
| Angle between tool normals | 120° | 120° |
| Mass | 0.41 kg | Catalog specification only; no invented link inertia |
| Face centers | Derived from the drawing extents | X=±45.75 mm, Z=62.7561 mm |

`mount` is the robot interface; `flange_a` and `flange_b` are the two tool-side
QC mating planes, rotated ±60° about Y. There is no additional robot-side QC
between the robot and this product. Latches, bridge, bolts and electrical
contacts are simplified; detailed fit and fastener selection are unverified.
Collision uses independent analytic cylinders/box. The changer's load rating
does not establish the host robot's payload, CoG or inertia limits.
Use the external Compute Box route for dual tooling; runtime I/O and software
configuration are separate from this geometry.

From the repository root:

```sh
npm ci --prefix authoring
node onrobot-dual-quick-changer-109878/authoring/export.mjs
node onrobot-dual-quick-changer-109878/authoring/export.mjs --check
python -m http.server 8765
```

Open `/onrobot-dual-quick-changer-109878/authoring/` to inspect the model.
Catalog recipe: `onrobot/quick-changer/109878/r1` (requires catalog publication).
