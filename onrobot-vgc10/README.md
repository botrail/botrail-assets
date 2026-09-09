# OnRobot VGC10 — 102844

[Manufacturer datasheet v1.7](https://onrobot.com/storage/datasheets/vgc10/datasheet_vgc10_v1.7_en.pdf), pp.2–6 and 14–16. This reference installs four supplied 30 mm silicone cups directly on the body, with separated A/B channels. It includes the integral tool-side Quick Changer. The robot-side 109498 and robot-specific cable kit are separate products. The supplied adaptor plate, spare cups, fittings and extension pipes remain in the purchase contents but are not all installed at once.

Body width/depth 100 mm and the drawing's 101.5 mm dimension from below the integral QC to the cup plane are retained. The tool-side QC adds a reference 12 mm, yielding `tcp` Z=113.5 mm from this asset's mount. The waist, QC stack and cup centre spacing ±18 mm are approximations; cup fitting/plane calibration remains unverified. Each cup has its own contact frame; `channel_a` and `channel_b` mark their independent group centres. There is no actuator joint: vacuum switching belongs to a control state, not geometry.

Datasheet mass 0.814 kg is kept as a product reference; altered cup/plate/pipe configurations need their own mass. Default attachments are limited to 6 kg under the datasheet's three-40-mm-cup assumptions; the 15 kg custom-attachment maximum does not qualify the depicted four-30-mm arrangement. Its suction capacity remains unknown until vacuum, seal, surface and acceleration are checked. No suction, leakage, cup deformation or pump dynamics are simulated. Collision cylinders are simple cup envelopes. CoG and inertia remain unknown.

## Rebuild and inspect

Geometry is independently authored in Node.js/Three.js using the shared `authoring` tools. No vendor CAD or mesh is read or redistributed. Generated geometry and source are CC0-1.0.

```sh
npm ci --prefix authoring
node onrobot-vgc10/authoring/export.mjs
node onrobot-vgc10/authoring/export.mjs --check
python -m http.server 8765
```

Open `/onrobot-vgc10/authoring/` in a browser. Check the reference against product documentation before using dimensions for a real installation.
