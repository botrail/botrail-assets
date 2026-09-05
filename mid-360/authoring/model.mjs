/** Livox Mid-360 r2 candidate. Independently authored, not vendor CAD.
 * All construction dimensions below are mm; the returned group is metres, Z-up.
 * Public dimensions vs photo-inferred details: see provenance.json.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const DIM = Object.freeze({ width: 65, height: 60, baseHeight: 39.5,
  connectorReach: 40.5, connectorZ: 16, lidarZ: 47, mass: 0.265,
  mountPitch: [48, 36], mountDepth: 5, locatingPitch: 39, locatingDepth: 1.8 });
const finish = (name, color, metalness, roughness) => Object.assign(
  new THREE.MeshStandardMaterial({ color, metalness, roughness }), { name });
export const MATERIALS = {
  shell: finish("anodized_graphite", 0x42484b, 0.65, 0.35),
  rim: finish("machined_aluminum", 0x91999b, 0.85, 0.27),
  window: finish("dark_optical_window", 0x111820, 0.0, 0.13),
  rubber: finish("connector_insulator", 0x181c21, 0.0, 0.75),
  gold: finish("connector_contacts", 0xbaa268, 0.75, 0.25),
};
export const MOUNT_HOLES = [-24, 24].flatMap(x => [-18, 18].map(y => [x, y]));
// x/y below are expressed in the existing catalog frame: connector = -X.
export const LOCATING_HOLES = [[0, -19.5], [0, 19.5]];

function roundedShape(width, depth, radius) {
  const x = -width / 2, y = -depth / 2, s = new THREE.Shape();
  s.moveTo(x + radius, y); s.lineTo(x + width - radius, y);
  s.quadraticCurveTo(x + width, y, x + width, y + radius);
  s.lineTo(x + width, y + depth - radius);
  s.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth);
  s.lineTo(x + radius, y + depth); s.quadraticCurveTo(x, y + depth, x, y + depth - radius);
  s.lineTo(x, y + radius); s.quadraticCurveTo(x, y, x + radius, y);
  return s;
}
function add(group, name, geometry, material, xyz = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, MATERIALS[material]);
  mesh.name = name; mesh.position.set(...xyz); group.add(mesh); return mesh;
}
function box(g, name, size, at, mat = "shell", r = 0.5) {
  return add(g, name, new RoundedBoxGeometry(...size, 3, r), mat, at);
}
function cylinder(g, name, radius, height, at, mat = "rim", open = false) {
  const geo = new THREE.CylinderGeometry(radius, radius, height, 64, 1, open);
  geo.rotateX(Math.PI / 2); return add(g, name, geo, mat, at);
}

export function buildVisuals() {
  const body = new THREE.Group(); body.name = "body";
  // Layered bottom with genuine blind bores, not discs painted onto a closed box.
  // The second locating hole is a 3 mm-wide slot; its un-dimensioned length is inferred.
  for (const [name, z0, z1, withLocators] of [
    ["mount_plate", 0, DIM.locatingDepth, true], ["mount_thread_depth", DIM.locatingDepth, 5, false],
  ]) {
    const shape = roundedShape(65, 65, 4.5);
    for (const [x, y] of MOUNT_HOLES) {
      const hole = new THREE.Path(); hole.absarc(x, y, 1.5, 0, 2 * Math.PI, true);
      shape.holes.push(hole);
    }
    if (withLocators) for (let i = 0; i < LOCATING_HOLES.length; i++) {
      const [x, y] = LOCATING_HOLES[i], h = new THREE.Path();
      h.absellipse(x, y, 1.5, i ? 2.2 : 1.5, 0, 2 * Math.PI, true); shape.holes.push(h);
    }
    const geo = new THREE.ExtrudeGeometry(shape,
      { depth: z1 - z0, bevelEnabled: false, curveSegments: 24 });
    add(body, name, geo, "shell", [0, 0, z0]);
  }
  box(body, "base_upper", [65, 65, 2], [0, 0, 6], "shell", 0.6);
  box(body, "heatsink_core", [57, 53, 28], [0, 0, 21], "shell", 3);
  // Rounded vertical ribs stay inside the published 65 mm body envelope.
  for (const side of [-1, 1]) for (let i = 0; i < 11; i++) {
    box(body, `cooling_fin_${side}_${i}`, [2.6, 6, 27], [-25 + 5 * i, side * 29.5, 20.5], "shell", 1.1);
  }
  box(body, "front_label_face", [4, 53, 26], [30.5, 0, 20], "shell", 1.8);
  box(body, "rear_connector_face", [4, 53, 26], [-30.5, 0, 20], "shell", 1.8);
  box(body, "upper_shoulder", [61, 61, 7], [0, 0, 35.5], "shell", 3);
  cylinder(body, "window_seat", 27.6, 1, [0, 0, 39], "rim");
  cylinder(body, "window_gasket", 26.5, 0.8, [0, 0, 39.5], "rubber");
  // Smooth photo-informed dome, with its height fixed by the public envelope.
  const profile = [new THREE.Vector2(0, 39.5), new THREE.Vector2(25.6, 39.5)];
  for (let i = 0; i <= 32; i++) {
    const a = i / 32 * Math.PI / 2;
    profile.push(new THREE.Vector2(25.6 * Math.cos(a), 40.2 + 19.8 * Math.sin(a)));
  }
  const dome = new THREE.LatheGeometry(profile, 96); dome.rotateX(Math.PI / 2);
  add(body, "optical_dome", dome, "window");
  // Recessed 12-contact M12 appearance; pin locations are illustrative, not a pinout.
  const socket = cylinder(body, "m12_socket", 7, 8, [0, 0, 0], "rim", true);
  socket.rotation.y = -Math.PI / 2; socket.position.set(-36.5, 0, DIM.connectorZ);
  const inset = cylinder(body, "m12_insulator", 5.8, 0.6, [0, 0, 0], "rubber");
  inset.rotation.y = -Math.PI / 2; inset.position.set(-39.7, 0, DIM.connectorZ);
  for (let i = 0; i < 12; i++) {
    const a = 2 * Math.PI * i / 12;
    const pin = cylinder(body, `m12_pin_${i}`, 0.38, 0.5, [0, 0, 0], "gold");
    pin.rotation.y = -Math.PI / 2;
    pin.position.set(-40, 4.2 * Math.cos(a), DIM.connectorZ + 4.2 * Math.sin(a));
  }
  body.scale.setScalar(0.001); body.updateMatrixWorld(true);
  return body;
}

export function definition() {
  return { name: "mid_360", slug: "mid-360", body: buildVisuals(),
    frames: { livox_frame: [0, 0, 0.047] },
    inertial: { mass: DIM.mass, centerOfMass: [0, 0, 0.03],
      diagonalInertia: [1.73e-4, 1.73e-4, 1.87e-4] },
    collisions: [
      { kind: "box", name: "base", size: [0.065, 0.065, 0.0395], at: [0, 0, 0.01975] },
      { kind: "cylinder", name: "dome", radius: 0.0276, length: 0.0205, at: [0, 0, 0.04975] },
      { kind: "cylinder", name: "connector", radius: 0.007, length: 0.008,
        at: [-0.0365, 0, 0.016], axis: "X" },
    ] };
}
