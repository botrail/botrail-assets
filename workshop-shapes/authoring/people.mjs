/** People, for the cells a person works in or walks into: a man of 1.75 m in
 * an oatmeal knit top, jeans and dark leather shoes, in three postures —
 * standing (`person`), handling something before his hips with both hands
 * (`person_reach`) and reaching into a shelf's bin at chest height
 * (`person_pick`). Illustrative: no model, no measured anthropometry.
 *
 * Drawn standing on the floor at the origin facing +x (his left is +y); the
 * shape library registers each into the unit box like every other shape,
 * and the consumer (botrail `bt.parts.person`) scales the posture's own
 * proportions to the height it is asked for. The limbs are shells lofted
 * along the bones through the joints (`tube`), the clothes their finishes;
 * a hand has a palm, four fingers and a thumb; the head a face, ears and
 * hair. Light enough to stand a few of them in a cell (under 7,000
 * triangles each).
 */
import * as THREE from "three";
import { namedMaterial } from "@botrail/authoring/geometry.mjs";

const PI = Math.PI;
const spow = (x, e) => Math.sign(x) * Math.pow(Math.abs(x), e);
const lerp = (a, b, t) => a + (b - a) * t;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const linear = s => (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4);
/** A finish from 0-255 sRGB (a swatch) in the linear RGB the library uses. */
const finish = (name, [r, g, b], roughness, metalness = 0) =>
  namedMaterial(name, new THREE.Color(linear(r / 255), linear(g / 255), linear(b / 255)), metalness, roughness);

export const PEOPLE_MATERIALS = Object.freeze({
  knit: finish("knit_oatmeal", [200, 190, 170], 0.93),
  knitRib: finish("knit_rib", [182, 171, 150], 0.95),
  denim: finish("denim", [64, 90, 142], 0.88),
  denimSeam: finish("denim_seam", [46, 64, 104], 0.88),
  shoe: finish("shoe_leather", [36, 31, 28], 0.42),
  sole: finish("sole_rubber", [104, 98, 92], 0.82),
  skin: finish("skin", [214, 170, 138], 0.55),
  lips: finish("lips", [184, 128, 112], 0.5),
  sclera: finish("eye_white", [226, 220, 210], 0.3),
  iris: finish("eye_dark", [30, 22, 18], 0.2),
  hair: finish("hair", [90, 60, 40], 0.62),
});
const M = PEOPLE_MATERIALS;

// ------------------------------------------------------------------ grids
/** An indexed grid (rows x cols, wrapping in cols) with optional poles: the
 * normals come out smooth over the whole, then the triangles are split by
 * finish key. Returns [{ geometry, key }]. */
function gridMeshes({ rows, cols, point, poleStart, poleEnd, keyOf = () => 0 }) {
  const positions = [];
  const index = (i, j) => i * cols + (((j % cols) + cols) % cols);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) positions.push(...point(i, j));
  const base = rows * cols;
  let ps = -1, pe = -1;
  if (poleStart) { ps = base; positions.push(...poleStart); }
  if (poleEnd) { pe = ps >= 0 ? ps + 1 : base; positions.push(...poleEnd); }
  const tris = [];
  for (let i = 0; i < rows - 1; i++) for (let j = 0; j < cols; j++) {
    const a = index(i, j), b = index(i, j + 1), c = index(i + 1, j + 1), d = index(i + 1, j), key = keyOf(i + 0.5, j + 0.5);
    tris.push([a, b, c, key], [a, c, d, key]);
  }
  if (ps >= 0) for (let j = 0; j < cols; j++) tris.push([ps, index(0, j + 1), index(0, j), keyOf(0, j + 0.5)]);
  if (pe >= 0) for (let j = 0; j < cols; j++) tris.push([pe, index(rows - 1, j), index(rows - 1, j + 1), keyOf(rows - 1, j + 0.5)]);
  const all = new THREE.BufferGeometry();
  all.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  all.setIndex(tris.flatMap(t => t.slice(0, 3)));
  all.computeVertexNormals();
  const pos = all.getAttribute("position"), nor = all.getAttribute("normal");
  const byKey = new Map();
  for (const [a, b, c, key] of tris) {
    if (!byKey.has(key)) byKey.set(key, { p: [], n: [] });
    const out = byKey.get(key);
    for (const v of [a, b, c]) {
      out.p.push(pos.getX(v), pos.getY(v), pos.getZ(v));
      out.n.push(nor.getX(v), nor.getY(v), nor.getZ(v));
    }
  }
  return [...byKey.entries()].map(([key, { p, n }]) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(n, 3));
    return { geometry: g, key };
  });
}

function place(group, name, parts, materials, at = [0, 0, 0]) {
  for (const { geometry, key } of parts) {
    const material = materials.isMaterial ? materials : materials[key];
    if (!material) throw new Error(`${name}: no finish for key ${key}`);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = parts.length > 1 ? `${name}_${key}` : name;
    mesh.position.set(...at);
    group.add(mesh);
  }
}

/** A closed superellipsoid: radii `r`, exponents `e1` / `e2` (1 an
 * ellipsoid, lower squares it off), `deform(p)` bending its points. */
function superellipsoid(group, name, spec, materials, at = [0, 0, 0]) {
  const s = { e1: 1, e2: 1, nu: 24, nv: 12, ...spec };
  const point = (eta, omega) => {
    const ce = Math.cos(eta), se = Math.sin(eta), co = Math.cos(omega), so = Math.sin(omega);
    const [rx, ry, rz] = s.r;
    const p = [rx * spow(ce, s.e1) * spow(co, s.e2), ry * spow(ce, s.e1) * spow(so, s.e2), rz * spow(se, s.e1)];
    return s.deform ? s.deform(p) : p;
  };
  const eta = i => lerp(-PI / 2, PI / 2, (i + 1) / (s.nv + 1)), omega = j => lerp(-PI, PI, j / s.nu);
  place(group, name, gridMeshes({
    rows: s.nv, cols: s.nu, point: (i, j) => point(eta(i), omega(j)),
    poleStart: point(-PI / 2, 0), poleEnd: point(PI / 2, 0),
  }), materials, at);
}

/** Monotone cubic through (xs, ys): smooth, never overshooting between keys. */
function monotone(xs, ys) {
  const n = xs.length;
  if (n === 1) return () => ys[0];
  const d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(1e-9, xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(d[i]) < 1e-12) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return x => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

/** A shell lofted along a 3D centreline through `keys` = [{ p, rx, ry, n =
 * 2.2, ref }]: superellipse sections (n 2 an ellipse), `rx` along the
 * section's front axis (`ref` squared to the centreline), `ry` across it.
 * `caps` "round" (a dome) or "flat" (a pole); `keyOf(s, theta)` picks a
 * finish along the length. `step` sets the ring spacing (metres). */
function tube(group, name, keys, materials, { segs = 14, step = 0.03, caps = ["round", "round"], keyOf, capRings = 2 } = {}) {
  const pts = keys.map(k => V(...k.p));
  const curve = pts.length === 2 ? new THREE.LineCurve3(pts[0], pts[1]) : new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const total = curve.getLength(), rings = Math.max(4, Math.ceil(total / step));
  const lengths = curve.getLengths(200);
  const sOf = p => {
    let best = 0, bd = Infinity;
    for (let i = 0; i <= 200; i++) {
      const dd = curve.getPoint(i / 200).distanceToSquared(p);
      if (dd < bd) { bd = dd; best = i; }
    }
    return lengths[best] / total;
  };
  const ks = keys.map((k, i) => ({ n: 2.2, ref: [1, 0, 0], ...k, s: i === 0 ? 0 : i === keys.length - 1 ? 1 : sOf(pts[i]) }));
  const xs = ks.map(k => k.s);
  const fx = monotone(xs, ks.map(k => k.rx)), fy = monotone(xs, ks.map(k => k.ry)), fn = monotone(xs, ks.map(k => k.n));
  const fref = [0, 1, 2].map(c => monotone(xs, ks.map(k => k.ref[c])));
  const frame = s => {
    const c = curve.getPointAt(s), t = curve.getTangentAt(s).normalize();
    const r = V(fref[0](s), fref[1](s), fref[2](s));
    let f = r.clone().sub(t.clone().multiplyScalar(r.dot(t)));
    if (f.lengthSq() < 1e-10) f = V(0, 0, 1).cross(t);
    if (f.lengthSq() < 1e-10) f = V(1, 0, 0);
    f.normalize();
    return { c, t, f, side: t.clone().cross(f).normalize() };
  };
  const sectionAt = (s, theta, shrink = 1, push = 0) => {
    const { c, t, f, side } = frame(s), e = 2 / Math.max(fn(s), 0.5);
    const a = fx(s) * shrink * spow(Math.cos(theta), e), b = fy(s) * shrink * spow(Math.sin(theta), e);
    return [c.x + f.x * a + side.x * b + t.x * push, c.y + f.y * a + side.y * b + t.y * push, c.z + f.z * a + side.z * b + t.z * push];
  };
  const rows = [];
  const cap = (end, kind) => {
    if (kind !== "round") return [];
    const s = end ? 1 : 0, sign = end ? 1 : -1, depth = Math.min(fx(s), fy(s)), out = [];
    for (let k = capRings; k >= 1; k--) {
      const a = (k / (capRings + 1)) * (PI / 2);
      out.push({ s, shrink: Math.cos(a), push: sign * depth * Math.sin(a) });
    }
    return end ? out.reverse() : out;
  };
  rows.push(...cap(false, caps[0]));
  for (let i = 0; i <= rings; i++) rows.push({ s: i / rings, shrink: 1, push: 0 });
  rows.push(...cap(true, caps[1]));
  const pole = (end, kind) => {
    const s = end ? 1 : 0, { c, t } = frame(s), depth = kind === "round" ? Math.min(fx(s), fy(s)) : 0, sign = end ? 1 : -1;
    return [c.x + t.x * depth * sign, c.y + t.y * depth * sign, c.z + t.z * depth * sign];
  };
  const theta = j => (2 * PI * j) / segs;
  place(group, name, gridMeshes({
    rows: rows.length, cols: segs,
    point: (i, j) => sectionAt(rows[i].s, theta(j), rows[i].shrink, rows[i].push),
    poleStart: pole(false, caps[0]), poleEnd: pole(true, caps[1]),
    keyOf: (i, j) => (keyOf ? keyOf(rows[Math.min(rows.length - 1, Math.floor(i))].s, theta(j)) : 0),
  }), materials);
}

/** A round tube of `radius` along the closed polyline `points`, its corners filleted. */
function ring(group, name, points, radius, material, { bend = 0.01, radial = 6, per = 0.03 } = {}) {
  const P = points.map(p => V(...p)), n = P.length, path = new THREE.CurvePath();
  const corner = i => {
    const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n], u = a.clone().sub(b), v = c.clone().sub(b);
    const r = Math.min(bend, u.length() / 2.01, v.length() / 2.01);
    return [b.clone().add(u.normalize().multiplyScalar(r)), b, b.clone().add(v.normalize().multiplyScalar(r))];
  };
  const cs = P.map((_, i) => corner(i));
  for (let i = 0; i < n; i++) {
    path.add(new THREE.QuadraticBezierCurve3(cs[i][0], cs[i][1], cs[i][2]));
    path.add(new THREE.LineCurve3(cs[i][2], cs[(i + 1) % n][0]));
  }
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(4, Math.ceil(path.getLength() / per)), radius, radial, true), material);
  mesh.name = name;
  group.add(mesh);
}

/** Every mesh's transform baked into its geometry (non-indexed, positions and
 * normals only): the library merges direct child meshes, so a builder hands
 * it a flat list. */
export function flatten(group) {
  const out = [];
  group.updateMatrixWorld(true);
  group.traverse(obj => {
    if (!obj.isMesh) return;
    const g = obj.geometry.index ? obj.geometry.toNonIndexed() : obj.geometry.clone();
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    g.applyMatrix4(obj.matrixWorld);
    for (const key of Object.keys(g.attributes)) if (key !== "position" && key !== "normal") g.deleteAttribute(key);
    const mesh = new THREE.Mesh(g, obj.material);
    mesh.name = obj.name;
    out.push(mesh);
  });
  return out;
}

// ------------------------------------------------------------------ the body
const BODY = { hip: 0.90, hipHalf: 0.088, shoulder: 1.405, shoulderHalf: 0.176, upperArm: 0.295, foreArm: 0.258, neckBase: 1.475 };

/** The torso's lean (pitch, forward +) and twist (yaw, left +), blended in
 * from the waist to the chest so the spine bends. Returns a point map. */
function spine(lean, twist) {
  const pivot = V(0, 0, 0.98);
  return (p, at = p[2]) => {
    const u = THREE.MathUtils.smoothstep(at, 0.98, 1.32);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, lean * u, twist * u, "ZYX"));
    return V(...p).sub(pivot).applyQuaternion(q).add(pivot).toArray();
  };
}

/** The elbow for shoulder `S` and wrist `W` (2-link IK), bending toward `pole`. */
function elbowOf(S, W, a, b, pole) {
  const s = V(...S), w = V(...W);
  let d = w.clone().sub(s), len = d.length();
  if (len > a + b - 0.002) { d.setLength(a + b - 0.002); len = a + b - 0.002; }
  const u = d.clone().normalize(), cosA = (a * a + len * len - b * b) / (2 * a * len), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  let v = V(...pole);
  v.sub(u.clone().multiplyScalar(v.dot(u)));
  if (v.lengthSq() < 1e-10) v = V(0, 0, -1).sub(u.clone().multiplyScalar(-u.z));
  v.normalize();
  return s.clone().add(u.multiplyScalar(a * cosA)).add(v.multiplyScalar(a * sinA)).toArray();
}

/** A hand at the wrist `W`, fingers along `dir`, the palm facing `palm`,
 * `side` +1 the right hand; `curl` 0 open .. 1 a loose fist. */
function hand(g, tag, W, dir, palm, side, curl = 0.3) {
  const X = V(...dir).normalize(), Z = V(...palm);
  Z.sub(X.clone().multiplyScalar(Z.dot(X))).normalize();
  const Y = Z.clone().cross(X).normalize();
  const at = (x, y, z) => V(...W).add(X.clone().multiplyScalar(x)).add(Y.clone().multiplyScalar(y)).add(Z.clone().multiplyScalar(z)).toArray();
  const ts = -side;
  const palmG = new THREE.Group();
  superellipsoid(palmG, `${tag}_palm`, { r: [0.050, 0.043, 0.017], e1: 0.55, e2: 0.6, nu: 12, nv: 6 }, M.skin);
  palmG.position.set(...at(0.055, 0.0, -0.002));
  palmG.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
  g.add(palmG);
  const ref = Z.toArray();
  tube(g, `${tag}_wrist`, [{ p: at(-0.035, 0, 0), rx: 0.024, ry: 0.030, ref }, { p: at(0.02, 0, 0), rx: 0.019, ry: 0.038, ref }],
    M.skin, { segs: 8, step: 0.03, caps: ["flat", "round"] });
  [[0.084, 0.0090], [0.090, 0.0092], [0.084, 0.0088], [0.068, 0.0080]].forEach(([len, r], i) => {
    const y = ts * (0.028 - i * 0.0187), base = [0.098, y, 0.003], a1 = curl * 0.9, a2 = curl * 1.6;
    const k1 = [base[0] + len * 0.45 * Math.cos(a1), y, base[2] + len * 0.45 * Math.sin(a1)];
    const k2 = [k1[0] + len * 0.55 * Math.cos(a1 + a2 * 0.5), y, k1[2] + len * 0.55 * Math.sin(a1 + a2 * 0.5)];
    tube(g, `${tag}_finger${i}`, [
      { p: at(...base), rx: r * 0.95, ry: r * 1.1, ref }, { p: at(...k1), rx: r * 0.88, ry: r, ref }, { p: at(...k2), rx: r * 0.78, ry: r * 0.86, ref },
    ], M.skin, { segs: 6, step: 0.04, caps: ["flat", "round"], capRings: 1 });
  });
  const tc = 0.6 + curl * 0.5;
  tube(g, `${tag}_thumb`, [
    { p: at(0.018, ts * 0.030, 0.004), rx: 0.013, ry: 0.014, ref },
    { p: at(0.052, ts * 0.050, 0.012 + 0.01 * tc), rx: 0.011, ry: 0.011, ref },
    { p: at(0.080, ts * (0.050 - 0.012 * tc), 0.022 + 0.012 * tc), rx: 0.009, ry: 0.0095, ref },
  ], M.skin, { segs: 6, step: 0.04, caps: ["flat", "round"], capRings: 1 });
}

/** The head on the neck's top `N`, turned `yaw` (left +) and nodded `pitch`
 * (down +), the face along +x. */
function head(g, N, yaw, pitch) {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, pitch, yaw, "ZYX"));
  const H = new THREE.Group();
  superellipsoid(H, "skull", {
    r: [0.096, 0.079, 0.113], e1: 0.85, e2: 0.9, nu: 24, nv: 12,
    deform: ([x, y, z]) => {
      const jaw = z < -0.01 ? Math.min(1, (-0.01 - z) / 0.09) : 0;
      let xx = x > 0 ? x * (1 - 0.06 * jaw) : x * 1.04;
      if (x > 0 && z < -0.07) xx += 0.006 * Math.min(1, (-0.07 - z) / 0.03);
      return [xx, y * (1 - 0.22 * jaw * jaw), z];
    },
  }, M.skin, [0.018, 0, 0.098]);
  const nose = new THREE.Group();
  superellipsoid(nose, "nose", { r: [0.012, 0.0105, 0.021], e1: 0.75, e2: 0.85, nu: 10, nv: 6,
    deform: ([x, y, z]) => [x * (0.45 + 0.55 * Math.min(1, Math.max(0, 0.5 - z / 0.042))), y * (0.8 + 0.2 * (0.5 - z / 0.042)), z] }, M.skin);
  nose.position.set(0.108, 0, 0.094);
  nose.rotation.set(0, -0.18, 0);
  H.add(nose);
  for (const s of [1, -1]) {
    const ear = new THREE.Group();
    superellipsoid(ear, `ear${s}`, { r: [0.014, 0.007, 0.028], e1: 0.9, e2: 0.8, nu: 8, nv: 6 }, M.skin);
    ear.position.set(0.012, s * 0.076, 0.096);
    ear.rotation.set(0, 0.15, -s * 0.2);
    H.add(ear);
    superellipsoid(H, `white${s}`, { r: [0.004, 0.0115, 0.0058], nu: 8, nv: 5 }, M.sclera, [0.1015, s * 0.031, 0.120]);
    superellipsoid(H, `iris${s}`, { r: [0.0035, 0.0058, 0.0055], nu: 8, nv: 5 }, M.iris, [0.1038, s * 0.031, 0.120]);
    superellipsoid(H, `brow${s}`, { r: [0.003, 0.016, 0.0024], e1: 0.6, e2: 0.6, nu: 8, nv: 4 }, M.hair, [0.108, s * 0.032, 0.135]);
  }
  superellipsoid(H, "lips", { r: [0.0035, 0.015, 0.003], e1: 0.7, e2: 0.7, nu: 8, nv: 5 }, M.lips, [0.1065, 0, 0.048]);
  // hair: a cap over the skull sinking under the skin at the face, the
  // temples, round the ears and down the nape, with soft edges
  superellipsoid(H, "hair", {
    r: [0.103, 0.086, 0.104], e1: 0.82, e2: 0.88, nu: 28, nv: 14,
    deform: ([x, y, z]) => {
      const ss = (a, b, v) => THREE.MathUtils.smoothstep(v, a, b);
      const hairline = 0.040 + 0.05 * Math.min(1, Math.abs(y) / 0.08);
      const face = ss(0.0, 0.03, x) * (1 - ss(hairline - 0.008, hairline + 0.008, z));
      const temple = ss(0.04, 0.055, Math.abs(y)) * (1 - ss(-0.012, 0.0, z)) * ss(-0.05, -0.035, x);
      const ear = ss(0.035, 0.05, Math.abs(y)) * (1 - ss(0.008, 0.022, z)) * ss(-0.04, -0.025, x) * (1 - ss(0.04, 0.055, x));
      const sink = Math.max(face, temple, ear, 1 - ss(-0.07, -0.055, z)), k = 1 - 0.14 * sink;
      return [x * k, y * k, z * (z > 0 ? 1.04 : 1) * (1 - 0.03 * sink)];
    },
  }, M.hair, [0.010, 0, 0.112]);
  const m = new THREE.Matrix4().compose(V(...N), q, V(1, 1, 1));
  for (const mesh of flatten(H)) { mesh.geometry.applyMatrix4(m); g.add(mesh); }
}

/** A shoe on the floor under the ankle at (x, y), pointing along +x turned by `yaw`. */
function shoe(g, tag, x, y, yaw) {
  const q = new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), yaw);
  const at = (dx, dy, dz) => V(dx, dy, dz).applyQuaternion(q).add(V(x, y, 0)).toArray(), up = [0, 0, 1];
  tube(g, `${tag}_upper`, [
    { p: at(-0.075, 0, 0.050), rx: 0.040, ry: 0.036, n: 2.4, ref: up }, { p: at(-0.040, 0, 0.058), rx: 0.048, ry: 0.044, n: 2.6, ref: up },
    { p: at(0.020, 0, 0.050), rx: 0.042, ry: 0.050, n: 2.8, ref: up }, { p: at(0.095, 0, 0.038), rx: 0.030, ry: 0.050, n: 2.8, ref: up },
    { p: at(0.160, 0, 0.030), rx: 0.022, ry: 0.044, n: 2.6, ref: up }, { p: at(0.192, 0, 0.028), rx: 0.018, ry: 0.032, n: 2.4, ref: up },
  ], M.shoe, { segs: 10, step: 0.05 });
  tube(g, `${tag}_sole`, [
    { p: at(-0.082, 0, 0.011), rx: 0.011, ry: 0.038, n: 3, ref: up }, { p: at(-0.040, 0, 0.011), rx: 0.011, ry: 0.047, n: 3, ref: up },
    { p: at(0.030, 0, 0.010), rx: 0.010, ry: 0.053, n: 3, ref: up }, { p: at(0.120, 0, 0.010), rx: 0.010, ry: 0.052, n: 3, ref: up },
    { p: at(0.200, 0, 0.011), rx: 0.010, ry: 0.034, n: 3, ref: up },
  ], M.sole, { segs: 10, step: 0.06 });
}

/** One person in `pose`: lean, twist, head yaw / pitch, the feet [x, y,
 * yaw], the hands (wrist point, pole the elbow bends toward, palm normal,
 * finger direction, curl). */
function person(g, pose) {
  const B = BODY, T = spine(pose.lean, pose.twist);
  const fwd = T([1, 0, 1.3], 1.3).map((v, i) => v - T([0, 0, 1.3], 1.3)[i]);
  for (const [sid, s] of [["r", -1], ["l", 1]]) {
    const foot = pose.feet[sid], hipP = [0.0, s * B.hipHalf, B.hip], ankle = [foot[0], foot[1], 0.085], kb = pose.knee ?? 0.012;
    const knee = [(hipP[0] + ankle[0]) / 2 + kb, (hipP[1] + ankle[1]) / 2, 0.50], x = [1, 0, 0];
    tube(g, `jeans_${sid}`, [
      { p: [hipP[0] - 0.005, s * 0.080, 0.95], rx: 0.090, ry: 0.088, ref: x },
      { p: [hipP[0] + 0.004, hipP[1] + s * 0.010, 0.80], rx: 0.087, ry: 0.083, ref: x },
      { p: [(hipP[0] * 2 + knee[0]) / 3 + 0.004, (hipP[1] * 2 + knee[1]) / 3 + s * 0.006, 0.66], rx: 0.077, ry: 0.073, ref: x },
      { p: knee, rx: 0.062, ry: 0.060, ref: x },
      { p: [(knee[0] * 2 + ankle[0]) / 3 - 0.008, (knee[1] * 2 + ankle[1]) / 3, 0.36], rx: 0.063, ry: 0.057, ref: x },
      { p: [(knee[0] + ankle[0] * 2) / 3, (knee[1] + ankle[1] * 2) / 3, 0.20], rx: 0.053, ry: 0.050, ref: x },
      { p: [ankle[0], ankle[1], 0.06], rx: 0.058, ry: 0.054, ref: x },
    ], { 0: M.denim, 1: M.denimSeam }, { segs: 12, step: 0.07, caps: ["round", "flat"], keyOf: u => (u > 0.965 ? 1 : 0) });
    shoe(g, `shoe_${sid}`, foot[0] + 0.03, foot[1], foot[2]);
  }
  tube(g, "jeans_seat", [
    { p: [-0.004, 0, 0.835], rx: 0.090, ry: 0.115, n: 2.4, ref: [1, 0, 0] }, { p: [-0.006, 0, 0.870], rx: 0.112, ry: 0.158, n: 2.6, ref: [1, 0, 0] },
    { p: [-0.008, 0, 0.925], rx: 0.120, ry: 0.170, n: 2.7, ref: [1, 0, 0] }, { p: [-0.004, 0, 0.990], rx: 0.106, ry: 0.154, n: 2.6, ref: [1, 0, 0] },
    { p: [0.0, 0, 1.02], rx: 0.100, ry: 0.144, n: 2.6, ref: [1, 0, 0] },
  ], { 0: M.denim, 1: M.denimSeam }, { segs: 22, step: 0.04, caps: ["flat", "flat"], keyOf: u => (u > 0.80 ? 1 : 0) });
  const torso = [
    [-0.008, 0.962, 0.129, 0.179, 2.6], [-0.003, 1.020, 0.118, 0.163, 2.6], [0.008, 1.080, 0.110, 0.153, 2.6],
    [0.012, 1.170, 0.116, 0.157, 2.7], [0.014, 1.260, 0.124, 0.165, 2.8], [0.006, 1.340, 0.120, 0.172, 2.9],
    [-0.004, 1.392, 0.104, 0.172, 2.9], [-0.008, 1.425, 0.090, 0.155, 2.7], [-0.010, 1.450, 0.076, 0.118, 2.5],
    [-0.012, 1.468, 0.064, 0.082, 2.3], [-0.012, 1.482, 0.057, 0.062, 2.2],
  ];
  tube(g, "top_torso", torso.map(([x, z, rx, ry, n]) => ({ p: T([x, 0, z]), rx, ry, n, ref: fwd })),
    { 0: M.knit, 1: M.knitRib }, { segs: 20, step: 0.04, caps: ["flat", "flat"], keyOf: u => (u < 0.075 ? 1 : 0) });
  const neck = [];
  for (let k = 0; k < 14; k++) {
    const a = (2 * PI * k) / 14;
    neck.push(T([-0.010 + 0.060 * Math.cos(a), 0.066 * Math.sin(a), 1.468 + (Math.cos(a) > 0 ? -0.012 * Math.cos(a) : 0)]));
  }
  ring(g, "crew_neck", neck, 0.0075, M.knitRib);
  for (const [sid, s, side] of [["r", -1, 1], ["l", 1, -1]]) {
    const arm = pose.arms[sid], S = T([-0.012, s * B.shoulderHalf, B.shoulder]), W = arm.wrist;
    const E = elbowOf(S, W, B.upperArm, B.foreArm, arm.pole), toward = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f), up = [0, 0, 1];
    tube(g, `sleeve_${sid}`, [
      { p: T([-0.012, s * (B.shoulderHalf - 0.055), B.shoulder - 0.02]), rx: 0.046, ry: 0.048, ref: up },
      { p: toward(S, E, 0.10), rx: 0.053, ry: 0.052, ref: up }, { p: toward(S, E, 0.55), rx: 0.049, ry: 0.047, ref: up },
      { p: E, rx: 0.046, ry: 0.044, ref: up }, { p: toward(E, W, 0.33), rx: 0.046, ry: 0.043, ref: up },
      { p: toward(E, W, 0.80), rx: 0.037, ry: 0.035, ref: up }, { p: toward(E, W, 0.97), rx: 0.033, ry: 0.032, ref: up },
    ], { 0: M.knit, 1: M.knitRib }, { segs: 10, step: 0.06, caps: ["round", "flat"], keyOf: u => (u > 0.93 ? 1 : 0) });
    hand(g, `hand_${sid}`, toward(E, W, 0.985), arm.dir ?? W.map((v, i) => v - E[i]), arm.palm, side, arm.curl ?? 0.3);
  }
  const neckTop = T([0.008, 0, B.neckBase + 0.046]);
  tube(g, "neck", [
    { p: T([-0.014, 0, 1.43]), rx: 0.058, ry: 0.064, ref: fwd }, { p: T([-0.012, 0, 1.47]), rx: 0.057, ry: 0.061, ref: fwd },
    { p: neckTop, rx: 0.052, ry: 0.056, ref: fwd },
  ], M.skin, { segs: 12, step: 0.03, caps: ["flat", "round"] });
  head(g, neckTop, pose.headYaw + pose.twist, pose.headPitch + pose.lean);
}

const POSES = {
  /** Standing at ease: arms hanging, looking ahead. */
  person: {
    lean: 0.0, twist: 0.0, headYaw: 0.0, headPitch: 0.04,
    feet: { r: [-0.01, -0.12, -0.08], l: [0.01, 0.12, 0.08] },
    arms: {
      r: { wrist: [0.03, -0.235, 0.84], pole: [-1, -0.3, 0.0], palm: [0, 1, 0], curl: 0.4, dir: [0.05, 0, -1] },
      l: { wrist: [0.03, 0.235, 0.84], pole: [-1, 0.3, 0.0], palm: [0, -1, 0], curl: 0.4, dir: [0.05, 0, -1] },
    },
  },
  /** Handling something before his hips: both forearms forward and down,
   * the hands a quarter metre ahead at 0.97 m, looking at them. */
  person_reach: {
    lean: 0.05, twist: 0.0, headYaw: 0.0, headPitch: 0.16,
    feet: { r: [0.0, -0.12, -0.10], l: [0.03, 0.12, 0.10] },
    arms: {
      r: { wrist: [0.24, -0.185, 0.97], pole: [-0.6, -0.4, -1.0], palm: [0, 1, -0.2], curl: 0.5 },
      l: { wrist: [0.23, 0.19, 0.99], pole: [-0.6, 0.4, -1.0], palm: [0, -1, -0.2], curl: 0.5 },
    },
  },
  /** Reaching with his right hand into a bin at chest height half a metre
   * ahead, the left hand forward, leaning in. */
  person_pick: {
    lean: 0.13, twist: -0.12, headYaw: 0.05, headPitch: 0.12, knee: 0.02,
    feet: { r: [-0.02, -0.11, -0.12], l: [0.12, 0.115, 0.15] },
    arms: {
      r: { wrist: [0.52, -0.10, 1.24], pole: [-0.2, -0.6, -1.0], palm: [0, 0.35, -1], curl: 0.15 },
      l: { wrist: [0.30, 0.205, 1.03], pole: [-0.4, 0.6, -1.0], palm: [-0.2, -1, -0.3], curl: 0.45 },
    },
  },
};
export const PEOPLE = Object.freeze(Object.keys(POSES));

/** The posture `name` drawn into `g` as a flat list of meshes. */
export function buildPerson(g, name) {
  const body = new THREE.Group();
  person(body, POSES[name]);
  for (const mesh of flatten(body)) g.add(mesh);
}
