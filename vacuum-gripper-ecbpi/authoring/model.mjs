/** ECBPi 10.03.01.00314, photo-informed r2 candidate; no manufacturer CAD.
 * Construction mm -> returned visual in metres. See provenance.json for limits.
 * The four-cup holder remains independently designed, NOT a Schmalz VEE assembly.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const DIM = Object.freeze({ diameter: 151.5, bossDiameter: 76, pumpHeight: 88.6,
  mountBCD: 46, mountHoles: 4, mountDepth: 6, pumpMass: 0.775, holderMass: 0.250,
  plateRadius: 55, plateBottom: 88.6, plateTop: 96, cupRadius: 20, cupPCD: 66, tcpZ: 118 });
export const MOUNT_HOLES = Array.from({ length: 4 }, (_, i) =>
  [23 * Math.cos(i * Math.PI / 2), 23 * Math.sin(i * Math.PI / 2)]);
export const CUP_CENTERS = Array.from({ length: 4 }, (_, i) => {
  const a = Math.PI / 4 + i * Math.PI / 2; return [33 * Math.cos(a), 33 * Math.sin(a)];
});
const finish = (name, color, metalness, roughness) => Object.assign(
  new THREE.MeshStandardMaterial({ color, metalness, roughness }), { name });
export const MATERIALS = {
  white: finish("off_white_polymer", 0xe2e4dc, 0.0, 0.4),
  blue: finish("blue_corner_cover", 0x145ba0, 0.0, 0.4),
  aluminum: finish("holder_aluminum", 0xbcc2c4, 0.8, 0.3),
  rubber: finish("cup_elastomer", 0x24272a, 0.0, 0.76),
  screen: finish("lcd_window", 0x6b8890, 0.0, 0.2),
  black: finish("connector_insulator", 0x161c22, 0.0, 0.58),
  brass: finish("brass_fittings", 0xba9d63, 0.75, 0.26),
  green: finish("status_indicator", 0x8cac65, 0.0, 0.3),
};
function add(g, name, geo, material, xyz = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, MATERIALS[material]); m.name = name;
  m.position.set(...xyz); g.add(m); return m;
}
function box(g, name, size, at, material, r = 1) {
  return add(g, name, new RoundedBoxGeometry(...size, 3, r), material, at);
}
function cylinder(g, name, radius, height, at, mat = "aluminum", open = false) {
  const geo = new THREE.CylinderGeometry(radius, radius, height, 64, 1, open);
  geo.rotateX(Math.PI / 2); return add(g, name, geo, mat, at);
}
function ring(g, name, outer, inner, z0, z1, material, holes = []) {
  const shape = new THREE.Shape(); shape.absarc(0, 0, outer, 0, 2 * Math.PI, false);
  if (inner) { const h = new THREE.Path(); h.absarc(0, 0, inner, 0, 2 * Math.PI, true); shape.holes.push(h); }
  for (const [x, y, r] of holes) {
    const h = new THREE.Path(); h.absarc(x, y, r, 0, 2 * Math.PI, true); shape.holes.push(h);
  }
  return add(g, name, new THREE.ExtrudeGeometry(shape,
    { depth: z1 - z0, bevelEnabled: false, curveSegments: 32 }), material, [0, 0, z0]);
}
function radius(a, max) { return max - 9 + 9 * Math.cos(3 * (a - Math.PI / 2)); }
function trilobe(max) {
  const points = Array.from({ length: 144 }, (_, i) => {
    const a = i / 144 * 2 * Math.PI, r = radius(a, max); return new THREE.Vector2(r * Math.cos(a), r * Math.sin(a));
  }); return new THREE.Shape(points);
}
function shellGeometry() {
  const stations = [[6, 69], [9, 72], [14, 74.5], [19, 75.75], [60, 75.75], [67, 74], [73, 68], [76, 58]];
  const vertices = [], colors = [], indices = [], n = 144;
  for (const [z, max] of stations) for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2, r = radius(a, max);
    vertices.push(r * Math.cos(a), r * Math.sin(a), z);
  }
  // Separate color sectors in a single geometry, exported with material subsets.
  const geo = new THREE.BufferGeometry();
  for (let k = 0; k < stations.length - 1; k++) for (let i = 0; i < n; i++) {
    const j = k * (n + 1) + i, offset = indices.length;
    indices.push(j, j + 1, j + n + 2, j, j + n + 2, j + n + 1);
    const a = (i + 0.5) / n * Math.PI * 2;
    colors.push({ offset, blue: Math.cos(3 * (a - Math.PI / 2)) > 0.25 });
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3)); geo.setIndex(indices);
  for (const { offset, blue } of colors) geo.addGroup(offset, 6, blue ? 1 : 0);
  geo.computeVertexNormals();
  return geo;
}

export function buildVisuals() {
  const body = new THREE.Group(); body.name = "body";
  const pump = new THREE.Group(); pump.name = "pump"; body.add(pump);
  // Actual four M4 bores in the robot-side face. Thread helices and tolerances omitted.
  const mount = trilobe(69);
  for (const [x, y] of MOUNT_HOLES) {
    const hole = new THREE.Path(); hole.absarc(x, y, 2, 0, Math.PI * 2, true); mount.holes.push(hole);
  }
  add(pump, "mount_face_four_M4", new THREE.ExtrudeGeometry(mount,
    { depth: 6, bevelEnabled: false, curveSegments: 24 }), "white");
  add(pump, "blind_bore_back", new THREE.ExtrudeGeometry(trilobe(69),
    { depth: 0.5, bevelEnabled: false }), "white", [0, 0, 6]);
  const shell = new THREE.Mesh(shellGeometry(), [MATERIALS.white, MATERIALS.blue]);
  shell.name = "trilobe_shell"; pump.add(shell);
  add(pump, "top_shoulder", new THREE.ExtrudeGeometry(trilobe(58),
    { depth: 0.7, bevelEnabled: false }), "white", [0, 0, 75.3]);
  // D2=76 is the end-effector-side bayonet boss, not the robot mounting face.
  ring(pump, "bayonet_socket", 38, 31, 76, 88.6, "white");
  cylinder(pump, "vacuum_port", 5, 1, [0, 0, 76.3], "black");
  for (let i = 0; i < 3; i++) {
    const a = i * 2 * Math.PI / 3;
    cylinder(pump, `bayonet_lug_${i}`, 2, 6, [30 * Math.cos(a), 30 * Math.sin(a), 82], "white");
  }
  box(pump, "control_panel", [49, 1.4, 33], [0, -57.5, 40], "white", 0.6);
  box(pump, "control_panel_blue", [25, 0.8, 29], [-1, -58.55, 40], "blue", 0.3);
  box(pump, "lcd", [20, 0.5, 8], [-1, -59.2, 47], "screen", 0.2);
  for (const [x, z, mat] of [[18, 47, "blue"], [18, 36, "blue"], [-19, 29, "blue"], [-19, 51, "green"]]) {
    const b = cylinder(pump, `button_${x}_${z}`, x === -19 && z === 51 ? 1 : 3.2, 0.8, [0, 0, 0], mat);
    b.rotation.x = Math.PI / 2; b.position.set(x, -59, z);
  }
  const conn = cylinder(pump, "m12_connector", 6, 7, [0, 0, 0], "aluminum", true);
  conn.rotation.x = Math.PI / 2; conn.position.set(0, 72, 39);
  const cap = cylinder(pump, "m12_contact_insert", 4.8, 0.8, [0, 0, 0], "black");
  cap.rotation.x = Math.PI / 2; cap.position.set(0, 74.8, 39);
  // Authored fixture retained to keep the legacy four-cup task/TCP convention.
  // It is deliberately not sold/labelled as a Schmalz VEE accessory.
  ring(body, "authored_holder_plate", 55, 5, 88.6, 96, "aluminum");
  const profile = [[5, 96], [7, 96], [7, 99], [15, 100], [19, 103], [14, 106],
    [19, 109], [16, 112], [20, 116.8], [20, 118], [18.5, 118], [17.8, 116.5],
    [13.5, 113], [16.5, 109], [11.5, 106], [16.5, 103], [6, 101], [5, 101], [5, 96]];
  for (let i = 0; i < CUP_CENTERS.length; i++) {
    const [x, y] = CUP_CENTERS[i];
    const cup = new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), 72);
    cup.rotateX(Math.PI / 2); add(body, `hollow_bellows_cup_${i}`, cup, "rubber", [x, y, 0]);
    ring(body, `cup_fitting_${i}`, 7, 5, 95.5, 99, "brass").position.set(x, y, 95.5);
  }
  body.scale.setScalar(0.001); body.updateMatrixWorld(true); return body;
}

export function definition() {
  const collisions = [
    { kind: "cylinder", name: "core", radius: 0.048, length: 0.076, at: [0, 0, 0.038] },
    { kind: "cylinder", name: "bayonet", radius: 0.038, length: 0.0126, at: [0, 0, 0.0823] },
    { kind: "cylinder", name: "holder", radius: 0.055, length: 0.0074, at: [0, 0, 0.0923] },
  ];
  for (let i = 0; i < 3; i++) {
    const a = Math.PI / 2 + i * Math.PI * 2 / 3;
    collisions.push({ kind: "cylinder", name: `lobe_${i}`, radius: 0.028, length: 0.076,
      at: [0.04775 * Math.cos(a), 0.04775 * Math.sin(a), 0.038] });
  }
  for (let i = 0; i < CUP_CENTERS.length; i++) {
    const [x, y] = CUP_CENTERS[i];
    collisions.push({ kind: "cylinder", name: `cup_${i}`, radius: 0.020, length: 0.022,
      at: [x / 1000, y / 1000, 0.107] });
  }
  return { name: "vacuum_gripper_ecbpi", slug: "vacuum-gripper-ecbpi", body: buildVisuals(),
    frames: { tcp: [0, 0, 0.118] },
    inertial: { mass: DIM.pumpMass + DIM.holderMass, centerOfMass: [0, 0, 0.048],
      diagonalInertia: [1.96e-3 * 1.025, 1.96e-3 * 1.025, 1.51e-3 * 1.025] }, collisions };
}
