# SCHUNK MPG-plus 25

Independently authored **CC0-1.0 reference geometry** of SCHUNK MPG-plus 25, part `305501`.
No vendor CAD, drawing, texture or logo is redistributed. Sources checked 2026-09-27.

## Source and adopted values

[Manufacturer source](https://schunk.com/in/en/gripping-systems/parallel-gripper/mpg-plus/mpg-plus-25/p/000000000000305501), Technical details and product illustration.

| Quantity | Published value | Model |
|---|---|---|
| Envelope X/Y/Z | 26 / 18 / 27 mm | same at closed position |
| Stroke per jaw | 3 mm | same; one drive plus mimic |
| Bare mass | 60 g | metadata only |
| Closing force (sum of jaws) | 38 N at nominal 6 bar | 19 N per jaw simulation effort |
| Maximum finger length / mass | 32 mm / 20 g per finger | user-supplied fingers required |

## Frames, scope and intentional simplifications

Jaw profile, closed spacing, cover reliefs and component partitions are independently estimated from the illustration; only overall envelope and stroke are dimensional facts. Mount holes are not inferred. Root is the rear face; TCP at Z27 mm. Not a dimensional reproduction of the jaw attachment interface. No customer fingers or robot-specific adapter. Velocity 0.04 m/s is a simulation setting.

Visual meshes and analytic collision shapes are separate. Colours, fillets and small reliefs are illustrative. Bare product mass is metadata only; link masses, centre of mass and inertia remain unknown. No fabricated inertial tensors or claim of verified hardware compatibility.

## Rebuild

From the repository root, install shared dependencies with `npm ci --prefix authoring` then run
`node schunk-mpg-plus-25/authoring/export.mjs`. Add `--check` to compare the deterministic checked-in files.
Dimensions are in metres in `authoring/model.mjs`.
