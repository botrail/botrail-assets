/**
 * biw-sedan: a body-in-white shell, surfaced from section curves.
 *
 * Plain ES module on purpose: the Node exporter and the browser viewer import
 * this same file, so what you shape in the viewport is what gets exported.
 * No build step.
 *
 * The body is built the way a real one is drawn — a cross-section curve that
 * varies along the car, lofted into panels — rather than as flat plates. That
 * is what gives it compound curvature: crown in the lower side, a character
 * line at the shoulder, tumblehome above the beltline, and a roof that crowns
 * in both directions.
 *
 * It is a BIW, so the closures are absent by definition: the engine bay and
 * boot are open apertures ringed by their surrounding panels, not filled by a
 * bonnet and bootlid.
 *
 * Coordinates: X = fore/aft (+X forward), Y = lateral, Z = up. Origin is the
 * vehicle centreline at the floor-pan datum (the fixture's locating point).
 * Metres.
 */
import * as THREE from "three";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";

// ------------------------------------------------------------- KEY DIMENSIONS
export const NOSE = 2.05;
export const TAIL = -2.05;
export const HALF_W = 0.87; // widest half width, at the shoulder
export const AXLE_F = 1.30;
export const AXLE_R = -1.30;
export const ARCH_R = 0.40;
export const ARCH_Z = 0.30; // wheel centre height

const Z_UNDER = 0.11; // underbody
const Z_SILL = 0.36; // rocker top = door aperture bottom
const Z_BELT = 0.80; // beltline (shoulder / character line)
const Z_ROOF = 1.30; // roof rail top over the cabin
const Z_FLOOR = 0.17;

const A_PILLAR = 0.95; // base of the windscreen pillar
const B_PILLAR = 0.04;
const C_PILLAR = -0.90;
const COWL_X = 1.44; // windscreen base
const DECK_X = -1.42; // backlight base

export const MASS_KG = 300;
const SKIN_COLOR = 0xb9c0c9;
const STRUCTURE_COLOR = 0x8d939b;
const FLANGE = 0.055; // how far an aperture flange turns inward

// --------------------------------------------------------------------- CURVES
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smooth = (t) => {
  const s = clamp01(t);
  return s * s * (3 - 2 * s);
};
const lerp = (a, b, t) => a + (b - a) * t;

/** Top of the body side: roof rail over the cabin, falling to bonnet and deck. */
export function topZ(x) {
  if (x >= C_PILLAR && x <= A_PILLAR) return Z_ROOF;
  if (x > A_PILLAR) {
    // windscreen rake down to the bonnet line, then flat to the nose
    const t = smooth((x - A_PILLAR) / (COWL_X - A_PILLAR));
    return Math.max(0.92, lerp(Z_ROOF, 0.99, t));
  }
  const t = smooth((C_PILLAR - x) / (C_PILLAR - DECK_X));
  return Math.max(0.94, lerp(Z_ROOF, 1.02, t));
}

/** Plan-view half width at station x — the body narrows toward both ends. */
function planWidth(x) {
  const flat = 1.15;
  if (Math.abs(x) <= flat) return 1;
  const t = smooth((Math.abs(x) - flat) / (2.1 - flat));
  return 1 - 0.20 * t;
}

/**
 * Body-side cross-section at station x, parametrised t = 0 (underbody) to
 * t = 1 (roof edge). Returns [y, z] for the right-hand side.
 *
 * The shape, bottom to top: rocker tuck-under, a lower side that crowns
 * outward, a character line at the shoulder, then tumblehome leaning in to
 * the roof edge.
 */
export function sideSection(x, t) {
  const w = HALF_W * planWidth(x);
  const zTop = topZ(x);
  const s = clamp01(t);

  if (s < 0.14) {
    // underbody tucking out to the rocker
    const u = smooth(s / 0.14);
    return [lerp(w * 0.74, w * 0.955, u), lerp(Z_UNDER, Z_SILL, u)];
  }
  if (s < 0.60) {
    // lower side: crowns outward toward the shoulder
    const u = (s - 0.14) / 0.46;
    const crown = Math.sin(u * Math.PI) * 0.012;
    return [w * (0.955 + 0.045 * smooth(u)) + crown, lerp(Z_SILL, Z_BELT, u)];
  }
  if (s < 0.66) {
    // character line: a shallow crease running the length of the body
    const u = (s - 0.60) / 0.06;
    return [w * (1 - 0.028 * Math.sin(u * Math.PI)), lerp(Z_BELT, Z_BELT + 0.05, u)];
  }
  // greenhouse: tumblehome leaning in to the roof edge
  const u = smooth((s - 0.66) / 0.34);
  return [lerp(w, w - 0.115, u), lerp(Z_BELT + 0.05, zTop, u)];
}

// ------------------------------------------------------------------ APERTURES
const DOORS = [
  { x0: 0.10, x1: 0.88, z0: Z_SILL, z1: 1.20 },
  { x0: -0.82, x1: -0.02, z0: Z_SILL, z1: 1.20 },
];

function archOf(x, z) {
  for (const cx of [AXLE_F, AXLE_R]) {
    if (Math.hypot(x - cx, z - ARCH_Z) <= ARCH_R) return cx;
  }
  return null;
}

function inDoor(x, z) {
  return DOORS.some((d) => x >= d.x0 && x <= d.x1 && z >= d.z0 && z <= d.z1);
}

// Raked pillar centrelines. Above the beltline the body side is *mostly air* —
// only the pillars and the roof rail survive, which is what stops the ends
// reading as solid slabs and opens the windscreen and backlight.
const GREENHOUSE_Z0 = Z_BELT + 0.06;
const RAIL_Z0 = 1.20;
const pillarX = (base, top) => (z) =>
  lerp(base, top, clamp01((z - GREENHOUSE_Z0) / (RAIL_Z0 - GREENHOUSE_Z0)));
const A_AT = pillarX(A_PILLAR + 0.02, COWL_X - 0.10);
const C_AT = pillarX(C_PILLAR - 0.02, DECK_X + 0.12);

function inPillar(x, z) {
  return Math.abs(x - A_AT(z)) <= 0.075 || Math.abs(x - C_AT(z)) <= 0.085;
}

// The outer panel stops at the shoulder. Above it the body is pillars and a
// roof rail, which are swept as members — a raked pillar carved out of a
// rectangular grid staircases, and no amount of grid density hides it.
const isAperture = (x, z) => {
  if (archOf(x, z) !== null) return true;
  if (inDoor(x, z)) return true;
  return z > GREENHOUSE_Z0;
};

// ----------------------------------------------------------------- MESH UTILS
class Surface {
  constructor() {
    this.position = [];
    this.index = [];
  }
  vertex(x, y, z) {
    this.position.push(x, y, z);
    return this.position.length / 3 - 1;
  }
  quad(a, b, c, d, flip = false) {
    if (flip) this.index.push(a, c, b, a, d, c);
    else this.index.push(a, b, c, a, c, d);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.position, 3));
    g.setIndex(this.index);
    g.computeVertexNormals();
    return g;
  }
}

function hull(points) {
  return new ConvexGeometry(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
}

export function mergeGeometries(geometries) {
  const position = [];
  const index = [];
  let offset = 0;
  for (const g of geometries) {
    const pos = g.getAttribute("position");
    for (let i = 0; i < pos.count; i++) position.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    const gi = g.getIndex();
    if (gi) for (let i = 0; i < gi.count; i++) index.push(gi.getX(i) + offset);
    else for (let i = 0; i < pos.count; i++) index.push(i + offset);
    offset += pos.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  out.setIndex(index);
  out.computeVertexNormals();
  return out;
}

/** Grid with the given break lines forced in, so cut edges land on them. */
function gridWith(min, max, count, breaks = []) {
  const set = new Set();
  for (let i = 0; i <= count; i++) set.add(min + ((max - min) * i) / count);
  for (const b of breaks) if (b > min && b < max) set.add(b);
  return [...set].sort((a, b) => a - b);
}

// ------------------------------------------------------------------ BODY SIDE
const SIDE_X = gridWith(TAIL, NOSE, 132, [
  ...DOORS.flatMap((d) => [d.x0, d.x1]),
  A_PILLAR, B_PILLAR, C_PILLAR, COWL_X, DECK_X,
  AXLE_F - ARCH_R, AXLE_F + ARCH_R, AXLE_R - ARCH_R, AXLE_R + ARCH_R,
]);
const SIDE_T = gridWith(0, 1, 34);

/** Section point, with arch-interior points pushed out onto the arc. */
function sidePoint(sy, x, t) {
  let [y, z] = sideSection(x, t);
  const cx = archOf(x, z);
  if (cx !== null) {
    const dx = x - cx;
    const dz = z - ARCH_Z;
    const d = Math.hypot(dx, dz) || 1e-9;
    x = cx + (dx / d) * ARCH_R;
    z = ARCH_Z + (dz / d) * ARCH_R;
    y = sideSection(x, t)[0];
  }
  return [x, sy * y, z];
}

/**
 * One side of the outer body. Aperture cells are dropped, and every aperture
 * edge gets a flange turned inward — that is what makes an opening read as
 * stamped sheet metal rather than a hole cut in paper.
 */
export function bodySide(sy) {
  const s = new Surface();
  const ids = new Map();
  const key = (i, k) => i * 1000 + k;
  const vid = (i, k) => {
    if (!ids.has(key(i, k))) {
      const [x, y, z] = sidePoint(sy, SIDE_X[i], SIDE_T[k]);
      ids.set(key(i, k), s.vertex(x, y, z));
    }
    return ids.get(key(i, k));
  };
  const cellOpen = (i, k) => {
    const x = (SIDE_X[i] + SIDE_X[i + 1]) / 2;
    const [, z] = sideSection(x, (SIDE_T[k] + SIDE_T[k + 1]) / 2);
    return !isAperture(x, z) && z <= topZ(x) + 1e-9;
  };

  for (let i = 0; i < SIDE_X.length - 1; i++) {
    for (let k = 0; k < SIDE_T.length - 1; k++) {
      if (!cellOpen(i, k)) continue;
      s.quad(vid(i, k), vid(i + 1, k), vid(i + 1, k + 1), vid(i, k + 1), sy < 0);
    }
  }

  // flanges: wherever an open cell abuts a closed one, turn the edge inward
  const inward = (i, k) => {
    const [x, y, z] = sidePoint(sy, SIDE_X[i], SIDE_T[k]);
    return [x, y - sy * FLANGE, z];
  };
  const addFlange = (i0, k0, i1, k1, flip) => {
    const a = vid(i0, k0);
    const b = vid(i1, k1);
    const c = s.vertex(...inward(i1, k1));
    const d = s.vertex(...inward(i0, k0));
    s.quad(a, b, c, d, flip);
  };
  for (let i = 0; i < SIDE_X.length - 1; i++) {
    for (let k = 0; k < SIDE_T.length - 1; k++) {
      if (!cellOpen(i, k)) continue;
      if (k + 1 >= SIDE_T.length - 1 || !cellOpen(i, k + 1)) addFlange(i, k + 1, i + 1, k + 1, sy > 0);
      if (k === 0 || !cellOpen(i, k - 1)) addFlange(i, k, i + 1, k, sy < 0);
      if (i === 0 || !cellOpen(i - 1, k)) addFlange(i, k, i, k + 1, sy > 0);
      if (i + 1 >= SIDE_X.length - 1 || !cellOpen(i + 1, k)) addFlange(i + 1, k, i + 1, k + 1, sy < 0);
    }
  }
  return s.geometry();
}

/**
 * Swept member with a rounded rectangular section, riding on the body surface.
 * Used for the pillars and the roof rail, where a clean raked edge matters more
 * than surface continuity with the panel.
 */
function sweptMember(sy, path, section, seg = 8) {
  const s = new Surface();
  const rings = path.map(([px, pz], i) => {
    const prev = path[Math.max(i - 1, 0)];
    const next = path[Math.min(i + 1, path.length - 1)];
    let dx = next[0] - prev[0];
    let dz = next[1] - prev[1];
    const n = Math.hypot(dx, dz) || 1;
    dx /= n;
    dz /= n;
    const surfaceY = sideSection(px, sectionTFor(px, pz))[0];
    const [w, h] = section[i];
    const pts = [];
    for (let q = 0; q < 4; q++) {
      for (let j = 0; j < seg; j++) {
        const a = (q * Math.PI) / 2 + ((Math.PI / 2) * j) / seg;
        const r = (0.3 * Math.min(w, h)) / 2;
        const cx = w / 2 - r;
        const cy = h / 2 - r;
        const ox = [cx, -cx, -cx, cx][q];
        const oy = [cy, cy, -cy, -cy][q];
        const u = ox + r * Math.cos(a);
        const v = oy + r * Math.sin(a);
        pts.push([px + v * -dz, sy * (surfaceY - 0.03) + u, pz + v * dx]);
      }
    }
    return pts.map((pt) => s.vertex(...pt));
  });
  const n = rings[0].length;
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < n; j++) {
      const k = (j + 1) % n;
      s.quad(rings[i][j], rings[i + 1][j], rings[i + 1][k], rings[i][k], sy < 0);
    }
  }
  return s.geometry();
}

/**
 * Wheel-arch lip: a slim member swept round the arc, sitting proud of the
 * panel. Real bodies have one, and it also covers the ragged edge a circular
 * aperture leaves on a rectangular grid.
 */
function archLip(sy, cx) {
  const path = [];
  for (let i = 0; i <= 16; i++) {
    const a = ((170 - (170 - 10) * (i / 16)) * Math.PI) / 180;
    path.push([cx + ARCH_R * Math.cos(a), ARCH_Z + ARCH_R * Math.sin(a)]);
  }
  return sweptMember(sy, path, path.map(() => [0.075, 0.055]));
}

/** A / B / C pillars and the roof rail, per side. */
function greenhouse(sy) {
  const out = [];
  const zTop = RAIL_Z0;
  const tag = sy > 0 ? "l" : "r";
  out.push({ name: `front_arch_${tag}`, geometry: archLip(sy, AXLE_F) });
  out.push({ name: `rear_arch_${tag}`, geometry: archLip(sy, AXLE_R) });
  out.push({
    name: `a_pillar_${sy > 0 ? "l" : "r"}`,
    geometry: sweptMember(sy, [[A_AT(GREENHOUSE_Z0), Z_BELT - 0.10], [A_AT(zTop), zTop + 0.06]],
      [[0.105, 0.11], [0.085, 0.10]]),
  });
  out.push({
    name: `b_pillar_${sy > 0 ? "l" : "r"}`,
    geometry: sweptMember(sy, [[B_PILLAR, Z_SILL - 0.04], [B_PILLAR, zTop + 0.06]],
      [[0.125, 0.10], [0.095, 0.09]]),
  });
  out.push({
    name: `c_pillar_${sy > 0 ? "l" : "r"}`,
    geometry: sweptMember(sy, [[C_AT(GREENHOUSE_Z0), Z_BELT - 0.10], [C_AT(zTop), zTop + 0.06]],
      [[0.115, 0.12], [0.095, 0.10]]),
  });
  out.push({
    name: `roof_rail_${sy > 0 ? "l" : "r"}`,
    geometry: sweptMember(sy,
      [[C_AT(zTop) - 0.04, zTop + 0.055], [0, zTop + 0.06], [A_AT(zTop) + 0.04, zTop + 0.055]],
      [[0.09, 0.10], [0.09, 0.10], [0.09, 0.10]]),
  });
  return out;
}

// ----------------------------------------------------------------------- ROOF
/** Roof panel, crowned across the car and arched along it. */
export function roofPanel(nx = 44, ny = 26) {
  const s = new Surface();
  const x0 = C_AT(RAIL_Z0) - 0.02;
  const x1 = A_AT(RAIL_Z0) + 0.02;
  const at = (i, j) => {
    const x = lerp(x0, x1, i / nx);
    const w = sideSection(x, sectionTFor(x, RAIL_Z0))[0] - 0.05;
    const u = j / ny;
    const y = lerp(-w, w, u);
    const across = 1 - (2 * u - 1) ** 2;
    const along = 1 - 0.3 * ((2 * (i / nx) - 1) ** 2);
    return [x, y, RAIL_Z0 + 0.035 + 0.05 * across * along];
  };
  const ids = [];
  for (let i = 0; i <= nx; i++) {
    ids.push([]);
    for (let j = 0; j <= ny; j++) ids[i].push(s.vertex(...at(i, j)));
  }
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) s.quad(ids[i][j], ids[i + 1][j], ids[i + 1][j + 1], ids[i][j + 1]);
  }
  return s.geometry();
}

/** A panel spanning the car at a station, e.g. cowl, rear panel, floor. */
function crossPanel(x0, x1, z0, z1, widthAt, nx = 8, nz = 4) {
  const s = new Surface();
  const at = (i, k) => {
    const x = lerp(x0, x1, i / nx);
    const z = lerp(z0, z1, k / nz);
    return widthAt(x, z);
  };
  const ids = [];
  for (let i = 0; i <= nx; i++) {
    ids.push([]);
    for (let k = 0; k <= nz; k++) {
      const w = at(i, k);
      const x = lerp(x0, x1, i / nx);
      const z = lerp(z0, z1, k / nz);
      ids[i].push([s.vertex(x, -w, z), s.vertex(x, w, z)]);
    }
  }
  for (let i = 0; i < nx; i++) {
    for (let k = 0; k < nz; k++) {
      s.quad(ids[i][k][0], ids[i + 1][k][0], ids[i + 1][k + 1][1], ids[i][k + 1][1]);
      s.quad(ids[i][k][1], ids[i][k + 1][1], ids[i + 1][k + 1][0], ids[i + 1][k][0]);
    }
  }
  return s.geometry();
}

/** Horizontal panel (floor, parcel shelf, bonnet ledge) between two stations. */
function deckPanel(x0, x1, zAt, widthAt, nx = 16, ny = 10) {
  const s = new Surface();
  const ids = [];
  for (let i = 0; i <= nx; i++) {
    const x = lerp(x0, x1, i / nx);
    const w = widthAt(x);
    ids.push([]);
    for (let j = 0; j <= ny; j++) {
      const y = lerp(-w, w, j / ny);
      ids[i].push(s.vertex(x, y, zAt(x, y)));
    }
  }
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) s.quad(ids[i][j], ids[i + 1][j], ids[i + 1][j + 1], ids[i][j + 1]);
  }
  return s.geometry();
}

const sideWidthAt = (x, z) => sideSection(x, sectionTFor(x, z))[0];

/** Invert the section curve: which t reaches height z at station x. */
function sectionTFor(x, z) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (sideSection(x, mid)[1] < z) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------------- BUILD
/** Every panel of the shell, named. Visual and collision both come from these. */
export function buildPanels() {
  const panels = [];
  const add = (name, geometry) => panels.push({ name, geometry });

  add("body_side_l", bodySide(1));
  add("body_side_r", bodySide(-1));
  for (const sy of [1, -1]) for (const m of greenhouse(sy)) add(m.name, m.geometry);
  add("roof", roofPanel());

  // floor pan and tunnel — visible through the door apertures
  add("floor_pan", deckPanel(DECK_X, COWL_X - 0.1, (x, y) =>
    Z_FLOOR + (Math.abs(y) < 0.17 ? 0.19 * (1 - (Math.abs(y) / 0.17) ** 2) : 0),
    (x) => sideWidthAt(x, Z_FLOOR) - 0.04, 26, 16));

  // cowl (windscreen base) and rear deck (backlight base)
  add("cowl", crossPanel(COWL_X - 0.14, COWL_X, 0.86, 1.0,
    (x, z) => sideWidthAt(x, z) - 0.03));
  add("parcel_shelf", crossPanel(DECK_X, DECK_X + 0.16, 0.86, 0.98,
    (x, z) => sideWidthAt(x, z) - 0.03));

  // engine bay and boot are open on a BIW: only their surrounding panels exist
  add("rad_support", crossPanel(NOSE - 0.09, NOSE - 0.01, 0.30, 0.86,
    (x, z) => sideWidthAt(x, z) - 0.06));
  add("rear_panel", crossPanel(TAIL + 0.01, TAIL + 0.09, 0.28, 0.88,
    (x, z) => sideWidthAt(x, z) - 0.06));
  add("dash", crossPanel(COWL_X - 0.2, COWL_X - 0.12, Z_FLOOR, 0.9,
    (x, z) => sideWidthAt(x, z) - 0.05));
  add("rear_bulkhead", crossPanel(DECK_X + 0.16, DECK_X + 0.24, Z_FLOOR, 0.84,
    (x, z) => sideWidthAt(x, z) - 0.05));

  // header rails close the windscreen and backlight openings at the top
  add("header_front", crossPanel(A_PILLAR - 0.02, A_PILLAR + 0.08, 1.18, Z_ROOF,
    (x, z) => sideWidthAt(x, z) - 0.02));
  add("header_rear", crossPanel(C_PILLAR - 0.08, C_PILLAR + 0.02, 1.16, Z_ROOF,
    (x, z) => sideWidthAt(x, z) - 0.02));
  return panels;
}

// ------------------------------------------------------------------ COLLISION
/**
 * Convex proxy for the shell: each panel is sliced along X into convex slabs.
 * A slab is only emitted where the panel actually has surface, so the door
 * apertures, wheel arches, windscreen and boot stay open — which is the whole
 * reason this is authored rather than decomposed.
 */
export function buildPieces(panels = buildPanels()) {
  const pieces = [];
  for (const panel of panels) {
    const pos = panel.geometry.getAttribute("position");
    const bounds = new THREE.Box3().setFromBufferAttribute(pos);
    const span = bounds.max.x - bounds.min.x;
    const slices = Math.max(1, Math.min(6, Math.round(span / 0.85)));
    const buckets = Array.from({ length: slices }, () => []);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const k = Math.min(slices - 1, Math.floor(((x - bounds.min.x) / (span || 1)) * slices));
      buckets[k].push([x, pos.getY(i), pos.getZ(i)]);
    }
    buckets.forEach((pts, k) => {
      if (pts.length < 8) return;
      // a hull of a whole side panel would swallow the apertures, so split the
      // side panels vertically too
      const groups = panel.name.startsWith("body_side") ? splitByHeight(pts, 3) : [pts];
      groups.forEach((group, g) => {
        if (group.length < 8) return;
        try {
          pieces.push({
            name: `${panel.name}_${k + 1}${groups.length > 1 ? `_${g + 1}` : ""}`,
            geometry: hull(group),
          });
        } catch {
          /* degenerate slab (all points coplanar) — nothing to collide with */
        }
      });
    });
  }
  return pieces;
}

function splitByHeight(points, bands) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of points) {
    lo = Math.min(lo, p[2]);
    hi = Math.max(hi, p[2]);
  }
  const out = Array.from({ length: bands }, () => []);
  for (const p of points) {
    const k = Math.min(bands - 1, Math.floor(((p[2] - lo) / (hi - lo || 1)) * bands));
    out[k].push(p);
  }
  return out;
}

// --------------------------------------------------------------------- VISUAL
export function buildVisualMeshes(panels = buildPanels()) {
  const skin = new THREE.Mesh(
    mergeGeometries(panels.map((p) => p.geometry)),
    new THREE.MeshStandardMaterial({
      color: SKIN_COLOR,
      metalness: 0.35,
      roughness: 0.45,
      side: THREE.DoubleSide,
    }),
  );
  skin.name = "biw_shell";
  return { skin };
}

export { STRUCTURE_COLOR };
