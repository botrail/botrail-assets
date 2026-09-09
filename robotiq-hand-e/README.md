# Robotiq Hand-E — HND-GRP

The depicted unit uses HND-FIN-MLD-KIT overmolded fingers, not the older aluminium-finger assembly or Hand-E P7L. [Manufacturer manual, July 2026](https://blog.robotiq.com/hubfs/Hand-E_Hand-E%20P7L_Manual_Generic_2026-07-12.pdf), Fig.5-1: diameter 75 mm, body datum 100.5 mm, overall 146 mm, opening 50 mm. Two prismatic racks travel 25 mm each; `finger_joint=0` closes and `0.025` opens. `tcp` is the nominal tip plane at 146 mm; contact frames are at the flat pads. The waisted shell, fasteners, finger profile and small clearances are independent approximations. Nominal drawing dimensions are not toleranced manufacturing geometry.

The published 1068/1070 g and 157 mm TCP values refer to a different/differently scoped assembly from this 146 mm drawing. We do not assign those values to the bare HND-GRP, nor subtract an assumed coupling mass. Link masses, CoG and inertia remain omitted. Joint velocity 0.05 m/s and effort 50 are simulation settings. GRP-ES-CPL-077, mounting hardware and the model-specific protector are needed for the selected new-wrist UR installation. Use a purchase kit to include them together.

## Rebuild and inspect

Geometry is independently authored in Node.js/Three.js using the shared `authoring` tools. No vendor CAD or mesh is read or redistributed. Generated geometry and source are CC0-1.0.

```sh
npm ci --prefix authoring
node robotiq-hand-e/authoring/export.mjs
node robotiq-hand-e/authoring/export.mjs --check
python -m http.server 8765
```

Open `/robotiq-hand-e/authoring/` in a browser. Check the reference against product documentation before using dimensions for a real installation.
