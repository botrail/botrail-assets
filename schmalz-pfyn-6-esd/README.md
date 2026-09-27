# Schmalz PFYN 6 NBR-ESD-55 M5-AG

Independently authored **CC0-1.0 reference geometry** of Schmalz PFYN 6 NBR-ESD-55 M5-AG, part `10.01.01.14188`.
No vendor CAD, drawing, texture or logo is redistributed. Sources checked 2026-09-27.

## Source and adopted values

[Manufacturer source](https://media.schmalz.com/MAM_Library/Dokumente/Datenblatt_Artikel/1/100/10010114188/42ae7edb22df_Datasheet_Article_10.01.01.14188_en-EN.pdf), Design data.

| Quantity | Published value | Model |
|---|---|---|
| Suction / maximum lip diameter | 6 / 6.5 mm | same |
| Height / M5 male length | 11.5 / 4.5 mm | same; shoulder-to-TCP 7 mm |
| Hex across flats | 8 mm | same |
| Elastomer | NBR-ESD, Shore 55 | orange reference material |

## Frames, scope and intentional simplifications

Root at the M5 shoulder with the thread extending in -Z; +Z points into the cup. Threads shown as smooth cylinders; lip profile is independently approximated. Single cup with nipple, no holder/ejector/height compensator. Analytic collision envelope does not model the sealing cavity, compression, ESD behavior or suction force.

Visual meshes and analytic collision shapes are separate. Colours, fillets and small reliefs are illustrative. Bare product mass is metadata only; link masses, centre of mass and inertia remain unknown. No fabricated inertial tensors or claim of verified hardware compatibility.

## Rebuild

From the repository root, install shared dependencies with `npm ci --prefix authoring` then run
`node schmalz-pfyn-6-esd/authoring/export.mjs`. Add `--check` to compare the deterministic checked-in files.
Dimensions are in metres in `authoring/model.mjs`.
