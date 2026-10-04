/** The carriers a logistics cell is full of: a roll cage (`roll_cage`, the
 * Japanese roll box pallet カゴ台車) and the sleeve of a folding container
 * (`orikon`, the オリコン). Illustrative and unbranded, drawn in the
 * proportions of the common sizes; the consumer (botrail `bt.parts`) scales
 * them to the size it builds.
 */
import * as THREE from "three";
import { namedMaterial } from "@botrail/authoring/geometry.mjs";
import { flatten } from "./people.mjs";

const PI = Math.PI;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const linear = s => (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4);
const finish = (name, [r, g, b], roughness, metalness = 0) =>
  namedMaterial(name, new THREE.Color(linear(r / 255), linear(g / 255), linear(b / 255)), metalness, roughness);

export const LOGISTICS_MATERIALS = Object.freeze({
  zinc: finish("zinc_steel", [190, 192, 195], 0.4, 0.6),
  zincDark: finish("zinc_deck", [150, 153, 157], 0.45, 0.55),
  rubber: finish("rubber", [22, 22, 24], 0.75),
  hub: finish("caster_hub", [120, 124, 128], 0.35, 0.6),
  // a folding container is moulded in one colour: the consumer tints it
  pp: finish("polypropylene", [44, 104, 178], 0.55),
});
const M = LOGISTICS_MATERIALS;

function box(g, name, size, at, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name; mesh.position.set(...at); g.add(mesh);
}
function cylinder(g, name, r, h, at, material, { segs = 16, axis = "z" } = {}) {
  const geo = new THREE.CylinderGeometry(r, r, h, segs);
  if (axis === "z") geo.rotateX(PI / 2);
  if (axis === "x") geo.rotateZ(-PI / 2);
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = name; mesh.position.set(...at); g.add(mesh);
}
/** A round rod from `a` to `b` with few facets (a wire, a rung), open-ended. */
function rod(g, name, a, b, r, material, segs = 6) {
  const A = V(...a), d = V(...b).sub(A);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), segs, 1, true), material);
  mesh.name = name;
  mesh.position.copy(A.clone().add(d.clone().multiplyScalar(0.5)));
  mesh.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
  g.add(mesh);
}
/** A round tube along an open polyline, its corners bent with radius `bend`. */
function bentTube(g, name, points, r, material, { bend = 0.1, radial = 10, per = 0.04 } = {}) {
  const P = points.map(p => V(...p)), path = new THREE.CurvePath();
  let start = P[0];
  for (let i = 1; i < P.length - 1; i++) {
    const a = P[i - 1], b = P[i], c = P[i + 1], u = a.clone().sub(b), v = c.clone().sub(b);
    const k = Math.min(bend, u.length() / 2.01, v.length() / 2.01);
    const p = b.clone().add(u.normalize().multiplyScalar(k)), o = b.clone().add(v.normalize().multiplyScalar(k));
    path.add(new THREE.LineCurve3(start, p));
    path.add(new THREE.QuadraticBezierCurve3(p, b, o));
    start = o;
  }
  path.add(new THREE.LineCurve3(start, P[P.length - 1]));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(4, Math.ceil(path.getLength() / per)), r, radial, false), material);
  mesh.name = name; g.add(mesh);
}

// ------------------------------------------------------------------ roll cage
// Drawn 1.10 wide (x) by 0.80 deep (y) by 1.70 tall, the deck's top at
// 0.243 on four 150 mm casters: the common two-sided cage. A mesh side frame
// stands at each end of the width — a 32 mm tube bent at its top corners
// into an inverted U, four rungs, vertical wires at about 85 mm — and both
// long faces are open: cartons go in from either.
const CAGE = { W: 1.10, D: 0.80, H: 1.70, deck: 0.243, tube: 0.016, wire: 0.003, rungs: [0.27, 0.59, 0.91, 1.23] };

/** A caster at (x, y) under the base: top plate, swivel, fork and a 150 mm
 * wheel rolling along x (`swivel` offsets the wheel behind its pivot). */
function caster(g, tag, x, y, swivel) {
  const top = CAGE.deck - 0.044, r = 0.075, off = swivel ? -0.02 : 0;
  box(g, `${tag}_plate`, [0.10, 0.085, 0.006], [x, y, top - 0.003], M.hub);
  cylinder(g, `${tag}_swivel`, 0.03, 0.014, [x, y, top - 0.013], M.hub);
  for (const s of [1, -1]) box(g, `${tag}_fork${s}`, [0.06, 0.005, top - 0.02 - r + 0.02], [x + off / 2, y + s * 0.026, (top - 0.02 + r - 0.02) / 2], M.hub);
  cylinder(g, `${tag}_wheel`, r, 0.04, [x + off, y, r], M.rubber, { segs: 20, axis: "y" });
  cylinder(g, `${tag}_hub`, 0.032, 0.044, [x + off, y, r], M.hub, { segs: 12, axis: "y" });
}

export function rollCage(g) {
  const body = new THREE.Group();
  const { W, D, H, deck, tube: tr, wire: wr, rungs } = CAGE, hx = W / 2, hy = D / 2;
  // the base: a square-tube frame under a ribbed steel deck
  for (const s of [1, -1]) {
    box(body, `base_end${s}`, [0.04, D, 0.04], [s * (hx - 0.02), 0, deck - 0.024], M.zinc);
    box(body, `base_side${s}`, [W - 0.08, 0.04, 0.04], [0, s * (hy - 0.02), deck - 0.024], M.zinc);
  }
  for (let i = -3; i <= 3; i++) box(body, `base_cross${i}`, [0.025, D - 0.08, 0.025], [i * (W / 8), 0, deck - 0.032], M.zincDark);
  box(body, "deck", [W - 0.08, D - 0.08, 0.004], [0, 0, deck - 0.002], M.zincDark);
  for (let i = -8; i <= 8; i++) box(body, `deck_rib${i}`, [0.012, D - 0.1, 0.003], [i * 0.06, 0, deck + 0.0005], M.zinc);
  // casters inside the base's corners, the pair at -x swivelling
  for (const [tag, sx, sy] of [["fl", 1, 1], ["fr", 1, -1], ["bl", -1, 1], ["br", -1, -1]]) {
    caster(body, `caster_${tag}`, sx * (hx - 0.09), sy * (hy - 0.09), sx < 0);
  }
  // the side frames at both ends of the width
  const top = H - tr;
  for (const s of [1, -1]) {
    const x = s * (hx - tr), y0 = -hy + tr, y1 = hy - tr;
    bentTube(body, `side${s}_frame`, [[x, y0, deck], [x, y0, top], [x, y1, top], [x, y1, deck]], tr, M.zinc, { bend: 0.11 });
    for (const [k, z] of rungs.entries()) rod(body, `side${s}_rung${k}`, [x, y0, deck + z], [x, y1, deck + z], 0.0125, M.zinc, 8);
    const n = 9;
    for (let i = 1; i < n; i++) {
      const y = y0 + ((y1 - y0) * i) / n;
      // a wire under the bend stops where the bent tube is
      const drop = Math.max(0, 0.11 - Math.min(y - y0, y1 - y)) ** 2 / 0.11;
      rod(body, `side${s}_wire${i}`, [x, y, deck + 0.005], [x, y, top - drop - 0.004], wr, M.zinc, 4);
    }
    for (const y of [y0, y1]) box(body, `side${s}_shoe${y > 0 ? "l" : "r"}`, [0.034, 0.034, 0.05], [x, y, deck + 0.025], M.zincDark);
  }
  for (const mesh of flatten(body)) g.add(mesh);
}

// ------------------------------------------------------------------ orikon
// The sleeve of a folding container (オリコン), drawn 0.530 long (x) by 0.366
// wide (y) by 0.321 tall: the outside of its four folding walls — flat, with
// the hinge bead along the bottom, a raised frame of ribs on each long wall,
// a hand hole through each end wall under the rim, rounded corners — the
// stacking rim and the inset base band. Open inside and below like `tote`:
// the walls and floor are the consumer's boxes, which this wraps. Moulded
// in one colour: the consumer tints it.
const ORIKON = { L: 0.530, W: 0.366, H: 0.321, wall: 0.006, rim: 0.022, base: 0.016, corner: 0.022 };

/** A rounded-rectangle ring (outer `l` x `w`, `width` wide) extruded `h` up from `z0`. */
function band(g, name, l, w, r, width, z0, h, material) {
  const outline = (hx, hy, rr) => {
    const s = new THREE.Shape();
    s.moveTo(hx, -hy + rr); s.lineTo(hx, hy - rr); s.absarc(hx - rr, hy - rr, rr, 0, PI / 2, false);
    s.lineTo(-hx + rr, hy); s.absarc(-hx + rr, hy - rr, rr, PI / 2, PI, false);
    s.lineTo(-hx, -hy + rr); s.absarc(-hx + rr, -hy + rr, rr, PI, 1.5 * PI, false);
    s.lineTo(hx - rr, -hy); s.absarc(hx - rr, -hy + rr, rr, 1.5 * PI, 2 * PI, false);
    return s;
  };
  const shape = outline(l / 2, w / 2, r), hole = outline(l / 2 - width, w / 2 - width, Math.max(0.002, r - width));
  shape.holes.push(new THREE.Path(hole.getPoints(6)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 6 });
  geo.translate(0, 0, z0);
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = name; g.add(mesh);
}

export function orikon(g) {
  const body = new THREE.Group();
  const { L, W, H, wall: t, rim, base, corner: r } = ORIKON, hx = L / 2, hy = W / 2;
  const top = H - rim, bottom = base, mid = (top + bottom) / 2, tall = top - bottom;
  // the long walls (±y) between the rounded corners
  for (const s of [1, -1]) box(body, `wall_long${s}`, [L - 2 * r, t, tall], [0, s * (hy - t / 2), mid], M.pp);
  // the end walls (±x), a hand hole through each: an outline in the wall's
  // (y, z) with a rounded slot 0.11 x 0.032 under the rim, turned so it
  // extrudes through the wall along x
  for (const s of [1, -1]) {
    const shape = new THREE.Shape();
    shape.moveTo(-(hy - r), bottom); shape.lineTo(hy - r, bottom); shape.lineTo(hy - r, top); shape.lineTo(-(hy - r), top);
    shape.closePath();
    const zc = top - 0.046, hw = 0.055, hr = 0.016, slot = new THREE.Path();
    slot.moveTo(-hw + hr, zc - hr); slot.lineTo(hw - hr, zc - hr); slot.absarc(hw - hr, zc, hr, -PI / 2, PI / 2, false);
    slot.lineTo(-hw + hr, zc + hr); slot.absarc(-hw + hr, zc, hr, PI / 2, 1.5 * PI, false);
    shape.holes.push(slot);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 8 });
    geo.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
    geo.translate(s > 0 ? hx - t : -hx, 0, 0);
    const mesh = new THREE.Mesh(geo, M.pp);
    mesh.name = `wall_end${s}`; body.add(mesh);
  }
  // rounded corners: a quarter of the wall's shell at each, the walls
  // meeting on it (nothing inside: the consumer's walls are thinner than r)
  for (const sx of [1, -1]) for (const sy of [1, -1]) {
    const a0 = Math.atan2(sy, sx) - PI / 4, corner = new THREE.Shape();
    corner.absarc(0, 0, r, a0, a0 + PI / 2, false);
    corner.absarc(0, 0, r - t, a0 + PI / 2, a0, true);
    corner.closePath();
    const geo = new THREE.ExtrudeGeometry(corner, { depth: tall, bevelEnabled: false, curveSegments: 6 });
    geo.translate(sx * (hx - r), sy * (hy - r), bottom);
    const mesh = new THREE.Mesh(geo, M.pp);
    mesh.name = `corner_${sx}_${sy}`; body.add(mesh);
  }
  // the hinge bead the walls fold on, all round just above the base band
  for (const s of [1, -1]) {
    box(body, `hinge_long${s}`, [L - 2 * r, 0.004, 0.008], [0, s * (hy + 0.002), bottom + 0.028], M.pp);
    box(body, `hinge_end${s}`, [0.004, W - 2 * r, 0.008], [s * (hx + 0.002), 0, bottom + 0.028], M.pp);
  }
  // the long walls' rib frame: two rails and five posts standing proud
  for (const s of [1, -1]) {
    const y = s * (hy + 0.0025);
    for (const z of [bottom + 0.075, top - 0.02]) box(body, `rail_${s}_${z.toFixed(3)}`, [L - 2 * r - 0.03, 0.005, 0.008], [0, y, z], M.pp);
    for (const x of [-0.21, -0.105, 0, 0.105, 0.21]) box(body, `post_${s}_${x}`, [0.008, 0.005, top - bottom - 0.095], [x, y, (bottom + 0.075 + top - 0.02) / 2], M.pp);
  }
  // the stacking rim round the top and the inset base band underneath
  band(body, "rim", L, W, r, 0.024, top, rim, M.pp);
  band(body, "base_band", L - 0.014, W - 0.014, r - 0.007, 0.02, 0, base, M.pp);
  for (const mesh of flatten(body)) g.add(mesh);
}
