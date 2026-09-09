# OnRobot Quick Changer robot side — 109498 (QC-R v3)

[Manufacturer datasheet v2.0](https://onrobot.com/storage/datasheets/quick-changers/datasheet_quick_changers_v2.0_en.pdf), pp.2–7, distinguishes current 109498 from discontinued 102037/104277. It lists robot-side weight 0.06 kg separately from the 0.14 kg tool side. This asset contains **only the robot side**. The tool side is integral to the RG6/VGC10 reference models.

Nominal diameter 71 mm and mount-to-tool interface 13.60 mm are retained. The release button, locking bar and exterior transitions are approximate. `mount` is the robot flange plane and `flange` is the tool mating plane. Latch travel/engagement and electrical contacts are not simulated. The ring mesh has nominal four M6 clearance holes on PCD50; manufacturing fit and bolt length remain unverified. Datasheet load/torque limits depend on static/dynamic conditions, so a generic payload rating is not used to qualify a cell. The electrical cable kit is a separate purchase choice. CoG and inertia remain unknown.

## Rebuild and inspect

Geometry is independently authored in Node.js/Three.js using the shared `authoring` tools. No vendor CAD or mesh is read or redistributed. Generated geometry and source are CC0-1.0.

```sh
npm ci --prefix authoring
node onrobot-quick-changer/authoring/export.mjs
node onrobot-quick-changer/authoring/export.mjs --check
python -m http.server 8765
```

Open `/onrobot-quick-changer/authoring/` in a browser. Check the reference against product documentation before using dimensions for a real installation.
