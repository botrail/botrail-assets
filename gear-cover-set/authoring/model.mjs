/** GH-160: the gear housing and its cover of botrail's assembly demo — the
 * pack `botrail/workpiece/gear-cover-set`. Design values, not a drawing of
 * any product: the housing 160 x 120 x 60 with six M5 threads and two dowels
 * on its top flange, the 10 mm cover with its clearance holes and a
 * 45 x 30 bearing boss. Metres, Z-up.
 *
 * Frames follow the generator's obstacles: the housing is authored about
 * its block's centre (z in [-0.030, 0.030]); the cover about the centre of
 * its underside (z in [0, 0.040]) — the mesh the cover's collision is.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { namedMaterial, addMesh, roundedRectangle, ellipseHole, cylinderZ } from "@botrail/authoring/geometry.mjs";

export const DIM = Object.freeze({
  housing: [0.160, 0.120, 0.060], cover: [0.160, 0.120, 0.010], boss: [0.045, 0.030],
  holes: [[-0.060, -0.045], [0.060, -0.045], [0.060, 0.045], [-0.060, 0.045], [0, 0.045], [0, -0.045]],
  dowels: [[-0.060, 0], [0.060, 0]],
  thread: 0.005, threadDepth: 0.013, clearance: 0.0055, dowelHole: 0.0061, dowelSeat: 0.006,
  flange: 0.008, corner: 0.008, opening: [0.100, 0.060],
});
const linear = (r, g, b) => new THREE.Color(r, g, b);
export const MATERIALS = Object.freeze({
  cast: namedMaterial("cast_aluminium", linear(.38, .41, .44), .85, .52),
  machined: namedMaterial("machined_aluminium", linear(.64, .67, .70), .85, .29),
  bore: namedMaterial("bore", linear(.06, .07, .08), .6, .6),
});

function plate(g, name, w, d, t, z, r, holes, m, opening) {
  const s = roundedRectangle(w, d, r);
  for (const [x, y, hole] of holes) ellipseHole(s, x, y, hole / 2);
  if (opening) s.holes.push(roundedRectangle(opening[0], opening[1], 0.006));
  return addMesh(g, name, new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 12 }), m, [0, 0, z]);
}
const box = (g, n, size, at, m) => addMesh(g, n, new THREE.BoxGeometry(...size), m, at);
/** A blind bore: its wall seen from inside and its floor, both dark. */
function bore(g, name, x, y, radius, top, depth) {
  const wall = cylinderZ(radius, depth, { radial: 24, open: true });
  wall.setIndex(Array.from(wall.index.array).reverse());   // faces turned inward: seen from inside the bore
  addMesh(g, `${name}_wall`, wall, MATERIALS.bore, [x, y, top - depth / 2]);
  const floor = new THREE.CircleGeometry(radius, 24); addMesh(g, `${name}_floor`, floor, MATERIALS.bore, [x, y, top - depth]);
}

export function buildHousing() {
  const g = new THREE.Group(); g.name = "housing";
  const [w, d, h] = DIM.housing, f = DIM.flange, c = DIM.corner;
  const { cast } = MATERIALS;
  plate(g, "bottom_flange", w, d, f, -h / 2, c, [], cast);
  plate(g, "top_flange", w, d, f, h / 2 - f, c,
    [...DIM.holes.map(([x, y]) => [x, y, DIM.thread]), ...DIM.dowels.map(([x, y]) => [x, y, DIM.dowelSeat])], cast, DIM.opening);
  const wallH = h - 2 * f;
  for (const sy of [-1, 1]) box(g, `long_wall_${sy}`, [w - 0.018, 0.014, wallH], [0, sy * (d / 2 - 0.007), 0], cast);
  for (const sx of [-1, 1]) box(g, `end_wall_${sx}`, [0.018, d - 0.016, wallH], [sx * (w / 2 - 0.009), 0, 0], cast);
  // Cooling ribs on the long faces, as on a casting.
  for (const x of [-w * 0.3125, -w * 0.15625, 0, w * 0.15625, w * 0.3125])
    for (const sy of [-1, 1]) box(g, `rib_${sy}_${x.toFixed(3)}`, [0.004, 0.007, h - 0.020], [x, sy * (d / 2 - 0.0035), -0.002], cast);
  DIM.holes.forEach(([x, y], i) => bore(g, `thread_${i}`, x, y, DIM.thread / 2, h / 2, DIM.threadDepth));
  return g;
}

export function buildCover() {
  const g = new THREE.Group(); g.name = "cover";
  const [w, d, t] = DIM.cover, [bd, bh] = DIM.boss;
  const { machined } = MATERIALS;
  plate(g, "plate", w, d, t, 0, DIM.corner,
    [...DIM.holes.map(([x, y]) => [x, y, DIM.clearance]), ...DIM.dowels.map(([x, y]) => [x, y, DIM.dowelHole])], machined);
  addMesh(g, "boss_fillet", cylinderZ(bd / 2 + 0.004, 0.003, { radial: 64 }), machined, [0, 0, t + 0.0015]);
  addMesh(g, "boss", cylinderZ(bd / 2, bh - 0.001, { radial: 64 }), machined, [0, 0, t + (bh - 0.001) / 2]);
  addMesh(g, "boss_chamfer", cylinderZ(bd / 2 - 0.0008, 0.001, { radial: 64 }), machined, [0, 0, t + bh - 0.0005]);
  return g;
}

/** One renderable mesh per part — botrail binds a single gprim to an
 * obstacle — with the pieces' finishes kept as material groups. */
export function mergePart(group) {
  group.updateMatrixWorld(true);
  const geometry = mergeGeometries(group.children.map(child => {
    const geo = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
    return geo.applyMatrix4(child.matrixWorld);
  }), true);
  const merged = new THREE.Mesh(geometry, group.children.map(child => child.material));
  merged.name = group.name;
  return merged;
}
