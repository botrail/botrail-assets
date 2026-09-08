# Numeric measurement provenance

Source: [ATI CRX archive](https://www.ati-ia.com/library/documents/ATI_MR_CRX.zip).
Measurement date: 2026-09-08. Archive SHA256:
`dee40069431aedcdd8d4dd47e0628eacff32bf02954ea29330d712920951708d`.
Only numeric geometric facts were carried into the procedural authoring code.
No topology, tessellation, drawing image or vendor CAD file is distributed here.

The following entries are under `ATI_MR_CRX/CAD Files/RCV250/`:

| File | SHA256 |
|---|---|
| `3700-50-9210.STEP` | `93aa31201b87535378342737d73cb848a09321b331190704250a6ba658b7f68c` |
| `ATI-9005-50-6091.step` | `688dd79a7c8491839947668c6b98867988dbb716bef5bd00663cb29c44412321` |
| `9150-RCV-250.STEP` | `9a52e71840704dfe10b284736f2e283367a0035b5e21bf8c50e452b0181f607b` |

OpenCASCADE STEPCAF loading converts header units to metres. Planar and
cylindrical surfaces provide support coordinates and hole axes. Values below
are mm; they are nominal CAD measurements, not manufacturing tolerances.

## Robot plate

The original coordinate system has its thickness along Y. Body bounds are
X ±63.5, Z ±33.02, Y=0…8.89; the central boss extends to Y=12.192.
The root support face is Y=8.89. Local coordinates are `(x, z, 8.89-y)`.

- PCD50 holes: X/Z=(±17.67766953, ±17.67766953), bore radius3.38.
  Counterbore radius5.625 occupies original Y=0…6.38.
- Boss radius15.73149, central bore radius10.16. Corner radius3.302.
- Bench pattern: X=±57.15, Z=±9.525, nominal radius3.0; locator axes
  X=±57.15, Z=0, radius2.996565.
- Robot pin openings: (X,Z)=(25,0), (0,−25), radius3.02387.
- Other patterns preserved visually: X=±47.5, Z=±12.5, radius3.0;
  X=±47.5, Z=0, radius2.02311; X=±43, Z=−19.838/26.162, radius3.0;
  X=±43, Z=3.162, radius2.52349. Their application is not inferred.

## Side bracket

Original body bounds X ±69.85, Y ±19.05, Z=−12.7…0. The root face is Z=0;
local coordinates are `(x, -y, -z)`. Corner radius3.302.

Outer axes: X=±57.15, Y=±9.525. Bore radius3.378; counterbore radius5.626,
original Z=−12.7…−6.325. Locator axes X=±57.15, Y=0, radius3.02387.

Inner screw axes: X=±15.875, Y=±9.525. The measured STEP includes the
installed screws (shank radius3) and pins. Their full counterbore/clearance
surfaces are not independently exposed; the reference model explicitly authors
these envelopes at radius3.378 / 5.626 without a tolerance claim.
Pin axes X=0, Y=±9.525, body hole radius2.996565.

## Spindle housing

Source assembly is labelled `9150-RCV-250-E`. Common housing dimensions are
used; internal mechanics and the collet variant are not reproduced.
Original shaft axis is X. Local coordinates are `(x-30.48, -z, y+36.46)`.

- Mounting side is original Y=−36.46 over X=0…60.96.
- Side screw axes X=20.955/40.005, Z=±15.875, nominal radius3.0;
  pin holes X=20.955/40.005, Z=0, radius3.02387.
- Main housing: radius41.275, X=0…79. Rear cap X=−24.13…0.
- Front ring X=79…86.493, radius40.08438.
- Front nose/envelopes: radius22.5 to X=101.733; radius12.7 to
  X=175.774; radius7 to X=195.002. The actual surface transitions,
  nut flats and collet bore are simplified. The reference ends before the
  source's furthest shaft/bit detail at X=204.73795.
- Connector envelope: original X center−17.54105, Y=34.3407…62.9158,
  radius5.9944. Rear nub X=−30.309…−24.13, radius9.75.

After a +90° in-plane turn of the spindle, the measured four screw centers
align with the bracket at (±15.875, ±9.525). The two plate faces stack by
8.89+12.7=21.59 mm; the spindle axis is 58.05 mm from the robot support plane.
Robot wrist pin clocking, tolerance stacks, fastener engagement and cutting TCP
are not established by these numeric matches.
