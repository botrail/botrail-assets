/** CC0 authored shells for the FANUC SR-3iA (4-axis SCARA, floor mount).
 * Numeric catalogue dimensions only; no imported CAD, meshes or drawings. */
import * as THREE from 'three';
import {addMesh, namedMaterial, roundedBox, cylinderZ, cylinderBetween, tubeGeometry}
  from '@botrail/authoring/geometry.mjs';

const deg = Math.PI / 180;

// FANUC catalogue RSCARA(E)-03, operating-space drawing and specification table:
// J1-J2 200, J2-J4 200 (reach 400); the flange (the spline shaft's lower end) 150
// above the mounting surface and the shaft's top 558, both at J3 = 0; J3 stroke 200.
export const DIM = Object.freeze({
  l1: 0.200, l2: 0.200, flangeZ: 0.150, height: 0.558, stroke: 0.200,
  // Read off the drawing's proportions (authored, not published): the base top
  // (J1 bearing plane) and arm 1's top at J2, where the head sits on it.
  j1z: 0.176, j2z: 0.206,
});
// Motion range J1 ±142°, J2 ±145°, J3 200 mm, J4 ±720°; maximum speed
// 720 °/s, 780 °/s, 1800 mm/s, 3000 °/s (rad/s, rad/s, m/s, rad/s below).
export const limitsDeg = [[-142, 142], [-145, 145], null, [-720, 720]];
export const speeds = [720 * deg, 780 * deg, 1.8, 3000 * deg];
// Base footprint in plan: 140 wide, 132 behind J1 and 70 in front of it.
export const FOOTPRINT = Object.freeze({rear: -0.132, front: 0.070, half: 0.070});
// The cable hose, read off the drawing (authored): it rises 104.5 behind J1 out of
// the connector box, arches over J1 (centreline 528 high) and drops into the head's
// top. Three visual pieces meet on joint axes so it never tears: the rear half
// (base) meets the front half (arm 1) at Q on the J1 axis; that meets a short stub
// (head) at P on the J2 axis, where the hose runs vertical.
export const HOSE = Object.freeze({
  radius: 0.010, sleeve: 0.0145,
  Q: [0, 0, 0.528], P: [0.200, 0, 0.415],
  // zero-pose cell frame (x, z); y = 0
  rear: [[-0.1045, 0.200], [-0.1045, 0.210], [-0.1045, 0.400], [-0.1005, 0.431], [-0.0895, 0.460],
    [-0.070, 0.4866], [-0.050, 0.5055], [-0.030, 0.5174], [-0.012, 0.5243], [-0.004, 0.527], [0, 0.528]],
  front: [[0, 0.528], [0.004, 0.529], [0.030, 0.5303], [0.060, 0.5263], [0.090, 0.5149], [0.120, 0.497],
    [0.150, 0.482], [0.175, 0.463], [0.192, 0.440], [0.200, 0.422], [0.200, 0.415]],
  stub: [[0.200, 0.415], [0.200, 0.400]],
});

const yellow = namedMaterial('fanuc_yellow', '#f2d000', 0.08, 0.42);
const black = namedMaterial('base_black', '#1c1e20', 0.3, 0.55);
const graphite = namedMaterial('base_graphite', '#3b3e41', 0.25, 0.72);
const recess = namedMaterial('parting_line', '#2b2d2f', 0.1, 0.8);
const hoseBlack = namedMaterial('cable_hose', '#141516', 0.0, 0.62);
const steel = namedMaterial('shaft_steel', '#9ea4a9', 0.8, 0.34);
const groove = namedMaterial('screw_groove', '#5f666c', 0.7, 0.45);

const G = () => new THREE.Group();
const r6 = v => Math.round(v * 1e6) / 1e6;
const box = (size, xyz, rpy = [0, 0, 0]) => ({kind: 'box', size: size.map(r6), xyz: xyz.map(r6), rpy});
const cyl = (radius, length, xyz, rpy = [0, 0, 0]) => ({kind: 'cylinder', radius: r6(radius), length: r6(length), xyz: xyz.map(r6), rpy});
// Facets for a round part of this radius: fine on the big shells, coarse on the bolts.
const facets = radius => Math.max(16, Math.min(64, Math.round(radius * 1600)));
// Everything is authored in the zero-pose cell frame (the drawing's coordinates,
// z up from the mounting surface) and shifted into each link's frame.
const ORIGIN = {
  base_link: [0, 0, 0], J1_link: [0, 0, DIM.j1z], J2_link: [DIM.l1, 0, DIM.j2z],
  J3_link: [DIM.l1 + DIM.l2, 0, DIM.flangeZ], J4_link: [DIM.l1 + DIM.l2, 0, DIM.flangeZ],
};
const inLink = (link, xyz) => xyz.map((v, i) => v - ORIGIN[link][i]);
const circ = (r, dx) => Math.sqrt(Math.max(0, r * r - dx * dx));
const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** A smooth curve y(x) through [x, y] points (cubic Hermite, finite-difference slopes). */
function spline(points) {
  const n = points.length, slope = k => {
    const [a, b] = [points[Math.max(0, k - 1)], points[Math.min(n - 1, k + 1)]];
    return (b[1] - a[1]) / (b[0] - a[0]);
  };
  return x => {
    if (x <= points[0][0]) return points[0][1];
    if (x >= points[n - 1][0]) return points[n - 1][1];
    let i = 0; while (points[i + 1][0] < x) i++;
    const [[x0, y0], [x1, y1]] = [points[i], points[i + 1]], h = x1 - x0, t = (x - x0) / h;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * slope(i)
      + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * slope(i + 1);
  };
}

function shell(g, name, size, at, material = yellow, radius = 0.01) {
  return addMesh(g, name, roundedBox(size, Math.min(radius, Math.min(...size) / 2 - 1e-4), 2), material, at);
}
function disc(g, name, at, radius, length, axis, material = yellow) {
  const d = {x: [length / 2, 0, 0], y: [0, length / 2, 0], z: [0, 0, length / 2]}[axis];
  return cylinderBetween(g, name, at.map((v, i) => v - d[i]), at.map((v, i) => v + d[i]), radius, material, {radial: facets(radius)});
}
/** A vertical cylinder about (x, y) from z0 up to z1. */
function post(g, name, [x, y], z0, z1, radius, material = yellow) {
  return addMesh(g, name, cylinderZ(radius, z1 - z0, {radial: facets(radius)}), material, [x, y, (z0 + z1) / 2]);
}
/** A vertical frustum about (x, y): radius r0 at z0, r1 at z1. */
function cone(g, name, [x, y], z0, z1, r0, r1, material = yellow) {
  const geometry = new THREE.CylinderGeometry(r1, r0, z1 - z0, facets(Math.max(r0, r1)));
  geometry.rotateX(Math.PI / 2);
  return addMesh(g, name, geometry, material, [x, y, (z0 + z1) / 2]);
}
/** A moulded shell lofted along +X through sections {x, w, lo, hi, rTop, rBot}:
 * rounded rectangles across Y (half-width w) from lo up to hi, so the sections carry
 * both the plan and the side view. Smooth-shaded, flat end caps. */
function loft(g, name, sections, material = yellow, k = 5) {
  const rings = sections.map(({x, w, lo, hi, rTop, rBot}) => {
    const half = Math.max(w, 0.0015), cap = (hi - lo) / 2;
    const rt = Math.min(rTop, half, cap), rb = Math.min(rBot, half, cap), ring = [];
    for (const [cy, cz, r, a0] of [[half - rt, hi - rt, rt, 0], [rt - half, hi - rt, rt, 90],
      [rb - half, lo + rb, rb, 180], [half - rb, lo + rb, rb, 270]])
      for (let i = 0; i <= k; i++) {
        const a = (a0 + 90 * i / k) * deg;
        ring.push([x, cy + r * Math.cos(a), cz + r * Math.sin(a)]);
      }
    return ring;
  });
  const m = rings[0].length, positions = rings.flat(2), index = [];
  for (let s = 0; s + 1 < rings.length; s++) for (let j = 0; j < m; j++) {
    const a = s * m + j, b = s * m + (j + 1) % m;
    index.push(a, b, a + m, b, b + m, a + m);
  }
  for (const [ring, out] of [[rings[0], false], [rings.at(-1), true]]) {
    const c = positions.length / 3, z = ring.reduce((t, p) => t + p[2], 0) / m;
    positions.push(ring[0][0], 0, z, ...ring.flat());
    for (let j = 0; j < m; j++) {
      const a = c + 1 + j, b = c + 1 + (j + 1) % m;
      index.push(...(out ? [c, a, b] : [c, b, a]));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(index); geometry.computeVertexNormals();
  return addMesh(g, name, geometry, material);
}
/** Stations along x: dense on a round end (radius r about c) and every `step` between. */
function stations(x0, x1, ends, step = 0.005) {
  const xs = new Set();
  for (let x = x0; x <= x1 + 1e-9; x += step) xs.add(+x.toFixed(6));
  for (const [c, r, sign] of ends) for (let i = 0; i <= 16; i++)
    xs.add(+(c + sign * r * Math.cos(i * Math.PI / 32)).toFixed(6));
  return [...xs].filter(x => x >= x0 - 1e-9 && x <= x1 + 1e-9).sort((a, b) => a - b);
}
/** The hose along a Catmull-Rom path through (x, z) points (y = 0). Where
 * `sleeve(s, length)` gives a distance (from the rib phase), the arc length s is
 * drawn as the corrugated spring sleeve instead of the bare hose. Visual only. */
function hose(g, name, points, sleeve = () => null) {
  const path = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const length = path.getLength(), tubular = Math.ceil(length / 0.00175), radial = 12;
  const geometry = new THREE.TubeGeometry(path, tubular, HOSE.radius, radial, false);
  const position = geometry.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    const phase = sleeve(length * i / tubular, length);
    if (phase === null) continue;
    const rib = 0.5 - 0.5 * Math.cos(2 * Math.PI * phase / 0.007);
    const scale = (HOSE.sleeve - 0.0022 * rib) / HOSE.radius;
    path.getPointAt(i / tubular, c);
    for (let j = 0; j <= radial; j++) {
      const n = i * (radial + 1) + j;
      v.fromBufferAttribute(position, n).sub(c).multiplyScalar(scale).add(c);
      position.setXYZ(n, v.x, v.y, v.z);
    }
  }
  geometry.computeVertexNormals();
  return addMesh(g, name, geometry, hoseBlack);
}

function baseVisual() {
  const g = G(), {rear, front, half} = FOOTPRINT, xh = HOSE.rear[0][0];
  // The published footprint: foot flange with four anchor bolts, the round column
  // under J1, the block behind it and the connector box on the rear face.
  shell(g, 'base_foot', [front + 0.080, 2 * half, 0.012], [(front - 0.080) / 2, 0, 0.006], graphite, 0.004);
  post(g, 'base_column', [0, 0], 0.012, DIM.j1z, 0.066, black);
  shell(g, 'base_rear', [0.066, 0.104, DIM.j1z - 0.012], [-0.047, 0, (DIM.j1z + 0.012) / 2], black, 0.008);
  shell(g, 'connector_box', [0.056, 0.116, 0.166], [rear + 0.028, 0, 0.087], graphite, 0.006);
  disc(g, 'connector_gland', [rear - 0.014, 0.036, 0.120], 0.012, 0.028, 'x', black);
  shell(g, 'connector_plug', [0.013, 0.060, 0.064], [rear - 0.0065, -0.011, 0.052], black, 0.003);
  for (const x of [-0.064, 0.060]) for (const y of [-half + 0.012, half - 0.012])
    post(g, `anchor_${x < 0 ? 'r' : 'f'}${y < 0 ? 'r' : 'l'}`, [x, y], 0.012, 0.018, 0.007, steel);
  // Hose: gland on the connector box, spring sleeve, the rear half of the arch.
  post(g, 'hose_gland', [xh, 0], 0.170, HOSE.rear[0][1], 0.017, black);
  hose(g, 'hose_rear', HOSE.rear, s => s <= 0.100 ? s : null);
  addMesh(g, 'hose_joint', new THREE.SphereGeometry(HOSE.radius + 0.0002, 24, 16), hoseBlack, HOSE.Q);
  return g;
}

function arm1Visual() {
  const g = G(), x2 = DIM.l1;
  // Plan: round about J1 (R 64), a waist 54 wide ahead of it, round about J2 (R 58).
  // Side: 54 thick over J1, sloping down to 30 at the waist and on to J2.
  const waist = spline([[0, 0.064], [0.030, 0.061], [0.060, 0.051], [0.085, 0.035], [0.105, 0.027],
    [0.125, 0.030], [0.150, 0.043], [0.175, 0.054], [0.200, 0.058]]);
  const w = x => x < 0 ? circ(0.064, x) : x > x2 ? circ(0.058, x - x2) : waist(x);
  const hi = x => DIM.j2z + 0.024 * (1 - smoothstep(0.035, 0.105, x));
  loft(g, 'arm1', stations(-0.064, x2 + 0.058, [[0, 0.064, -1], [x2, 0.058, 1]])
    .map(x => ({x, w: w(x), lo: DIM.j1z, hi: hi(x), rTop: 0.008, rBot: 0.003})));
  post(g, 'j1_cover', [0, 0], DIM.j2z + 0.022, DIM.j2z + 0.028, 0.042);
  for (let k = 0; k < 4; k++) {
    const a = (24 + 90 * k) * deg;
    post(g, `j1_cover_bolt${k}`, [0.038 * Math.cos(a), 0.038 * Math.sin(a)], DIM.j2z + 0.027, DIM.j2z + 0.030, 0.004, graphite);
  }
  post(g, 'j2_cover', [x2, 0], 0.163, DIM.j1z + 0.002, 0.055);
  // Hose: the front half of the arch, ending in the spring sleeve above J2.
  hose(g, 'hose_front', HOSE.front, (s, length) => s >= length - 0.095 ? length - s : null);
  g.position.set(...ORIGIN.J1_link.map(v => -v));
  return g;
}

function headVisual() {
  const g = G(), x2 = DIM.l1, x4 = DIM.l1 + DIM.l2;
  // Plan: 125 wide, round about J2 at the rear, narrowing to 110 and rounded
  // (R 40) at the front, 52 beyond J4. Side: the underside 224 over the floor, a
  // parting line at 250, the cover 400 high over the middle, falling to 316 at
  // the front and to the hose connector over J2 at the rear.
  const w = x => x < x2 ? circ(0.0625, x - x2) : x < 0.412 ? 0.0625 - 0.0075 * (x - x2) / (0.412 - x2)
    : 0.015 + circ(0.040, x - 0.412);
  const top = spline([[0.1375, 0.338], [0.150, 0.348], [0.165, 0.361], [0.185, 0.377], [0.210, 0.392],
    [0.245, 0.400], [0.290, 0.400], [0.330, 0.393], [0.370, 0.373], [0.400, 0.352], [0.425, 0.334],
    [0.445, 0.316], [0.452, 0.300]]);
  const xs = stations(x2 - 0.0625, 0.452, [[x2, 0.0625, -1], [0.412, 0.040, 1]]);
  loft(g, 'head_lower', xs.map(x => ({x, w: w(x), lo: 0.224, hi: 0.2505, rTop: 0.002, rBot: 0.008})));
  loft(g, 'head_parting', xs.map(x => ({x, w: w(x) - 0.002, lo: 0.249, hi: 0.255, rTop: 0.001, rBot: 0.001})), recess, 1);
  loft(g, 'head_cover', xs.map(x => ({x, w: w(x), lo: 0.2535, hi: top(x), rTop: 0.014, rBot: 0.002})));
  post(g, 'j2_housing', [x2, 0], DIM.j2z, 0.236, 0.0615);
  cone(g, 'j4_nose', [x4, 0], 0.192, 0.226, 0.016, 0.030);
  post(g, 'j4_seal', [x4, 0], top(x4) - 0.007, top(x4) + 0.006, 0.016, graphite);
  for (const [x, y] of [[0.262, 0.016], [0.262, -0.016], [0.281, 0]])
    post(g, `air_coupling_${x > 0.27 ? 'c' : y > 0 ? 'l' : 'r'}`, [x, y], 0.397, 0.409, 0.0055, graphite);
  // Hose: the connector on the cover over J2 and the stub of spring sleeve above it.
  post(g, 'hose_connector', [x2, 0], top(x2) - 0.006, HOSE.stub[1][1], 0.015, graphite);
  hose(g, 'hose_stub', HOSE.stub, s => s);
  g.position.set(...ORIGIN.J2_link.map(v => -v));
  return g;
}

function shaftVisual() {
  const g = G(), x4 = DIM.l1 + DIM.l2, z = DIM.flangeZ;
  // Ball-screw spline Ø20 through the head, a Ø38 stopper on top; the screw's
  // groove as a 20 mm lead helix (visual).
  post(g, 'spline_shaft', [x4, 0], z + 0.040, DIM.height - 0.010, 0.010, steel);
  const z0 = z + 0.042, z1 = DIM.height - 0.012, n = Math.round((z1 - z0) / 0.020 * 12), helix = [];
  for (let i = 0; i <= n; i++) {
    const a = 2 * Math.PI * i / 12;
    helix.push([x4 + 0.0097 * Math.cos(a), 0.0097 * Math.sin(a), z0 + (z1 - z0) * i / n]);
  }
  addMesh(g, 'screw_groove', tubeGeometry(helix, 0.0011, {tubular: n, radial: 4}), groove);
  post(g, 'shaft_stopper', [x4, 0], DIM.height - 0.010, DIM.height, 0.019, steel);
  g.position.set(...ORIGIN.J3_link.map(v => -v));
  return g;
}

function flangeVisual() {
  const g = G(), x4 = DIM.l1 + DIM.l2, z = DIM.flangeZ;
  // The shaft's lower end (tool side) and the Ø40 clamp collar; its screw shows J4.
  post(g, 'shaft_end', [x4, 0], z, z + 0.028, 0.009, steel);
  post(g, 'clamp_collar', [x4, 0], z + 0.028, z + 0.040, 0.020, steel);
  disc(g, 'clamp_screw', [x4, 0.0205, z + 0.034], 0.0035, 0.004, 'y', black);
  g.position.set(...ORIGIN.J4_link.map(v => -v));
  return g;
}

const fixed = (name, parent, child, xyz = [0, 0, 0], rpy = [0, 0, 0]) => ({name, type: 'fixed', parent, child, xyz, rpy});
const turn = (name, parent, child, xyz, axis, i) => ({name, type: 'revolute', parent, child, xyz, axis,
  limit: {lower: limitsDeg[i][0] * deg, upper: limitsDeg[i][1] * deg, velocity: speeds[i]}});
// Collision primitives in the zero-pose cell frame, placed into the link.
const inBox = (link, size, xyz) => box(size, inLink(link, xyz));
const inCyl = (link, radius, length, xyz) => cyl(radius, length, inLink(link, xyz));

export function definition() {
  const x2 = DIM.l1, x4 = DIM.l1 + DIM.l2, {rear, front, half} = FOOTPRINT;
  const links = [
    {name: 'base_link', visual: baseVisual(), collisions: [
      inCyl('base_link', 0.066, DIM.j1z, [0, 0, DIM.j1z / 2]),
      inBox('base_link', [-rear, 0.120, DIM.j1z], [rear / 2, 0, DIM.j1z / 2]),
      inBox('base_link', [front + 0.080, 2 * half, 0.012], [(front - 0.080) / 2, 0, 0.006])]},
    {name: 'J1_link', visual: arm1Visual(), collisions: [
      inCyl('J1_link', 0.064, 0.058, [0, 0, DIM.j1z + 0.029]),
      inBox('J1_link', [x2, 0.090, DIM.j2z - DIM.j1z], [x2 / 2, 0, (DIM.j1z + DIM.j2z) / 2]),
      inCyl('J1_link', 0.058, DIM.j2z - 0.162, [x2, 0, (DIM.j2z + 0.162) / 2])]},
    {name: 'J2_link', visual: headVisual(), collisions: [
      inCyl('J2_link', 0.0625, 0.180, [x2, 0, DIM.j2z + 0.090]),
      inBox('J2_link', [0.252, 0.125, 0.094], [x2 + 0.126, 0, 0.271]),
      inBox('J2_link', [0.215, 0.118, 0.082], [x2 + 0.1075, 0, 0.359]),
      inCyl('J2_link', 0.030, 0.029, [x4, 0, 0.2095])]},
    // The shaft runs through the head by design; the two are joint neighbours.
    {name: 'J3_link', visual: shaftVisual(), collisions: [
      inCyl('J3_link', 0.010, DIM.height - 0.010 - (DIM.flangeZ + 0.040), [x4, 0, (DIM.height - 0.010 + DIM.flangeZ + 0.040) / 2]),
      inCyl('J3_link', 0.019, 0.010, [x4, 0, DIM.height - 0.005])]},
    {name: 'J4_link', visual: flangeVisual(), collisions: [inCyl('J4_link', 0.020, 0.038, [x4, 0, DIM.flangeZ + 0.019])]},
    {name: 'flange'}, {name: 'tool0'},
  ];
  const joints = [
    turn('J1', 'base_link', 'J1_link', ORIGIN.J1_link, [0, 0, 1], 0),
    turn('J2', 'J1_link', 'J2_link', inLink('J1_link', ORIGIN.J2_link), [0, 0, 1], 1),
    // J3 lowers the shaft: positive down, 0 at the top of the stroke.
    {name: 'J3', type: 'prismatic', parent: 'J2_link', child: 'J3_link', xyz: inLink('J2_link', ORIGIN.J3_link),
      rpy: [0, 0, 0], axis: [0, 0, -1], limit: {lower: 0, upper: DIM.stroke, velocity: speeds[2]}},
    // J4 turns the shaft right-handed about the flange normal (as the M-410iC's J4).
    turn('J4', 'J3_link', 'J4_link', [0, 0, 0], [0, 0, -1], 3),
    fixed('J4_flange', 'J4_link', 'flange', [0, 0, 0], [Math.PI, 0, 0]),
    fixed('flange_tool0', 'flange', 'tool0'),
  ];
  return {name: 'fanuc_sr3ia_reference', links, joints};
}
