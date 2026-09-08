# ATI RCV-250 / CRX-10iA kit reference models

Three independently authored CC0 reference models for the real ATI
`9150-COB-CRX10-RCV250-01` purchase kit:

| Model | Actual product | Catalog ID |
|---|---|---|
| Robot interface plate | ATI 3700-50-9210 | `ati/adapter/3700-50-9210/r1` |
| Side mounting bracket | ATI 9005-50-6091 | `ati/adapter/9005-50-6091/r1` |
| Spindle | ATI 9150-RCV-250 | `ati/rcv/rcv-250/r1` |

The complete kit ID is `ati/rcv/rcv-250-crx10-kit/r1`; the catalog composes
these models with a FANUC CRX-10iA host. Manufacturer support comes from the
specified purchase configuration, separately from the precision of these shapes.
[FANUC's ATI listing](https://crx.fanucamerica.com/cobot-devices/ati-crx-ready-end-effectors)
and [ATI's CRX documentation](https://www.ati-ia.com/library/documents/ATI_MR_CRX.zip)
identify the product family and kit. The kit SKU and supplied parts are in
manual 9610-50-1049-03, Table 2.5; assembly drawing 9640-50-1041 identifies CRX-10iA.

## Dimensions and sources

Dimensions are numeric measurements of the manufacturer's public STEP files.
The CAD serves only as a measuring source; no manufacturer mesh, B-Rep,
image, drawing or traced silhouette is included or needed by the generator.
[Measurement references](docs/measurements.md) record input hashes and coordinates.

| Feature | Measured product [mm] | Reference model [mm] |
|---|---|---|
| 3700-50-9210 outline / thickness | 127 × 66.04 / 8.89 | Same |
| Robot bolt circle / clearance holes | PCD50 / 4 × Ø6.76 | Same, actual open bores |
| Robot-side boss | Ø31.46298 × 3.302 projection | Same envelope; end chamfer omitted |
| Central bore | Ø20.32 | Same |
| Plate-to-bracket axes | 114.3 × 19.05, 4 holes | Same |
| 9005-50-6091 outline / thickness | 139.7 × 38.1 / 12.7 | Same |
| Bracket-to-tool axes | 31.75 × 19.05, 4 holes | Same, tool rotated 90° in the kit |
| Spindle side plane to axis | 36.46 | Same |
| Spindle side-hole pattern | 19.05 × 31.75 | Same |
| Housing diameter / main axial interval | Ø82.55 / 0…79 | Same envelope with side mounting flat |
| Rear cap axial interval | −24.13…0 | Same cylinder envelope |
| Nose intervals from housing datum | 86.493 / 101.733 / 175.774 / 195.002 | Stepped cylinders at these stations |

The spindle STEP is labelled RCV-250-E. Its shared mounting housing is the
measurement reference; the authored nose is a simplified envelope and does not
assert an exact collet variant. No cutting bit is modelled.

## Deliberate approximations

- Procedural plates, cylinders and bores preserve mounting positions; corner
  bevels, recess details and internal motor/compliance parts are simplified.
- Threaded holes are plain cylindrical openings. Their nominal diameter is
  not a thread or tolerance model. Spindle bores are drawn 12 mm deep for
  inspection; that authored depth does not establish usable thread engagement.
- Bracket screws/pins are omitted from the picture and retained in the kit BOM.
  Their central clearances/counterbores are authored envelopes because the
  measured assembled STEP includes the installed hardware.
- Orange housing, dark plates and metallic nose are authored appearance,
  informed by the [manufacturer's CRX product photograph](https://crx.fanucamerica.com/cobot-devices/ati-crx-ready-end-effectors).
  No logos, labels or image textures are reproduced.
- Collision bodies are conservative boxes/cylinders in the neutral state;
  holes are filled in collision geometry. They are not fastener-clearance,
  compliant-contact or swept-tool models. No joint is invented for air-driven
  compliance or spindle rotation, and no mass/inertia is estimated.

## Frames and assembly

All geometry is in metres. Each URDF has a `mount` root on its support plane,
with +Z pointing into the part. The plates have `flange` at +8.89 / +12.7 mm.
The spindle's shaft axis is parallel to local +X, 36.46 mm above its mounting
plane. Its local mount origin is at the center of the four side holes.

Assembly uses the robot plate as kit base, bracket mount at the plate flange,
and spindle mount at the bracket flange with a +90° rotation around Z.
The `tcp` frame coincides with `mount`: it is a mounting reference, **not a
calibrated cutting tip**. Add the selected bit and a measured tool-tip frame
before configuring a machining path.

## Rebuild and check

Consumers load prebuilt catalog packages. Asset development uses:

```bash
python -m pip install -r ati-rcv250-crx-kit/tools/requirements.txt
python ati-rcv250-crx-kit/tools/generate_models.py
python ati-rcv250-crx-kit/tools/check_models.py
python ati-rcv250-crx-kit/tools/generate_models.py --check
```

The checks independently probe the holes with rays, check support frames and
plate bounds, and require watertight visual meshes and primitive collisions.
They do not certify precision fit, loads, fasteners, pneumatics or processing.
