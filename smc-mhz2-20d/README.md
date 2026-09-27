# SMC MHZ2-20D

Independently authored **CC0-1.0 reference geometry** of SMC MHZ2-20D, part `MHZ2-20D`.
No vendor CAD, drawing, texture or logo is redistributed. Sources checked 2026-09-27.

## Source and adopted values

[Manufacturer source](https://www.smcworld.com/catalog/en/rotary_airchuck/MHZ_2-E/6-3-p0381-0463-mhz_en/data/6-3-p0381-0463-mhz_en.pdf), pp411, 419.

| Quantity | Published value | Model |
|---|---|---|
| Body / guide / overall length | 52.8 / 9.5 / 84.8 mm | same |
| Body cross section | 42 x 27.6 mm | same |
| Nominal base-jaw gap closed / open | 16.3 / 26.3 mm | same; q=0..5 mm per jaw |
| Mass (bare gripper) | 230 g | metadata only |
| External grip per finger | 42 N at 0.5 MPa, L20, mid-stroke | metadata only; effort is a simulation limit |

## Frames, scope and intentional simplifications

Base jaw tips are simplified; no customer fingers, fittings, switches or robot adapter are included. Mount is the rear face, +Z to jaws. TCP is the bare jaw tip at Z84.8 mm, not a workpiece grasp centre. Nominal thread facts: rear M5, finger M4. Holes, tolerances and detailed mating fit are not reconstructed. Velocity 0.03 m/s is a simulation setting.

Visual meshes and analytic collision shapes are separate. Colours, fillets and small reliefs are illustrative. Bare product mass is metadata only; link masses, centre of mass and inertia remain unknown. No fabricated inertial tensors or claim of verified hardware compatibility.

## Rebuild

From the repository root, install shared dependencies with `npm ci --prefix authoring` then run
`node smc-mhz2-20d/authoring/export.mjs`. Add `--check` to compare the deterministic checked-in files.
Dimensions are in metres in `authoring/model.mjs`.
