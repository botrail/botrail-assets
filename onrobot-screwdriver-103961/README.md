# OnRobot Screwdriver — 103961

Independent CC0 reference geometry of [OnRobot 103961](https://b2b.onrobot.com/screwdriver/).
The source is the public [Screwdriver datasheet v1.7](https://onrobot.com/storage/datasheets/screwdriver/datasheet_screwdriver_v1.7_en.pdf),
including the mechanical drawing on page 34. No vendor CAD, document artwork,
images or meshes are redistributed. Restricted user manuals are not dimension
sources for this asset.

| Figure | Published | Model |
| --- | --- | --- |
| Static length, excluding projecting carrier | 308.5 mm drawing; 308 mm nominal | 308.5 mm |
| Width / depth | 86 / 114 mm | 86 / 114 mm |
| Rear to side coupling axis | 155.4 mm | 155.4 mm |
| Nose along native X | Derived: 308.5−155.4 | 153.1 mm |
| Nose diameter | 49 mm | 49 mm |
| Embedded stroke | 55 mm | 55 mm, prismatic `shank` |
| Torque / speed / mass | 0.15–5 N·m / 340 rpm / 2.5 kg | Catalog specifications; not simulated dynamics |
| Mating plane to screw axis | Not dimensioned in this public drawing | Approximate 80 mm layout datum; unverified TCP |

`mount` is the tool-side QC interface, **not an ISO robot flange**. Native
+X is the screw axis; +Z enters the housing from its side mount. `tip` has
+Z toward the tool body; `bit` is the only moving/contact link. The housing
cross-section, caps, taper, coupling and latch are authored approximations.
Their analytic collision shapes preserve the side-mounted arrangement but
are not a guaranteed envelope. No unverified mass tensor is emitted.

The simulation's zero stroke is 17 mm inside the nose datum. This is an
authored process coordinate, **not the manufacturer's home or calibrated
TCP**. Joint effort 50 and velocity 0.2 are simulation settings, not product
ratings. The 4 mm hex bit is shown as a cylindrical contact envelope;
carrier internals, retention and the device's control behavior are omitted.

Two configurations share the generator:

- `urdf/onrobot-screwdriver-103961.urdf`: base tool with a metric bit reference.
- `a50/urdf/onrobot-screwdriver-103961-a50.urdf`: tool with separately purchased
  [Type A 50 mm extender 109301](https://b2b.onrobot.com/accessories2/).
  The 50 mm addition and 12.2 mm envelope diameter follow the
  [public extender drawing](https://onrobot.com/storage/technical_drawings/bit-extenders.pdf).
  Screws remain exposed; the standard tool's full-retraction feature is not
  represented. This configuration is not a manufacturer purchase kit.

The configured catalog model requires 109301 and Metric Kit 105121.
Its total mounted mass is unknown: 2.5 kg is the **bare tool** value and
must not silently stand for the extended assembly. Mounting hardware,
electrical/Compute Box configuration, software, load limits and process
performance require commissioning.

```sh
npm ci --prefix authoring
node onrobot-screwdriver-103961/authoring/export.mjs
node onrobot-screwdriver-103961/authoring/export.mjs --check
node --test onrobot-screwdriver-103961/authoring/model.test.mjs
python -m http.server 8765
```

Open `/onrobot-screwdriver-103961/authoring/`; the slider operates the 55 mm
feed. Catalog recipes are `onrobot/screwdriver/103961/r1` and
`onrobot/screwdriver/103961-a50/r1` (require catalog publication).
