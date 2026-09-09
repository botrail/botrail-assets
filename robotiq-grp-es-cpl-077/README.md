# Robotiq GRP-ES-CPL-077

[Manufacturer coupling guide, January 2026](https://blog.robotiq.com/knowledge/couplings-and-cables-for-universal-robots-robots) specifies this coupling for female M8 UR wrists and replacement cable CBL-COM-2077-01. [July 2026 Hand-E quick start](https://blog.robotiq.com/hubfs/UR-e%20Series_Quick_start_HandE_HandE7PL_X-990036-D.pdf) documents direct e-Series installation with M6 screws and M5 hand attachment.

The mesh is an independently authored reference housing. The 75 mm diameter and 13.9 mm mount-to-hand seating are **family-reference approximations**, not measured ES-077 dimensions. In particular, the 2026 2F manual Fig.5-5 labels ES-062, so its dimensions do not verify ES-077. Robot-side nominal PCD50 is represented; four M5 hand-side positions are visual references. Electronics, spring contacts, cable, protector and bolts are BOM-only. No contact engagement, cable routing, detailed fit, mass, CoG or inertia is certified. `mount` is robot-side; `flange` is the reference hand seat at Z=13.9 mm.

## Rebuild and inspect

Geometry is independently authored in Node.js/Three.js using the shared `authoring` tools. No vendor CAD or mesh is read or redistributed. Generated geometry and source are CC0-1.0.

```sh
npm ci --prefix authoring
node robotiq-grp-es-cpl-077/authoring/export.mjs
node robotiq-grp-es-cpl-077/authoring/export.mjs --check
python -m http.server 8765
```

Open `/robotiq-grp-es-cpl-077/authoring/` in a browser. Check the reference against product documentation before using dimensions for a real installation.
