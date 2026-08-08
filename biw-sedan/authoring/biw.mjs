/**
 * biw-sedan geometry, authored in Three.js.
 *
 * Plain ES module on purpose: the Node exporter and the browser viewer import
 * the same file, so what you shape in the viewport is exactly what gets
 * exported. No build step.
 *
 * Coordinates: X = fore/aft (+X forward), Y = lateral, Z = up. Origin is the
 * vehicle centreline at the floor-pan datum (the fixture's locating point).
 * Metres.
 */
import * as THREE from "three";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";

// ------------------------------------------------------------------ GEOMETRY
export const LENGTH = 4.2;
export const WIDTH = 1.74;
export const HEIGHT = 1.42;
export const SIDE_Y = 0.82;
export const FLOOR_Z = 0.15;
export const AXLE_F = 1.3;
export const AXLE_R = -1.3;
export const ARCH_R = 0.4;
export const BELTLINE_Z = 0.78;
export const TUMBLEHOME = 0.085;
export const MASS_KG = 300;

const STRUCTURE_COLOR = 0x969ba2;
const SKIN_COLOR = 0xb0b6be;

/** Rounded-rectangle outline in the (side, up) plane of a member's section. */
function roundedRect(width, height, corner = 0.3, seg = 6) {
  const r = (corner * Math.min(width, height)) / 2;
  const cx = width / 2 - r;
  const cy = height / 2 - r;
  const centres = [
    [cx, cy],
    [-cx, cy],
    [-cx, -cy],
    [cx, -cy],
  ];
  const pts = [];
  centres.forEach(([ox, oy], q) => {
    const a0 = (q * Math.PI) / 2;
    for (let i = 0; i < seg; i++) {
      const t = a0 + ((Math.PI / 2) * i) / seg;
      pts.push([ox + r * Math.cos(t), oy + r * Math.sin(t)]);
    }
  });
  return pts;
}

/** Convex hull of a point cloud — every collision piece goes through this. */
function hull(points) {
  return new ConvexGeometry(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
}

/**
 * Tapered rounded-section beam along a polyline in the XZ plane.
 * Returns one convex piece per straight segment, which is exactly the
 * granularity the collision compound wants.
 */
export function member(pathXZ, sections, y = 0, corner = 0.3, seg = 6) {
  const rings = pathXZ.map(([px, pz], i) => {
    const prev = pathXZ[Math.max(i - 1, 0)];
    const next = pathXZ[Math.min(i + 1, pathXZ.length - 1)];
    let dx = next[0] - prev[0];
    let dz = next[1] - prev[1];
    const n = Math.hypot(dx, dz);
    dx /= n;
    dz /= n;
    const [w, h] = sections[i];
    return roundedRect(w, h, corner, seg).map(([u, v]) => [
      px + v * -dz,
      y + u,
      pz + v * dx,
    ]);
  });
  const pieces = [];
  for (let i = 0; i < rings.length - 1; i++) {
    pieces.push(hull([...rings[i], ...rings[i + 1]]));
  }
  return pieces;
}

/** Plate; `crown > 0` bulges the top face (roof). Stays convex either way. */
export function plate(x0, x1, y0, y1, z0, z1, crown = 0) {
  const pts = [];
  const ys = [];
  const steps = crown === 0 ? 2 : 9;
  for (let j = 0; j < steps; j++) ys.push(y0 + ((y1 - y0) * j) / (steps - 1));
  for (const y of ys) {
    const t = crown === 0 ? 0 : crown * (1 - ((y - (y0 + y1) / 2) / ((y1 - y0) / 2)) ** 2);
    for (const x of [x0, x1]) {
      pts.push([x, y, z0]);
      pts.push([x, y, z1 + t]);
    }
  }
  return hull(pts);
}

function arc(cx, cz, radius, a0Deg, a1Deg, steps) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = ((a0Deg + ((a1Deg - a0Deg) * i) / steps) * Math.PI) / 180;
    out.push([cx + radius * Math.cos(t), cz + radius * Math.sin(t)]);
  }
  return out;
}

// -------------------------------------------------------- COLLISION COMPOUND
/** The 49 convex pieces. Each one is a file in the catalog package. */
export function buildPieces() {
  const pieces = [];
  const add = (name, geoms) => {
    const list = Array.isArray(geoms) ? geoms : [geoms];
    list.forEach((g, i) => pieces.push({ name: list.length === 1 ? name : `${name}_${i + 1}`, geometry: g }));
  };

  for (const [tag, sy] of [["l", 1], ["r", -1]]) {
    const y = sy * SIDE_Y;
    add(`rocker_${tag}`, member([[-1.02, 0.23], [1.02, 0.23]], [[0.11, 0.22], [0.11, 0.22]], y));
    add(`a_pillar_${tag}`, member([[0.99, 0.4], [1.45, 1.13]], [[0.1, 0.12], [0.1, 0.12]], y));
    add(`b_pillar_${tag}`, member([[0.06, 0.36], [0.06, 1.18]], [[0.12, 0.11], [0.12, 0.11]], y));
    add(`c_pillar_${tag}`, member([[-0.9, 1.14], [-1.44, 0.62]], [[0.11, 0.13], [0.11, 0.13]], y));
    add(`roof_rail_${tag}`, member([[-1.46, 1.21], [1.46, 1.21]], [[0.1, 0.11], [0.1, 0.11]], y));
    for (const [label, cx] of [["front", AXLE_F], ["rear", AXLE_R]]) {
      const pts = arc(cx, 0.28, ARCH_R, 168, 12, 4);
      add(`${label}_arch_${tag}`, member(pts, pts.map(() => [0.1, 0.1]), y));
    }
    add(`quarter_${tag}`, member([[-1.46, 0.6], [-1.96, 0.62]], [[0.12, 0.36], [0.12, 0.36]], y));
    add(`fender_${tag}`, member([[1.74, 0.62], [2.06, 0.6]], [[0.12, 0.32], [0.12, 0.32]], y));
    add(`front_rail_${tag}`, member([[1.28, 0.24], [2.04, 0.24]], [[0.13, 0.15], [0.13, 0.15]], sy * 0.42));
    add(`rear_rail_${tag}`, member([[-1.28, 0.24], [-2.04, 0.24]], [[0.13, 0.15], [0.13, 0.15]], sy * 0.46));
  }

  add("floor_pan", plate(-1.72, 1.72, -0.78, 0.78, FLOOR_Z - 0.03, FLOOR_Z));
  add("tunnel", plate(-1.26, 1.3, -0.17, 0.17, FLOOR_Z, 0.36));
  add("cross_front", plate(0.92, 1.04, -0.78, 0.78, FLOOR_Z, 0.3));
  add("cross_seat", plate(0.04, 0.16, -0.78, 0.78, FLOOR_Z, 0.28));
  add("cross_rear", plate(-0.94, -0.82, -0.78, 0.78, FLOOR_Z, 0.3));
  add("firewall", plate(1.66, 1.76, -0.78, 0.78, FLOOR_Z, 0.94));
  add("rear_bulkhead", plate(-1.48, -1.38, -0.78, 0.78, FLOOR_Z, 0.8));
  add("cowl", plate(1.52, 1.66, -0.8, 0.8, 0.86, 0.96));
  add("header_front", plate(1.4, 1.52, -0.82, 0.82, 1.14, 1.26));
  add("header_rear", plate(-0.98, -0.86, -0.82, 0.82, 1.1, 1.22));
  add("roof_panel", plate(-1.44, 1.44, -0.84, 0.84, 1.24, 1.32, 0.08));
  add("roof_bow_front", plate(0.5, 0.62, -0.82, 0.82, 1.16, 1.25));
  add("roof_bow_rear", plate(-0.5, -0.38, -0.82, 0.82, 1.16, 1.25));
  add("front_end_panel", plate(2.0, 2.08, -0.62, 0.62, 0.2, 0.62));
  add("rear_end_panel", plate(-2.08, -2.0, -0.66, 0.66, 0.18, 0.62));
  return pieces;
}

// -------------------------------------------------------------- VISUAL SKIN
/** Outer-panel half width: tumblehome above the beltline, taper toward the ends. */
export function skinY(x, z) {
  let half = SIDE_Y + 0.035;
  if (z > BELTLINE_Z) {
    const t = Math.min(1, (z - BELTLINE_Z) / (1.24 - BELTLINE_Z));
    half -= TUMBLEHOME * t * t;
  }
  const flat = 1.3;
  if (Math.abs(x) > flat) {
    const t = Math.min(1, (Math.abs(x) - flat) / (2.06 - flat));
    half -= 0.16 * t * t;
  }
  return half;
}

/** Top of the outer panel: roof rail over the cabin, dropping to fender/deck. */
export function skinTop(x) {
  if (x >= -0.88 && x <= 0.97) return 1.26;
  if (x > 0.97) return Math.max(0.93, 1.26 - ((x - 0.97) * (1.26 - 0.95)) / (1.45 - 0.97));
  return Math.max(0.95, 1.26 - ((-0.88 - x) * (1.26 - 1.0)) / (1.45 - 0.88));
}

// Door-aperture bounds. Used both to test cells and as explicit grid lines, so
// the openings get straight edges instead of a staircase.
const DOORS = [
  { x0: 0.1, x1: 0.96, z0: 0.38, z1: 1.16 },
  { x0: -0.86, x1: 0.02, z0: 0.38, z1: 1.16 },
];

function inArch(x, z) {
  for (const cx of [AXLE_F, AXLE_R]) {
    if (Math.hypot(x - cx, z - 0.28) <= ARCH_R) return cx;
  }
  return null;
}

function isAperture(x, z) {
  for (const d of DOORS) {
    if (x >= d.x0 && x <= d.x1 && z >= d.z0 && z <= d.z1) return true;
  }
  return inArch(x, z) !== null;
}

/** Sorted unique grid, with the given break lines forced in. */
function gridWith(min, max, count, breaks) {
  const out = new Set();
  for (let i = 0; i <= count; i++) out.add(min + ((max - min) * i) / count);
  for (const b of breaks) if (b > min && b < max) out.add(b);
  return [...out].sort((a, b) => a - b);
}

/**
 * One side's outer skin. Aperture cells are not emitted, so the openings are
 * real. Two things keep the edges clean rather than stepped: the grid carries
 * explicit lines at the door bounds, and a vertex that falls inside a wheel
 * arch is pushed radially out onto the arc.
 */
export function bodySkin(sy, nx = 96, nz = 34) {
  const xs = gridWith(-2.02, 2.06, nx, DOORS.flatMap((d) => [d.x0, d.x1]).concat([0.97, -0.88, 1.45, -1.45]));
  const zs = gridWith(0.14, 1.26, nz, DOORS.flatMap((d) => [d.z0, d.z1]));

  const verts = [];
  const idx = [];
  const seen = new Map();
  const vid = (i, k) => {
    const key = i * 10000 + k;
    if (seen.has(key)) return seen.get(key);
    let x = xs[i];
    let z = Math.min(zs[k], skinTop(x)); // clamp to the silhouette, no stair-step
    const cx = inArch(x, z);
    if (cx !== null) {
      // push onto the arc so the wheel opening reads as a curve
      const dx = x - cx;
      const dz = z - 0.28;
      const d = Math.hypot(dx, dz) || 1e-9;
      x = cx + (dx / d) * ARCH_R;
      z = 0.28 + (dz / d) * ARCH_R;
    }
    seen.set(key, verts.length / 3);
    verts.push(x, sy * skinY(x, z), z);
    return seen.get(key);
  };

  for (let i = 0; i < xs.length - 1; i++) {
    for (let k = 0; k < zs.length - 1; k++) {
      const cx = (xs[i] + xs[i + 1]) / 2;
      const cz = (zs[k] + zs[k + 1]) / 2;
      if (isAperture(cx, cz) || cz > skinTop(cx)) continue;
      const a = vid(i, k);
      const b = vid(i + 1, k);
      const c = vid(i + 1, k + 1);
      const d = vid(i, k + 1);
      if (sy > 0) idx.push(a, b, c, a, c, d);
      else idx.push(a, c, b, a, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Crowned roof panel. */
export function roofSkin(nx = 60, ny = 24) {
  const verts = [];
  const idx = [];
  for (let i = 0; i <= nx; i++) {
    const x = -1.46 + (2.92 * i) / nx;
    for (let j = 0; j <= ny; j++) {
      const y = -0.86 + (1.72 * j) / ny;
      const crown = 0.085 * (1 - (y / 0.86) ** 2) * (1 - 0.25 * (x / 1.46) ** 2);
      verts.push(x, y, 1.24 + crown);
    }
  }
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      const a = i * (ny + 1) + j;
      const b = a + (ny + 1);
      idx.push(a, b, b + 1, a, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// --------------------------------------------------------------------- BUILD
/** Meshes for display: structure + outer skin, in their catalog colours. */
export function buildVisualMeshes(pieces = buildPieces()) {
  const structureGeoms = pieces.map((p) => p.geometry);
  const structure = new THREE.Mesh(
    mergeGeometries(structureGeoms),
    new THREE.MeshStandardMaterial({ color: STRUCTURE_COLOR, metalness: 0.25, roughness: 0.7 }),
  );
  structure.name = "biw_structure";
  const skin = new THREE.Mesh(
    mergeGeometries([bodySkin(1), bodySkin(-1), roofSkin()]),
    new THREE.MeshStandardMaterial({
      color: SKIN_COLOR,
      metalness: 0.3,
      roughness: 0.55,
      side: THREE.DoubleSide,
    }),
  );
  skin.name = "biw_skin";
  return { structure, skin };
}

/** Minimal geometry merge (avoids depending on BufferGeometryUtils). */
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
