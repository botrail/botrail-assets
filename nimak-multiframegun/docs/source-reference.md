# Visual evidence and independently authored geometry

## Sources reviewed

1. **Matching gun designation:** NIMAK 95.020.516, multiframeGUN X, identified by the [official configurator](https://www.nimak.com/en/weldinggunconfigurator/) and its [95.020.516 illustration](https://www.nimak.com/fileadmin/user_upload/zangen_images/95.020.516.png). This is the primary silhouette reference. The image matches the 95.020.516 designation, but a complete match of its coupling, drive and configuration options to the received P3U CAD has not been verified. P3U interface facts come from the received CAD measurements. The image was inspected, not imported into geometry or traced into a vector outline.
2. **Family appearance:** [NIMAK multiframeGUN product page](https://www.nimak.com/en/spotweldinggun/multiframegun/). The family photograph supports interpreting the structure as silver fabricated/machined beams, paired pierced plates and copper terminal parts. It is **not evidence that its arm shape, actuator, mount or proportions belong to this 95.020.516 configuration or establish its P3U coupling option**.
3. **Numeric reference:** the received `95.020.516.stp`, SHA256 `1ed279a1b42623fa618aedf65ea5bf3ef77123daf4f3ea724b82b716f8b9e73d`. Previously recorded numerical measurements set the coupling, contact and pivot frames. This revision reads neither STEP surfaces nor a tessellation. The CAD and vendor images are not redistributed in the asset.

## Rebuilt features

| Observation in exact official illustration | Independent authored representation | Limit |
| --- | --- | --- |
| Raked body plates with many circular bores and larger windows | Paired extruded XZ profiles, actual through-bores and rounded rectangular cuts | Profiles, bore coordinates/diameters and plate thickness are approximate; not a drill template |
| Tall drilled spine next to the central pivot | Separate fixed spine and paired moving fork | Only the pivot/drive-eye centers are measured; surface shape is authored |
| Long silver arms, broad at the root and tapering toward the terminal | Recessed, tapered extrusions with face reinforcement | Not an exact casting/extrusion or section-property model |
| Compact end blocks and narrow copper-colored electrode assemblies | Existing measured holder/tip cylinders and short terminal blocks | Adjacent block shape/material assignment is visual inference |
| Brown/orange transformer and supporting metalwork | Separate resin-like core, insulator panels, support rails and bracing | Palette/insulation geometry is inferred; not a conductor or circuit model |
| Visible cylinder/drive connecting the jaw fork to the body | Omitted from runtime; optional pose-derived inspection envelope | Actual barrel/motor shape and lengths are unknown; the pin relation alone is measured |

This is a silhouette-level correction, not a claim that visual similarity establishes engineering accuracy. The small face features and hidden supports remain illustrative. A source image cannot establish the exact depth, section, internal mechanism, hose routing, tolerances, mass or stiffness.

## Contract retained

The mounting mating plane is Z0. Support planes stay at Z19/Z42 mm. Ten mounting axes remain on PCD160 with Ø11 nominal visual clearance holes. The nominal Ø100 pilot, Ø10 locating pin, bolt shafts/washers, flange and closed contact geometry are unchanged. Pivot P=(−13.4, 0, 632) mm and contact T=(−13.4, 0, 1332) mm remain exact in the existing model frame.

The r5 visual generator intentionally does not call `link`, `joint` or `collision`. Its only writes to the model are named visual meshes and materials. The old nonvisual semantic SHA256 is preserved: `3c990677ccb742c4d3acb64d69cda33aada634d201a6b91daa35273d26a4cb6c`.

The existing collision proxies remain deliberately coarser than the new visuals and are not a visual-envelope guarantee. The jaw range and velocity remain author-selected simulation settings.

## Inspection-only drive illustration

`tools/pose_preview.py` computes B and C(q) from the measured relation in [opening.md](opening.md). `tools/render_reference.py --actuator-envelope` places an illustrative barrel, exposed rod, rear motor and pin envelopes between these endpoints for the selected angle. The rod extension and assembly orientation are recomputed at each pose. They are not stored in the simulation URDF or distributed mesh set.

The optional illustration’s tube radius, tube length, motor dimensions and eye shapes are authored, uncalibrated envelopes. It cannot certify actuator clearance, stroke zero, available retraction, maximum opening, force or control compatibility. Render object names begin `INSPECTION_ONLY_` to retain that distinction in the review scene.
