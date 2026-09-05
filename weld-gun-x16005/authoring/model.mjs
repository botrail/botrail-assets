/** X16005 r4 candidate. Dimensions are metres, Z-up; see provenance.json.
 * Only the envelope and named specifications are manufacturer measurements.
 * Component positions, holes and finishes are a photo-informed reconstruction.
 */
import * as THREE from "three";
import { namedMaterial as material, addMesh, roundedBox, cylinderBetween,
  ellipseHole, tubeGeometry } from "@botrail/authoring/geometry.mjs";
import { RobotBuilder } from "three-usd-robot";

export const DIM = Object.freeze({
  length: 1.161, height: 0.532, width: 0.302,
  pivot: [0.115, 0, 0.335], tip: [0.537, 0, 0.360], movingTip: [0.537, 0, 0.365],
  throatFront: 0.153, throatDepth: 0.384, throatGap: 0.160,
  lowerArmZ: 0.272, upperArmZ: 0.464, conductorRadius: 0.016,
  rear: -0.608, qOpen: 0.446, qSpeed: 1.2, bodyMass: 78.5, armMass: 17,
});
const V = (p) => new THREE.Vector3(...p);
export const MATERIALS = {
  aluminum: material("aluminum_frame", 0xc9ced1, 0.72, 0.32),
  copper: material("copper_conductor", 0xb77743, 0.88, 0.28),
  brass: material("terminal_brass", 0xbda15b, 0.78, 0.30),
  steel: material("machined_steel", 0x737a80, 0.80, 0.26),
  motor: material("servo_housing", 0x232930, 0.30, 0.48),
  blue: material("transformer_cover", 0x246893, 0.22, 0.43),
  rubber: material("cable_jacket", 0x181b1f, 0.0, 0.82),
  water: material("coolant_hose", 0xe3c347, 0.0, 0.57),
  red: material("connector_cap", 0xa6382e, 0.0, 0.55),
};

function add(group, name, geometry, finish, center = [0, 0, 0], massGroup = "frame") {
  return addMesh(group, name, geometry, MATERIALS[finish], center, massGroup);
}
function box(group, name, size, center, finish = "aluminum", radius = 0.002, massGroup) {
  return add(group, name, roundedBox(size, radius, 2), finish, center, massGroup);
}
function cylinder(group, name, a, b, radius, finish = "steel", radial = 32, massGroup = "frame") {
  return cylinderBetween(group, name, a, b, radius, MATERIALS[finish], { radial, massGroup });
}
function plate(group, name, outline, holes, y, thickness, finish = "aluminum") {
  const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, z)));
  for (const [x, z, rx, rz = rx] of holes) {
    ellipseHole(shape, x, z, rx, rz);
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness - 0.003, bevelEnabled: true, bevelThickness: 0.0015,
    bevelSize: 0.0015, bevelSegments: 2, steps: 1, curveSegments: 20,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, y + (thickness - 0.003) / 2, 0);
  return add(group, name, geometry, finish);
}
function tube(group, name, points, radius, finish = "water", massGroup = "services") {
  return add(group, name, tubeGeometry(points, radius), finish,
    [0, 0, 0], massGroup);
}
function conductor(group, name, z, upward) {
  const r = 0.035;
  const endZ = upward ? 0.332 : 0.405;
  const bendEnd = z + (upward ? r : -r);
  const path = new THREE.CurvePath();
  path.add(new THREE.LineCurve3(V([0.169, 0, z]), V([0.537 - r, 0, z])));
  path.add(new THREE.QuadraticBezierCurve3(
    V([0.537 - r, 0, z]), V([0.537, 0, z]), V([0.537, 0, bendEnd])));
  path.add(new THREE.LineCurve3(V([0.537, 0, bendEnd]), V([0.537, 0, endZ])));
  return add(group, name, new THREE.TubeGeometry(path, 72, DIM.conductorRadius, 24, false), "copper");
}
function electrode(group, name, tip, sign) {
  // Inherited F-style 16 x 20 mm cap envelope. No unverified internal taper is claimed.
  const points = [];
  for (let i = 0; i <= 10; i++) {
    const r = 0.008 * i / 10;
    points.push(new THREE.Vector2(r, 0.04 - Math.sqrt(0.04 ** 2 - r ** 2)));
  }
  points.push(new THREE.Vector2(0.008, 0.020), new THREE.Vector2(0, 0.020));
  const cap = new THREE.LatheGeometry(points, 40);
  cap.rotateX(sign * Math.PI / 2);
  add(group, `${name}_cap`, cap, "copper", tip);
  const start = [tip[0], 0, tip[2] + sign * 0.020];
  const end = [tip[0], 0, tip[2] + sign * 0.041];
  cylinder(group, `${name}_holder`, start, end, 0.013, "copper");
  cylinder(group, `${name}_water_fitting`, [tip[0], 0.009, end[2]],
    [tip[0] - 0.016, 0.032, end[2]], 0.005, "brass", 16, "services");
}

/** Individual named components; one moving link, no per-bolt kinematic links. */
export function buildVisuals() {
  const body = new THREE.Group(); body.name = "body";
  const arm = new THREE.Group(); arm.name = "electrode_arm";
  // The legacy bottom attachment frame is retained, not claimed as a HERON flange.
  cylinder(body, "legacy_mount_proxy", [0, 0, 0], [0, 0, 0.016], 0.085,
    "steel", 48, "mount");
  box(body, "mount_riser", [0.148, 0.132, 0.065], [0, 0, 0.047], "aluminum", 0.004, "mount");
  const frame = [
    [-0.101, 0.083], [0.076, 0.083], [0.1515, 0.147], [0.1515, 0.482],
    [0.086, 0.5305], [-0.066, 0.5305], [-0.138, 0.451], [-0.145, 0.183],
  ];
  for (const sign of [-1, 1]) {
    plate(body, `frame_cheek_${sign < 0 ? "left" : "right"}`, frame,
      [[0.002, 0.176, 0.062, 0.043], [0.012, 0.443, 0.049, 0.043]], sign * 0.071, 0.026);
    // Rear fork and its elongated machined opening are prominent in the source photograph.
    plate(body, `rear_fork_${sign}`, [
      [DIM.rear + 0.0015, 0.226], [-0.14, 0.226], [-0.09, 0.287],
      [-0.11, 0.370], [-0.49, 0.370], [DIM.rear + 0.0015, 0.326],
    ], [[-0.348, 0.300, 0.146, 0.026]], sign * 0.088, 0.022);
    for (const [x, z] of [[-0.080, 0.120], [0.080, 0.120], [-0.096, 0.385],
      [0.095, 0.491], [-0.055, 0.500], [-0.107, 0.248]]) {
      cylinder(body, `frame_bolt_${sign}_${x}_${z}`.replaceAll(".", "_"),
        [x, sign * 0.086, z], [x, sign * 0.091, z], 0.008, "steel", 6);
    }
  }
  // Wide, low-profile MFDC transformer, rather than the old deep grey block.
  box(body, "transformer_core", [0.252, 0.288, 0.124], [-0.292, 0, 0.425],
    "aluminum", 0.004, "transformer");
  for (const sign of [-1, 1]) {
    box(body, `transformer_cover_${sign}`, [0.235, 0.007, 0.106],
      [-0.292, sign * 0.1475, 0.425], "blue", 0.001, "transformer");
    for (let i = 0; i < 5; i++) {
      box(body, `transformer_rib_${sign}_${i}`, [0.224, 0.003, 0.004],
        [-0.292, sign * 0.144, 0.39 + i * 0.018], "aluminum", 0.0007, "transformer");
    }
  }
  box(body, "transformer_terminal", [0.036, 0.086, 0.048], [-0.148, 0, 0.415],
    "brass", 0.002, "transformer");
  // Motor at the lower rear, matching the model-specific photograph.
  box(body, "servo_motor", [0.187, 0.098, 0.105], [-0.414, 0, 0.122], "motor", 0.008, "drive");
  box(body, "servo_front_cap", [0.035, 0.106, 0.112], [-0.303, 0, 0.122],
    "aluminum", 0.003, "drive");
  cylinder(body, "servo_encoder", [-0.508, 0, 0.122], [-0.539, 0, 0.122],
    0.039, "motor", 32, "drive");
  cylinder(body, "encoder_end", [-0.539, 0, 0.122], [-0.546, 0, 0.122],
    0.031, "red", 32, "drive");
  cylinder(body, "actuator_barrel", [-0.285, 0, 0.122], [-0.197, 0, 0.122],
    0.027, "aluminum", 32, "drive");
  cylinder(body, "actuator_rod_rest_pose", [-0.197, 0, 0.122], [-0.125, 0, 0.122],
    0.012, "steel", 24, "drive");
  // Main pivot fits through the gap between fixed cheeks and moving plate.
  cylinder(body, "pivot_pin", [0.115, -0.099, 0.335], [0.115, 0.099, 0.335], 0.026);
  for (const sign of [-1, 1]) {
    cylinder(body, `pivot_retainer_${sign}`, [0.115, sign * 0.090, 0.335],
      [0.115, sign * 0.103, 0.335], 0.038, "steel", 40);
  }
  plate(arm, "moving_aluminum_lever", [
    [-0.123, 0.094], [-0.027, 0.068], [0.090, 0.095], [0.1515, 0.165],
    [0.1515, 0.348], [0.212, 0.457], [0.185, 0.497], [0.103, 0.483],
    [0.061, 0.390], [-0.037, 0.246], [-0.123, 0.166],
  ], [[0.011, 0.175, 0.055, 0.037], [0.127, 0.435, 0.024, 0.028]], 0, 0.052);
  cylinder(arm, "moving_pivot_boss", [0.115, -0.030, 0.335], [0.115, 0.030, 0.335],
    0.040, "aluminum", 40);
  for (const [group, prefix, z] of [[body, "fixed", DIM.lowerArmZ], [arm, "moving", DIM.upperArmZ]]) {
    box(group, `${prefix}_conductor_clamp`, [0.080, 0.078, 0.057], [0.194, 0, z], "brass");
    for (const x of [0.173, 0.215]) for (const y of [-0.024, 0.024]) {
      cylinder(group, `${prefix}_clamp_bolt_${x}_${y}`.replaceAll(".", "_"),
        [x, y, z + 0.028], [x, y, z + 0.034], 0.006, "steel", 6);
    }
  }
  conductor(body, "fixed_copper_arm", DIM.lowerArmZ, true);
  conductor(arm, "moving_copper_arm", DIM.upperArmZ, false);
  electrode(body, "fixed_electrode", DIM.tip, -1);
  electrode(arm, "moving_electrode", DIM.movingTip, 1);
  // Flexible services are visualization only; no collision volume crosses the throat.
  for (const sign of [-1, 1]) {
    tube(body, `fixed_coolant_${sign}`, [[-0.3, sign * 0.06, 0.494], [-0.19, sign * 0.055, 0.515],
      [-0.105, sign * 0.050, 0.397], [0.0, sign * 0.051, 0.284], [0.3, sign * 0.035, 0.252],
      [0.510, sign * 0.032, 0.317]], 0.004, "water");
    tube(arm, `moving_coolant_${sign}`, [[0.03, sign * 0.036, 0.37], [0.13, sign * 0.036, 0.471],
      [0.34, sign * 0.029, 0.481], [0.514, sign * 0.032, 0.414]], 0.004, "water");
  }
  tube(body, "power_cable", [[-0.513, -0.025, 0.13], [-0.558, -0.068, 0.171],
    [-0.494, -0.123, 0.228], [-0.405, -0.112, 0.423]], 0.010, "rubber");
  tube(body, "secondary_shunt", [[-0.148, 0.027, 0.412], [-0.091, 0.048, 0.365],
    [0.035, 0.047, 0.274], [0.164, 0.035, 0.273]], 0.011, "copper");
  body.updateMatrixWorld(true); arm.updateMatrixWorld(true);
  return { body, arm };
}

/** Primitive collision proxies are authored separately, never convexified as one gun. */
export function collisions() {
  const result = [];
  const box = (link, name, size, center) => result.push({ link, name, kind: "box", size, center });
  const cyl = (link, name, a, b, radius) => result.push({ link, name, kind: "cylinder", a, b, radius });
  box("body", "mount", [0.148, 0.132, 0.078], [0, 0, 0.039]);
  for (const sign of [-1, 1]) {
    box("body", `frame_${sign}`, [0.26, 0.025, 0.425], [0.012, sign * 0.072, 0.31]);
    box("body", `rear_fork_${sign}`, [0.515, 0.022, 0.12], [-0.35, sign * 0.088, 0.295]);
  }
  box("body", "transformer", [0.252, 0.302, 0.124], [-0.292, 0, 0.425]);
  box("body", "servo", [0.35, 0.106, 0.112], [-0.372, 0, 0.122]);
  cyl("body", "pivot_retainer_envelope", [0.115, -0.080, 0.335], [0.115, 0.080, 0.335], 0.038);
  cyl("body", "fixed_arm", [0.15, 0, DIM.lowerArmZ], [0.511, 0, DIM.lowerArmZ], 0.017);
  cyl("body", "fixed_bend", [0.51, 0, 0.273], [0.537, 0, 0.306], 0.017);
  cyl("body", "fixed_holder", [0.537, 0, 0.302], [0.537, 0, 0.340], 0.016);
  cyl("body", "fixed_cap", [0.537, 0, 0.340], DIM.tip, 0.008);
  // Root/tail is inside the pin joint; omit its intentional bearing contact.
  cyl("electrode_arm", "moving_lever", [0.164, 0, 0.397], [0.180, 0, 0.460], 0.028);
  cyl("electrode_arm", "moving_arm", [0.185, 0, DIM.upperArmZ], [0.511, 0, DIM.upperArmZ], 0.017);
  cyl("electrode_arm", "moving_bend", [0.51, 0, 0.463], [0.537, 0, 0.430], 0.017);
  cyl("electrode_arm", "moving_holder", [0.537, 0, 0.430], [0.537, 0, 0.385], 0.016);
  cyl("electrode_arm", "moving_cap", DIM.movingTip, [0.537, 0, 0.385], 0.008);
  return result;
}

/** Grouped box approximations, not measured inertia. Off-diagonal terms are omitted. */
export function approximateInertial(group, masses, origin = [0, 0, 0]) {
  const rows = group.children.map((mesh) => {
    const bounds = new THREE.Box3().setFromObject(mesh);
    const size = bounds.getSize(new THREE.Vector3());
    return { key: mesh.userData.massGroup, size, center: bounds.getCenter(new THREE.Vector3()),
      volume: size.x * size.y * size.z };
  });
  const volumes = {};
  for (const r of rows) volumes[r.key] = (volumes[r.key] ?? 0) + r.volume;
  const com = new THREE.Vector3();
  let mass = 0;
  for (const r of rows) {
    r.mass = masses[r.key] * r.volume / volumes[r.key];
    if (!Number.isFinite(r.mass)) throw new Error(`unassigned mass group: ${r.key}`);
    mass += r.mass; com.addScaledVector(r.center, r.mass);
  }
  com.divideScalar(mass);
  const diagonal = [0, 0, 0];
  for (const r of rows) {
    const d = r.center.clone().sub(com).toArray(), s = r.size.toArray();
    for (let k = 0; k < 3; k++) {
      const i = (k + 1) % 3, j = (k + 2) % 3;
      diagonal[k] += r.mass * ((s[i] ** 2 + s[j] ** 2) / 12 + d[i] ** 2 + d[j] ** 2);
    }
  }
  return { mass, centerOfMass: com.sub(V(origin)).toArray(), diagonalInertia: diagonal };
}

export function createRobot() {
  const visuals = buildVisuals();
  const bodyInertial = approximateInertial(visuals.body,
    { frame: 25, transformer: 36, drive: 10, mount: 5, services: 2.5 });
  const armInertial = approximateInertial(visuals.arm, { frame: 16, services: 1 }, DIM.pivot);
  const builder = new RobotBuilder({ name: "weld_gun_x16005" });
  builder.addLink({ name: "mount" });
  builder.addLink({ name: "body", visuals: [visuals.body], inertial: bodyInertial });
  builder.addLink({ name: "electrode_arm", frame: new THREE.Matrix4().makeTranslation(...DIM.pivot),
    visuals: [visuals.arm], inertial: armInertial });
  builder.addLink({ name: "tcp", frame: new THREE.Matrix4().makeTranslation(...DIM.tip) });
  builder.addFixedJoint({ name: "root_joint", child: "mount" });
  builder.addFixedJoint({ name: "body_joint", parent: "mount", child: "body" });
  const jointFrame = new THREE.Matrix4().makeRotationX(Math.PI).setPosition(V(DIM.pivot));
  builder.addRevoluteJoint({ name: "electrode_joint", parent: "body", child: "electrode_arm",
    frame: jointFrame, axis: "Y", lower: 0, upper: DIM.qOpen,
    drive: { maxForce: 1650 } });
  builder.addFixedJoint({ name: "tcp_joint", parent: "body", child: "tcp" });
  return { builder, ...visuals, inertial: { body: bodyInertial, electrode_arm: armInertial } };
}
