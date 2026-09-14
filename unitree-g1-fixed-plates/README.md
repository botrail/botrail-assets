# Unitree G1 camera and radar fixed plates

Independent CC0 visual reference models of two commercially listed G1 spare
parts. These are not manufacturer CAD or verified installation drawings.

| Reference product | Seller article number | GTIN | Catalog ID |
| --- | --- | --- | --- |
| [Unitree G1 Camera fixed plate](https://www.quadruped.de/Unitree-G1-Camera-fixed-plate) | 1297 | 0658917598341 | `unitree/g1/camera-fixed-plate/r1` |
| [Unitree G1 Radar fixed plate](https://www.quadruped.de/Unitree-G1-Radar-fixed-plate) | 1296 | 0658917598334 | `unitree/g1/radar-fixed-plate/r1` |

1296 and 1297 are QUADRUPED.DE article numbers, not established Unitree OEM part
numbers. The seller identifies the manufacturer as Unitree and explicitly
states that technical documentation for these spare parts is unavailable.

| Quantity | Published value | Reference model |
| --- | --- | --- |
| Camera plate blank, length × width × thickness | Unknown | 44 × 60 × 2 mm, estimated |
| Radar plate blank, length × width × thickness | Unknown | 49.6 × 62.4 × 2 mm, estimated |
| Mounting holes | Photo shows apertures; dimensions unknown | 4 mm diameter, estimated positions |
| Edge treatment and stiffening bead | Photo-informed only | Bevel and shallow bead, approximate |
| Mass / CoG / inertia | Unknown | Not populated |
| Fasteners and G1 revision compatibility | Unknown | Not claimed |

The outlines, open fork, clipped corners and visible holes follow the seller
photos. Absolute scale, depth, finish and mounting datums are visual estimates.
No vendor photo, drawing or CAD is redistributed. The analytic collision box
encloses the reference model but is not a verified envelope of the real part.

The model root `mount` is a **reference placement datum**. `sensor_mount` lies
2.2 mm above it, clear of the bevel. These frames permit a reproducible visual
assembly; they do not certify mating surfaces, hole alignment or screw length.
Start a visual assembly from G1's nominal sensor datums and seat the separate
sensor models on these plates. Any further adjustment needed by approximate
housing or head geometry must be declared by the consuming demo; it is not a
measured sensor calibration. Keep these assumptions distinct from verified
robot poses and the unverified plate dimensions.

Models are Z-up, metres, with separate visuals and analytic collisions in
`usd/camera-fixed-plate.usda` and `usd/radar-fixed-plate.usda`. Generated with
Node.js, Three.js and three-usd-robot using the shared authoring package.

```sh
cd unitree-g1-fixed-plates/authoring
npm ci
npm run export
npm test
npm run view
```

Open `viewer.html?camera` or `viewer.html?radar` on the local server. Construction
values and their evidence status are in `authoring/provenance.json`.
