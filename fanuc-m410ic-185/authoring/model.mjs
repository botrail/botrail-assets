/** CC0 authored shells for the FANUC M-410iC/185 (pedestal type base).
 * Numeric datasheet dimensions only; no imported CAD, meshes or drawings. */
import * as THREE from 'three';
import {addMesh, namedMaterial, roundedBox, cylinderZ, cylinderBetween, tubeGeometry}
  from '@botrail/authoring/geometry.mjs';

const deg = Math.PI / 180;

// FANUC M-410iC/185 data sheet and catalogue RM-410iC(E)-05, operating-space
// drawing (pedestal type base): J1-J2 offset 390, J2 height 1110, J2-J3 1220,
// J3-wrist 1300, wrist-faceplate 255 forward and 159 down. Reach 3143 mm.
export const DIM = Object.freeze({
  j2x: 0.390, j2z: 1.110, lower: 1.220, upper: 1.300, wristX: 0.255, wristZ: -0.159,
  j1z: 0.615, // J1 bearing plane: authored split between base and turret
});
// Motion ranges 360 / 144 / 136 / 720 deg. The split of J2 and J3 is fitted to
// the drawing's operating space: faceplate top 2397 (J2 0, J3 +10), bottom
// -561 (J2 +100, J3 -90). The published figures give only each axis's span.
// J3 is the upper arm's angle from horizontal (the parallelogram's absolute angle).
export const limitsDeg = [[-180, 180], [-44, 100], [-126, 10], [-360, 360]];
export const speedsDeg = [140, 140, 140, 305];
// The parallel links, read off the drawing's proportions (authored, not published):
// the J3 drive crank / upper-arm rear lever, and the two wrist-levelling offsets.
export const CRANK = [-0.51, 0, 0.27];
export const LEVEL_LOWER = [-0.26, 0, 0.10];
export const LEVEL_UPPER = [0.485, 0, 0.279];
const CRANK_Y = -0.34, ROD_Y = -0.40, LEVEL_Y = 0.21;

const yellow = namedMaterial('fanuc_yellow', '#f2d000', 0.08, 0.42);
const graphite = namedMaterial('base_graphite', '#3b3e41', 0.25, 0.72);
const motor = namedMaterial('motor_black', '#1c1e20', 0.3, 0.55);
const red = namedMaterial('motor_cover_red', '#d4271b', 0.08, 0.45);
const recess = namedMaterial('casting_recess', '#2b2d2f', 0.1, 0.8);
const steel = namedMaterial('faceplate_steel', '#9ea4a9', 0.8, 0.34);
const sleeve = namedMaterial('cable_sleeve', '#7d705f', 0.0, 0.85);

const G = () => new THREE.Group();
const box = (size, xyz, rpy = [0, 0, 0]) => ({kind: 'box', size, xyz, rpy});
const cyl = (radius, length, xyz, rpy = [0, 0, 0]) => ({kind: 'cylinder', radius, length, xyz, rpy});
const Y = [Math.PI / 2, 0, 0]; // a URDF cylinder (+Z) laid along Y

function shell(g, name, size, at, material = yellow, radius = 0.03) {
  return addMesh(g, name, roundedBox(size, Math.min(radius, Math.min(...size) / 2 - 1e-4), 3), material, at);
}
function disc(g, name, at, radius, length, axis, material = yellow) {
  const d = {x: [length / 2, 0, 0], y: [0, length / 2, 0], z: [0, 0, length / 2]}[axis];
  return cylinderBetween(g, name, at.map((v, i) => v - d[i]), at.map((v, i) => v + d[i]), radius, material, {radial: 48});
}
/** A beam between a and b in the link's XZ plane: `w` across (along Y) and
 * `h` in-plane, tapering from the first pair to the second. Flat faces. */
function beam(g, name, a, b, [w0, h0], [w1, h1], material = yellow, y = 0) {
  const A = new THREE.Vector3(a[0], y, a[2]), B = new THREE.Vector3(b[0], y, b[2]);
  const u = B.clone().sub(A).normalize(), W = new THREE.Vector3(0, 1, 0), H = u.clone().cross(W).normalize();
  const corner = (P, w, h, s, t) => P.clone().addScaledVector(W, s * w / 2).addScaledVector(H, t * h / 2);
  const c = [];
  for (const [P, w, h] of [[A, w0, h0], [B, w1, h1]])
    for (const [s, t] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) c.push(corner(P, w, h, s, t));
  const quads = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
  const positions = [];
  for (const [p, q, r, s] of quads) for (const i of [p, q, r, p, r, s]) positions.push(...c[i].toArray());
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  // Winding follows the corner order; make every face point away from the axis.
  const mid = A.clone().add(B).multiplyScalar(0.5), n = geometry.attributes.normal, pos = geometry.attributes.position;
  const v = new THREE.Vector3(), m = new THREE.Vector3();
  for (let f = 0; f < 6; f++) {
    v.fromBufferAttribute(pos, f * 6); m.fromBufferAttribute(n, f * 6);
    if (m.dot(v.clone().sub(mid)) < 0) {
      for (let k = 0; k < 6; k += 3) {
        const i = f * 6 + k;
        const tmp = [pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1)];
        pos.setXYZ(i + 1, pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2));
        pos.setXYZ(i + 2, ...tmp);
      }
    }
  }
  geometry.computeVertexNormals();
  return addMesh(g, name, geometry, material);
}
/** A plate in the XZ plane through the points (x, z) — or a Shape drawn in
 * (x, z) — `t` thick about y. */
function prism(g, name, points, t, material = yellow, y = 0) {
  const shape = points instanceof THREE.Shape ? points : new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, z)));
  const geometry = new THREE.ExtrudeGeometry(shape, {depth: t, bevelEnabled: false});
  geometry.rotateX(Math.PI / 2); // (x, s, d) -> (x, -d, s)
  geometry.translate(0, y + t / 2, 0);
  return addMesh(g, name, geometry, material);
}

function baseVisual() {
  const g = G();
  // Pedestal type base, 1094 x 945 footprint: plinth, casting, J1 bearing.
  shell(g, 'plinth', [1.094, 0.945, 0.07], [-0.07, 0, 0.035], graphite, 0.02);
  shell(g, 'pedestal_casting', [0.92, 0.74, 0.47], [-0.06, 0, 0.30], graphite, 0.06);
  shell(g, 'pedestal_rear', [0.26, 0.56, 0.36], [-0.56, 0, 0.25], graphite, 0.04);
  addMesh(g, 'j1_bearing', cylinderZ(0.37, 0.05, {radial: 64}), motor, [0, 0, 0.59]);
  shell(g, 'j1_motor', [0.20, 0.24, 0.22], [-0.62, 0.16, 0.30], motor, 0.03);
  disc(g, 'j1_motor_cover', [-0.73, 0.16, 0.30], 0.07, 0.03, 'x', red);
  for (const x of [-0.56, 0.42]) for (const y of [-0.40, 0.40])
    disc(g, `anchor_${x < 0 ? 'r' : 'f'}${y < 0 ? 'r' : 'l'}`, [x, y, 0.08], 0.035, 0.03, 'z', steel);
  return g;
}

function turretVisual() {
  const g = G(), zj2 = DIM.j2z - DIM.j1z;
  shell(g, 'turret', [0.80, 0.62, 0.36], [0.00, 0, 0.18], yellow, 0.05);
  shell(g, 'turret_rear', [0.34, 0.50, 0.30], [-0.36, 0, 0.20], yellow, 0.05);
  for (const s of [-1, 1]) {
    const side = s > 0 ? 'l' : 'r';
    shell(g, `j2_cheek_${side}`, [0.50, 0.10, 0.36], [0.30, s * 0.235, 0.30], yellow, 0.03);
    disc(g, `j2_reducer_${side}`, [DIM.j2x, s * 0.235, zj2], 0.24, 0.10, 'y');
    // J2 motor on the left, J3 motor on the right: black cans, red covers.
    disc(g, `motor_${side}`, [0.22, s * 0.40, 0.30], 0.12, 0.20, 'y', motor);
    disc(g, `motor_cover_${side}`, [0.22, s * 0.525, 0.30], 0.10, 0.05, 'y', red);
  }
  disc(g, 'j3_reducer_cap', [DIM.j2x, -0.30, zj2], 0.11, 0.04, 'y', motor);
  return g;
}

function lowerArmVisual() {
  const g = G();
  disc(g, 'j2_hub', [0, 0, 0], 0.20, 0.36, 'y');
  beam(g, 'lower_arm', [0, 0, 0.08], [0, 0, 1.14], [0.34, 0.30], [0.30, 0.24]);
  disc(g, 'elbow_boss', [0, 0, DIM.lower], 0.15, 0.34, 'y');
  // The cast lightening pockets on both faces: stadium outlines, 110 x 170.
  for (const s of [-1, 1]) for (const [k, z] of [0.42, 0.68, 0.94].entries()) {
    const w = 0.34 - 0.04 * (z - 0.08) / 1.06;
    const pocket = new THREE.Shape();
    pocket.absarc(0, z + 0.03, 0.055, 0, Math.PI, false);
    pocket.absarc(0, z - 0.03, 0.055, Math.PI, 2 * Math.PI, false);
    prism(g, `pocket_${s > 0 ? 'l' : 'r'}${k}`, pocket, 0.006, recess, s * (w / 2 + 0.002));
  }
  return g;
}

function elbowPlateVisual() {
  const g = G(), [lx, , lz] = LEVEL_LOWER, [ux, , uz] = LEVEL_UPPER;
  prism(g, 'level_plate', [[-0.04, -0.06], [lx, lz - 0.05], [lx - 0.02, lz + 0.05], [ux, uz + 0.05], [ux + 0.05, uz - 0.03]],
    0.06, yellow, 0);
  disc(g, 'level_pin_lower', [lx, LEVEL_Y / 2, lz], 0.035, LEVEL_Y + 0.05, 'y', steel);
  disc(g, 'level_pin_upper', [ux, 0, uz], 0.045, 0.10, 'y', steel);
  return g;
}

function upperArmVisual() {
  const g = G(), [cx, , cz] = CRANK;
  disc(g, 'elbow_hub', [0, 0, 0], 0.17, 0.46, 'y');
  beam(g, 'upper_arm', [0.08, 0, 0], [DIM.upper - 0.06, 0, 0], [0.30, 0.27], [0.20, 0.17]);
  beam(g, 'rear_lever', [0.02, 0, 0.02], [cx, 0, cz], [0.30, 0.24], [0.24, 0.18]);
  disc(g, 'rear_pin', [cx, (ROD_Y - 0.10) / 2, cz], 0.06, Math.abs(ROD_Y) + 0.12, 'y', steel);
  disc(g, 'wrist_boss', [DIM.upper, 0, 0], 0.10, 0.26, 'y');
  return g;
}

function wristVisual() {
  const g = G(), [ux, , uz] = LEVEL_UPPER, x4 = DIM.wristX;
  prism(g, 'wrist_bracket', [[-0.08, -0.06], [ux - 0.04, uz + 0.05], [ux + 0.08, uz], [x4 + 0.12, -0.05], [x4 - 0.12, -0.07]],
    0.20, yellow, 0);
  disc(g, 'level_pin_front', [ux, 0, uz], 0.045, 0.26, 'y', steel);
  addMesh(g, 'j4_housing', cylinderZ(0.15, 0.08, {radial: 64}), yellow, [x4, 0, -0.085]);
  addMesh(g, 'j4_reducer', cylinderZ(0.13, 0.045, {radial: 64}), motor, [x4, 0, DIM.wristZ + 0.047]);
  shell(g, 'j4_motor', [0.16, 0.16, 0.14], [x4 - 0.20, 0, 0.02], motor, 0.03);
  disc(g, 'j4_motor_cover', [x4 - 0.20, 0, 0.105], 0.06, 0.03, 'z', red);
  return g;
}

function flangeVisual() {
  const g = G();
  addMesh(g, 'faceplate', cylinderZ(0.125, 0.024, {radial: 64}), steel, [0, 0, 0.012]);
  return g;
}

function crankVisual() {
  const g = G(), [cx, , cz] = CRANK;
  disc(g, 'crank_hub', [0, 0, 0], 0.11, 0.07, 'y');
  beam(g, 'crank_lever', [0, 0, 0], [cx, 0, cz], [0.07, 0.20], [0.07, 0.13]);
  disc(g, 'crank_pin', [cx, (ROD_Y - CRANK_Y) / 2, cz], 0.055, 0.14, 'y', steel);
  return g;
}

function rodVisual() {
  const g = G();
  beam(g, 'j3_rod', [0, 0, 0], [0, 0, DIM.lower], [0.08, 0.13], [0.08, 0.11]);
  for (const [k, z] of [0, DIM.lower].entries()) disc(g, `j3_rod_eye${k}`, [0, 0, z], 0.075, 0.09, 'y');
  addMesh(g, 'cable_sleeve', tubeGeometry([[-0.10, 0.02, 0.10], [-0.13, 0.03, 0.62], [-0.10, 0.02, 1.12]], 0.045,
    {tubular: 24, radial: 16}), sleeve);
  return g;
}

function levelRodVisual(name, length, along) {
  const g = G(), b = along === 'z' ? [0, 0, length] : [length, 0, 0];
  beam(g, name, [0, 0, 0], b, [0.05, 0.06], [0.05, 0.06]);
  return g;
}

const fixed = (name, parent, child, xyz = [0, 0, 0], rpy = [0, 0, 0]) => ({name, type: 'fixed', parent, child, xyz, rpy});
const turn = (name, parent, child, xyz, axis, i) => ({name, type: 'revolute', parent, child, xyz, axis,
  limit: {lower: limitsDeg[i][0] * deg, upper: limitsDeg[i][1] * deg, velocity: speedsDeg[i] * deg}});
// A passive joint of the parallelogram: follows a commanded axis. Continuous so
// the importer needs no limits of its own; the source joint carries them.
const follow = (name, parent, child, xyz, axis, joint, multiplier) =>
  ({name, type: 'continuous', parent, child, xyz, axis, limit: {velocity: 10}, mimic: {joint, multiplier, offset: 0}});

export function definition() {
  const zj2 = DIM.j2z - DIM.j1z;
  const [cx, , cz] = CRANK, [lx, , lz] = LEVEL_LOWER, [ux, , uz] = LEVEL_UPPER;
  const links = [
    {name: 'base_link', visual: baseVisual(), collisions: [box([1.02, 0.90, 0.57], [-0.07, 0, 0.285])]},
    {name: 'J1_link', visual: turretVisual(), collisions: [
      box([0.80, 0.62, 0.40], [0.00, 0, 0.20]), box([0.34, 0.50, 0.30], [-0.36, 0, 0.20]),
      cyl(0.25, 0.62, [DIM.j2x, 0, zj2], Y), box([0.24, 1.10, 0.24], [0.22, 0, 0.30])]},
    {name: 'J2_link', visual: lowerArmVisual(), collisions: [box([0.30, 0.36, 1.40], [0, 0, 0.62])]},
    // The parallel links are bodies too: primitives along each, kept clear
    // of the arms they run beside (a link without one would collide as its mesh).
    {name: 'elbow_link', visual: elbowPlateVisual(), collisions: [box([0.10, 0.06, 0.10], [0, 0, 0])]},
    {name: 'J3_link', visual: upperArmVisual(), collisions: [
      box([1.36, 0.30, 0.27], [0.62, 0, 0]), box([0.42, 0.30, 0.30], [-0.24, 0, 0.13])]},
    {name: 'wrist_link', visual: wristVisual(), collisions: [
      box([0.50, 0.22, 0.44], [0.14, 0, 0.07]), cyl(0.15, 0.13, [DIM.wristX, 0, -0.09])]},
    {name: 'J4_link', visual: flangeVisual(), collisions: [cyl(0.125, 0.024, [0, 0, 0.012])]},
    {name: 'crank_link', visual: crankVisual(), collisions: [
      box([Math.hypot(cx, cz), 0.07, 0.16], [cx / 2, 0, cz / 2], [0, -Math.atan2(cz, cx), 0])]},
    {name: 'rod_pivot_link'},
    {name: 'rod_link', visual: rodVisual(), collisions: [box([0.13, 0.08, DIM.lower], [0, 0, DIM.lower / 2])]},
    {name: 'level_lower_link', visual: levelRodVisual('level_rod_lower', DIM.lower, 'z'),
      collisions: [box([0.06, 0.05, DIM.lower], [0, 0, DIM.lower / 2])]},
    {name: 'level_upper_link', visual: levelRodVisual('level_rod_upper', DIM.upper, 'x'),
      collisions: [box([DIM.upper - 0.30, 0.05, 0.06], [DIM.upper / 2, 0, 0])]},
    {name: 'flange'}, {name: 'tool0'},
  ];
  const joints = [
    turn('J1', 'base_link', 'J1_link', [0, 0, DIM.j1z], [0, 0, 1], 0),
    turn('J2', 'J1_link', 'J2_link', [DIM.j2x, 0, zj2], [0, 1, 0], 1),
    // The lower arm's top holds a level frame: J3 is the upper arm's angle to it.
    follow('J2_level', 'J2_link', 'elbow_link', [0, 0, DIM.lower], [0, 1, 0], 'J2', -1),
    turn('J3', 'elbow_link', 'J3_link', [0, 0, 0], [0, -1, 0], 2),
    follow('J3_level', 'J3_link', 'wrist_link', [DIM.upper, 0, 0], [0, -1, 0], 'J3', -1),
    turn('J4', 'wrist_link', 'J4_link', [DIM.wristX, 0, DIM.wristZ], [0, 0, -1], 3),
    fixed('J4_flange', 'J4_link', 'flange', [0, 0, 0], [Math.PI, 0, 0]),
    fixed('flange_tool0', 'flange', 'tool0'),
    // Presentation of the two parallelograms (no collision): the J3 crank and
    // drive rod, and the wrist-levelling rods on either side of the elbow plate.
    follow('J3_crank', 'J1_link', 'crank_link', [DIM.j2x, CRANK_Y, zj2], [0, -1, 0], 'J3', 1),
    follow('J3_rod_unturn', 'crank_link', 'rod_pivot_link', [cx, ROD_Y - CRANK_Y, cz], [0, -1, 0], 'J3', -1),
    follow('J3_rod', 'rod_pivot_link', 'rod_link', [0, 0, 0], [0, 1, 0], 'J2', 1),
    follow('level_lower', 'J1_link', 'level_lower_link', [DIM.j2x + lx, LEVEL_Y, zj2 + lz], [0, 1, 0], 'J2', 1),
    follow('level_upper', 'elbow_link', 'level_upper_link', [ux, 0, uz], [0, -1, 0], 'J3', 1),
  ];
  return {name: 'fanuc_m410ic_185_reference', links, joints};
}
