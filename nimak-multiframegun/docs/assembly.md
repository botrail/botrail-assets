# BX-NIMAK-HW-A

Project engineering declaration for the Kawasaki BX250L-B001 standard GUN BRACKET 160 and NIMAK 95.020.516/P3U. This establishes a nominal direct mounting configuration for simulation, not a manufacturer kit or final shop-floor approval.

Both supplied coupling/flange parts remain in the model. Ten original 20 mm CAD screws are replaced by separately purchased **MISUMI CB10-25**, M10×1.5, JIS B 1176, SCM435 property class 12.9. Each has a nominal 1 mm washer. Head diameter/height are 16/10 mm. The nominal clearance plate is 7 mm thick, so 25−7−1 = **17 mm insertion**, within Kawasaki's specified 13–18 mm. The host has a nominal 13 mm through-threaded wall: insertion does not mean 17 mm of engaged thread.

The mounting frame is at the contact face, +Z into the gun. Host and tool use the same XY pattern, zero translation/rotation assembly, and opposite surface normals. Ten hole centers in millimetres are:

| Hole | X | Y |
| --- | ---: | ---: |
| h1 | −69.282032 | −40 |
| h2 | −69.282032 | 40 |
| h3 | −40 | −69.282032 |
| h4 | −40 | 69.282032 |
| h5 | 0 | −80 |
| h6 | 0 | 80 |
| h7 | 40 | −69.282032 |
| h8 | 40 | 69.282032 |
| h9 | 69.282032 | −40 |
| h10 | 69.282032 | 40 |

The locating boss/recess is Ø100 nominal; one Ø10 pin is at (−80,0), and the host has another unused pin hole at (+80,0). The source CAD duplicated a washer at h6 and omitted h4; this configured reference places exactly one washer on each axis as an engineering correction.

Sources:

- [Kawasaki drawing 90151-0028DED, sheet 3](https://kawasakirobotics.com/uploads/sites/2/2022/01/BX250L-B_E-E.pdf): GUN BRACKET 160, 10×M10, Ø100 H7 recess, two Ø10 H7 locating holes.
- [Kawasaki installation manual, 90202-1120DEL §8.3, printed p60](https://kawasakirobotics.com/uploads/sites/2/2022/01/B_Series-Installation_and_Connection_Manual-E-2.pdf): BX250L/300L ten M10 bolts, insertion 13–18 mm, torque 56.84 N·m.
- [MISUMI CB specification, printed pp1099–1100](https://jp.misumi-ec.com/pdf/mold/2022/22_mo1099.pdf): CB10-25 nominal dimensions, class and pitch.
- [NIMAK source and reference geometry](../README.md): nominal support planes, clearance axes and hardware arrangement.

Receiver thread pitch is not established by the Kawasaki drawing alone. Grip tolerances, boss/pin fit tolerances on the gun, thread engagement bounds, preload and tool mass/inertia remain unknown. Nominal measurements are not zero-width manufacturing tolerances. Detailed-fit status therefore stays incomplete even though the declared interface, pose, parts and bolt-length range allow mounting in simulation.
