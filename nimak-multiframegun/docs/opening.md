# Opening the 95.020.516 / P3U

`jaw_opening` is one revolute joint in radians. Zero is the received closed pose.
Positive rotation about mount +Y opens the **right** arm. The left electrode and
`cad_tip` stay fixed relative to the gun mount. `moving_tip` follows the right
electrode; each tip frame's +Z points out of its electrode. These are CAD contact
references, not calibrated welding TCPs. Mounting hardware is unchanged from r3.

| Quantity | Received STEP or manufacturer source | Model |
| --- | --- | --- |
| Swing pivot | `01.091.040.1/01.031.006.2`: cylindrical pin axis parallel Y, X−13.4/Z632 mm | `moving_jaw` origin (−13.4, 0, 632) mm, +Y rotation |
| Moving assembly | `01.066.002`, description `Schwinge`; right clamp and lever joined to this pivot | Right arm, holder, electrode and lever move together |
| Closed electrode tips | (−13.4, 0, 1332) mm | Radius 700 mm from pivot; zero gap |
| Actuator base pin B | `98.115.039.1/98.017.187.1`, X−191.9/Z274 mm, axis Y | Numeric linkage reference; actuator geometry omitted |
| Actuator eye pin C at closure | `01.066.002.1/01.031.055.1`, X254.1/Z384 mm, axis Y | Moving lever ends at this measured pin |
| Drive assembly | PRODUCT `98.116.006` / PRODUCT_DEFINITION `KUKA KRC4 20kN 160mm` | Source metadata, not a jaw opening limit |
| Internal spindle | PRODUCT `98.115.030` / PRODUCT_DEFINITION `20kN Hub162mm` | Source metadata; not 162 mm of electrode opening |
| Series drive | [NIMAK multiframeGUN](https://www.nimak.com/en/spotweldinggun/multiframegun/): 20 kN, 0–162 mm | Supports identification; does not specify this gun's stops |
| Transformer | PRODUCT `H3.53N.022-1`, `Transformator NMFT 130 kVA` | Fixed primitive envelope at measured Z327..520 mm |

STEP source: `95.020.516.stp`, SHA256
`1ed279a1b42623fa618aedf65ea5bf3ef77123daf4f3ea724b82b716f8b9e73d`.
The STEP occurrence names of spindle internals differ from their PRODUCT IDs.
`LRN 300-001-` is a gun designation; the transformer is not the drive.
No original CAD or tessellation is distributed.

## Position commands

For joint angle `q`, the separation of the two contact points projected onto the
fixed electrode axis is `opening_mm = 700 * sin(q)`. The moving tip also retreats
axially by `700 * (1 - cos(q))` mm. The electrodes do **not** remain parallel.
The Euclidean distance between contact points is `1400 * sin(q / 2)` mm, a
different quantity; projected opening is not a certified workpiece clearance.

```python
import math
q = math.asin(120 / 700)  # 120 mm projected opening, about 9.87 degrees
# Standalone gun loaded with Robot.from_catalog(.../r4):
scene.set_joint_positions([q])
```

The geometric drive length can be checked without a linear mimic approximation:

```python
P = (-13.4, 632.0)       # pivot, X/Z mm
B = (-191.9, 274.0)      # fixed drive base
C = (P[0] + 267.5 * math.cos(q) - 248 * math.sin(q),
     P[1] - 267.5 * math.sin(q) - 248 * math.cos(q))
retraction_mm = math.hypot(446, 110) - math.dist(B, C)
```

## Simulation settings and limits

This revision uses an **author-selected 0–20 degree simulation window**, giving
0–239.414 mm projected opening and 0–112.699 mm drive retraction from the CAD
pose. It does not claim the manufacturer's maximum jaw travel. The 160/162 mm
ratings describe total drive travel; available travel from the received closed
pose, stroke zero, stops and cap adjustment are not established. The URDF's
**0.2 rad/s** velocity is a simulation setting, not measured opening speed or a
cycle-time specification. Actuator effort, per-link inertia, squeeze force and
motor/controller configuration are omitted. The CAD mentions a KUKA KRC4 drive;
mechanical mounting on a Kawasaki arm does not establish control compatibility.
The configurator's 22 kN motor entry and the CAD's 20 kN drive description remain
separate source values; neither is asserted as weld squeeze force.

The fork and electrode motion are represented directly. Internal cylinder,
piston, gearbox and motor geometry are omitted: their orientation and extension
have a nonlinear relation to the jaw, so r3's illustrative static cylinder is
removed. This model cannot check clearance against these omitted parts or
flexible conductors/hoses. The simplified lever, transformer and arm shapes are
independently authored primitives. Collision follows the moving arm and keeps
the electrode throat open; it is not a full CAD interference test.
