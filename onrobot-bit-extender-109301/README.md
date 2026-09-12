# OnRobot Bit Extender A 50 mm — 109301

[Manufacturer product listing](https://b2b.onrobot.com/accessories2/),
[public extender drawing](https://onrobot.com/storage/technical_drawings/bit-extenders.pdf).
Independently authored CC0 reference; no manufacturer CAD or artwork.

| Figure | Published | Model |
| --- | --- | --- |
| Added reach | 50 mm | `mount` to `flange`: +50 mm along Z |
| Envelope diameter | 12.2 mm | 12.2 mm cylinder |
| Coupling tolerances / insertion depths / mass | Not established | Unknown; not inferred |

This is a functional reach envelope, not the complete machined profile or
a generic ISO adapter. Internal Type A engagement, bit retention and mass
are omitted. The configured Screwdriver model already contains this visual;
do not attach a second copy to the `103961-a50` model.

```sh
npm ci --prefix authoring
node onrobot-bit-extender-109301/authoring/export.mjs
node onrobot-bit-extender-109301/authoring/export.mjs --check
python -m http.server 8765
```

Open `/onrobot-bit-extender-109301/authoring/`.
Catalog recipe: `onrobot/bit-extender/109301/r1` (requires catalog publication).
