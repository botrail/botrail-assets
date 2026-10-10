# Toyota SAE160 visual refinement verification

Date: 2026-10-09. Base: `64904beb5cd983019aab3a7d6feed4562d75f5c4`.
This is a visual-only independently authored refinement for a new catalog rev.
No GitHub push, pull request, catalog upload or existing revision replacement was performed.

## Executed checks

- 20 Node model tests pass for TX Hi-Lo and DX Tele
- TX and DX complete URDF bytes match the base, including collision boxes,
  frames, joint hierarchy, axes, limits, velocities, mimic ratio, wheel stations
  and absence of invented inertias
- 72 combined lift/steer/wheel-spin poses include free-lift switching and endpoints
- 303 sampled free-lift and mast-lift configurations verify lower rail crossmembers,
  attachment ears and carriage members stay clear of fixed scanner/mast/body parts
  and other moving links. The lower-member positions are authored approximations
- Carriage stiles, upper tie, shanks, roller axles and brackets are connected;
  brackets enter the open inner-rail throats instead of passing through flanges
- Hollow visual forks clear the fixed support arms; wheel pockets are genuine
  through openings, and the load wheel is visible through both nested apertures
- Fixed low root yokes connect support arms, mast foot and body
- Every authored visual component has finite positions/normals, nonzero triangles,
  closed two-face edges and positive signed volume
- TX exports 146 closed components / 32,748 triangles; DX exports 141 / 31,792
- Independent Python standard-library audit checks exported OBJ face edges,
  directed winding and signed volume; it does not rely on the Three.js generator
- Lossless OBJ compaction preserves exact face-corner attributes and materials;
  raw and compact OBJ parse to the same Three.js attributes
- Repeated exports are deterministic and `npm run check` matches all 44 generated
  TX/DX OBJ/MTL/URDF files without writing
- 27 shared-authoring tests pass; no shared authoring code was changed
- Source ZIP is checked for byte equality, excluded vendor/dependency content,
  and a focused unpacked-package model test/export smoke run

## Render evidence

`before-after.png`, `detail-views.png` and `lift-poses.png` use Blender 4.3.2 to
load the actual exported OBJ/MTL and URDF. Comparison cameras, lighting, color
conversion and sample counts are identical between the original and refinement.
The pose renderer explicitly evaluates prismatic and revolute joints and mimic.

Browser UI was **not run** in the available environment. Static renders and Node
checks are not a claim of WebGL/browser interaction coverage.

## Mechanical limits

The package preserves the inherited simulation API and simplified contact geometry.
The original collision tiller proxy is not a precise enclosure of the new centered
visual tiller or wide HMI. Inertias, contact/load paths and sensor performance are
unidentified. Fork wall/deck thicknesses, support-arm visual section, rail profiles,
carriage roller supports and cover contours are visual estimates, not OEM drawings.

Unsupported inter-stage rollers, chains, hydraulic routing and transparent mast
guards are omitted rather than fixed incorrectly across articulating links.
The inherited caster longitudinal station, half-stage mimic and mapping of the
two scanner heights to TX/DX are explicitly documented approximations.

The public TX length figures differ by 1 mm when l2 and fork length are added.
Computed maximum fork surfaces differ from rounded printed heights by 0.5 mm.
No dimensions were altered to conceal those nominal rounding differences.

This is not a manufacturer-certified digital twin, installation drawing, load
certificate, contact solver validation or safety assessment.

## Collision revision (2026-10-10)

A follow-up change revised the collision boxes of TX and DX; joints, frames, limits, mimic and the
visual meshes are unchanged.

- Added: a box around the centred tiller and head (the inherited tiller box sat 180 mm off-centre near
  the mast, leaving the new tiller up to 284 mm outside), the console top, the HMI crossbar with its
  lights and stops (up to 279 mm outside before), its two stays as pitched boxes, the beacon, the foot
  pins and the top shrouds; the carriage plate, ties, stiles and shanks are one box from the plate back
  to the fork face, up to the shank tops (h4 - h23)
- Every visual vertex lies inside its link's boxes except the mast internals listed in the README
  (guide rollers, lower crossmembers, shroud front edges, foot/head plates, scanner-post foot) and the
  shank's 10 mm rounded front (new enclosure test with per-link limits)
- Overall length, width, height, h4 and the turning-radius corner computed from the boxes are unchanged
  (existing tests, now honouring box rotation)
- botrail joint sweep and 200 random poses on the built catalog package: no self-collision beyond the
  fork/support-arm pairs the catalog declares
- TX / DX URDF SHA-256 `838c42a2eed7…` / `bae48d9ba4d1…`; 22 model tests, `--check` and the OBJ audit pass

