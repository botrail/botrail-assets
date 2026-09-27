# SMC ZP3-T10UMN-A5

Independently authored **CC0-1.0 reference geometry** of SMC ZP3-T10UMN-A5, part `ZP3-T10UMN-A5`.
No vendor CAD, drawing, texture or logo is redistributed. Sources checked 2026-09-27.

## Source and adopted values

[Manufacturer source](https://static.smc.eu/pdf/ZP3_EU.pdf), p9, flat type with groove and vertical adapter.

| Quantity | Published value | Model |
|---|---|---|
| Suction / maximum lip diameter | 10 / 11 mm | same |
| Overall height / M5 thread length | 12.5 / 3 mm | same; shoulder-to-TCP 9.5 mm |
| Hex across flats | 10 mm | same |
| Pad / adapter | NBR / brass (default) | dark elastomer / metallic finish |

## Frames, scope and intentional simplifications

Includes ZP3-10UMN pad and ZP3A-T3-A5 adapter, not a buffer. Root at M5 shoulder; +Z into cup. Thread pitch not meshed. Grooves, rubber wall and plated finish are visual approximations. Analytic collision does not model sealing, compression or vacuum forces.

Visual meshes and analytic collision shapes are separate. Colours, fillets and small reliefs are illustrative. Bare product mass is metadata only; link masses, centre of mass and inertia remain unknown. No fabricated inertial tensors or claim of verified hardware compatibility.

## Rebuild

From the repository root, install shared dependencies with `npm ci --prefix authoring` then run
`node smc-zp3-t10umn-a5/authoring/export.mjs`. Add `--check` to compare the deterministic checked-in files.
Dimensions are in metres in `authoring/model.mjs`.
