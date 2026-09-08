# NIMAK 95.020.516 / P3U reference model

An independently authored CC0 picture and mounting reference of the real NIMAK multiframeGUN 95.020.516 with P3U coupling, configured with [BX-NIMAK-HW-A replacement hardware](docs/assembly.md). It can move with an attached robot. The right jaw opens about the measured pivot using one joint. See [opening, position commands and simulation limits](docs/opening.md). The maximum physical opening and speed remain uncalibrated.

| Quantity | Source | Model |
| --- | --- | --- |
| Product and mount | NIMAK configurator: 95.020.516, multiframeGUN X, P3U | Same identifiers; no newly invented SKU |
| Coupling mating plane | Received 06.000.027-A: Z0 mm | `mount`, Z0 |
| Coupling / flange support planes | Received CAD: Z19 / Z42 mm | Fixed frames at 19 / 42 mm |
| Mount pattern | Received CAD: 10 clearance axes, PCD160, nominal Ø11 | Ten nominal visual Ø11 bores; see assembly record for coordinates |
| Pilot | Received CAD: Ø100, 5 mm cylindrical + chamfer to 6 mm | Ø100 ×5 mm cylindrical approximation, chamfer omitted |
| Locating pin | Received CAD: X−80 mm, Ø10, Z−11..7 mm | Same nominal cylinder |
| Hardware | HW-A: MISUMI CB10-25 ×10, washer 1 mm | Separate bolt links, nominal Ø10×25 shafts and Ø16×10 heads; ten washers |
| Closed electrode contact | Received CAD: (−13.4, 0, 1332) mm | `cad_tip`, same coordinates; not a calibrated weld TCP |
| Arm/blade location | Received CAD component bounds and electrode axes | Primitive blade/holder envelopes; tips meet in the closed pose |

The source is the [NIMAK gun configurator](https://www.nimak.com/en/weldinggunconfigurator/) and user-supplied `95.020.516.stp`. Its SHA256 is `1ed279a1b42623fa618aedf65ea5bf3ef77123daf4f3ea724b82b716f8b9e73d`; the file is not redistributed. Only measured numeric facts are used to author boxes and cylinders. No vendor mesh, surface or traced contour is shipped. The configurator designation `LRN 300-001-` is not a verified drive model or a stroke measurement.

Transformer, supports, blade bends, housing contours, paint and smaller features are illustrative approximations. Internal drive geometry is omitted; its nonlinear linkage is documented numerically. Visual recesses around bolt heads are authored clearances. There is no thread helix, head socket or detailed internal mechanism. Hoses, water/air connections and cable routing are omitted. Collision geometry keeps the large throat open using separate boxes/cylinders; it fills mount bores, omits fasteners/pins and is not suitable for micrometre fits or complete CAD clearance verification. Load/inertia, active squeeze force and process readiness are not modelled.

`order.requires` in the catalog lists the ten separately purchased CB10-25 screws. They are already visible here; do not attach a second set. Coupling and flange are included once. This engineering configuration is not a manufacturer-supported Kawasaki/NIMAK kit.

Regenerate from the repository root with Python 3.13:

```sh
python -m pip install -r authoring/reference-requirements.txt
python nimak-multiframegun/tools/generate_model.py
python nimak-multiframegun/tools/generate_model.py --check
python -m unittest discover -s authoring/tests -p 'test_reference_models.py'
```

The URDF uses metres/radians, `mount` as the root and local +Z into the gun. `jaw_opening` controls the right arm; `moving_tip` follows its electrode. The 0–20 degree range and 0.2 rad/s velocity are simulation settings, not manufacturer maximums. Prebuilt catalog URDF/USD require no authoring environment.
