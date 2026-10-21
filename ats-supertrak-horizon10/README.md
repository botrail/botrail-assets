# ATS SuperTrak HORIZON10 reference components

Independently authored CC0-1.0 geometry of the **ATS SuperTrak HORIZON10**:
90° curved module, 1000 mm straight module and a shuttle. No manufacturer CAD,
drawings, photographs or logos are included.

Reference: [manufacturer specifications and configurations](https://supertrakconveyance.com/products/supertrak-horizon10/specs-components-configurations/).

| Value | Published value | Model |
|---|---:|---:|
| Straight section pitch | 1000 mm | 1000 mm |
| Two 90° sections, loop width | 1200 mm | 1200 mm nominal diameter |
| Fixture width | 152–1000 mm | 152 mm carrier |
| Maximum speed | 4 m/s | catalog specification; no drive simulation |
| Payload | 10+ kg per shuttle | 10 kg catalog nominal |
| Body height / radial depth | Not established by this source | 180 / 70 mm, visual estimates |
| Shuttle depth / housing height | Not established by this source | 100 / 80 mm, visual estimates |

The 600 mm radius is a layout interpretation of the nominal 1200 mm configuration,
not a measured guide running surface. Rail profiles, cover seams, encoder strip,
fasteners and carriage shape are independently estimated. Colours approximate
anodised aluminium and dark covers. Hole patterns, mass distribution, magnetic
forces, control electronics and installation tolerances are not specified.
The carrier width is an adopted fixture size, not a claim about the bare shuttle.

Z-up, metres. Curves occupy the first XY quadrant around `mount`; their outer nominal
face runs from `(0.6, 0)` to `(0, 0.6)`. Straight modules run from Y=0 to Y=1,
with the outer face X=0. `start`/`end` mark the nominal top of the guide.
Shuttles are centred at `mount`, with `surface` 24 mm above it. Runtime layout,
supports, stands, custom PCB nests and motion belong to the consuming Python cell.

Visuals are detailed meshes; collisions are separate conservative box tiles which
preserve the central opening. They are layout approximations, not certified envelopes.
`horizon10-*.usda` includes the fixed articulation and collisions for catalog import.
`horizon10-*-visual.usda` is its static companion for `Scene.load_usd`: it keeps
geometry, colours and frames and removes physics schemas and collision prims.
The consumer must assign Botrail visibility, collision state, materials and identity.

```sh
cd ats-supertrak-horizon10/authoring
npm ci
npm run export
npm test
npm run view
```

Open `http://127.0.0.1:8744/viewer.html` to inspect the three components.
