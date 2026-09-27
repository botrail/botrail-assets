# Schmalz SCPMc 05 S01 NC M8-6 PNP

Independently authored **CC0-1.0 reference geometry** of Schmalz SCPMc 05 S01 NC M8-6 PNP, part `10.02.02.05559`.
No vendor CAD, drawing, texture or logo is redistributed. Sources checked 2026-09-27.

## Source and adopted values

[Manufacturer source](https://media.schmalz.com/MAM_Library/Dokumente/Datenblatt_Artikel/1/100/10020205559/a3b79e26ccea_Datasheet_Article_10.02.02.05559_en-EN.pdf), pp1-2 individual article datasheet.

| Quantity | Published value | Model |
|---|---|---|
| Body L / B / H | 76.5 / 12 / 65.3 mm | same |
| L1 / H1 incl. protrusions | 95.3 / 73.9 mm | nominal silencer and connector extent |
| Mass | 84 g | metadata only |
| Air / vacuum connections | D4 / D4 | visual fitting mouths |
| Max. suction rate / vacuum | 7.5 L/min / 870 mbar | metadata only |

## Frames, scope and intentional simplifications

Remote vacuum generator, not a suction end effector. Root is the underside datum, +Z up; tcp coincides with mount for loading convenience only. Body divisions, labels, ports and filter details are independently simplified; nominal dimensions follow the individual sheet. Mounting holes and pressure dynamics are not modeled. No supply hose, cable or bracket. Individual article sheet adopted instead of the family brochure's 85 g value.

Visual meshes and analytic collision shapes are separate. Colours, fillets and small reliefs are illustrative. Bare product mass is metadata only; link masses, centre of mass and inertia remain unknown. No fabricated inertial tensors or claim of verified hardware compatibility.

## Rebuild

From the repository root, install shared dependencies with `npm ci --prefix authoring` then run
`node schmalz-scpmc-05/authoring/export.mjs`. Add `--check` to compare the deterministic checked-in files.
Dimensions are in metres in `authoring/model.mjs`.
