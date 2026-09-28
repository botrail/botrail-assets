/** MISUMI HFS6-3030 — the 30 mm square T-slot profile of the 6 series (slot
 * width 8 mm) — as the catalog's frame-system pack draws its members.
 *
 * Authored from the maker's published section drawing, not from the maker's
 * CAD: the outline a user has to mate to (30 x 30, R2 corners, an 8 mm slot
 * in each face under a 2 mm lip, the chamber 16.5 wide under the lip
 * narrowing to the 12 mm core 9 mm in, a φ6.8 bore in the core, four φ4.2
 * corner holes on a 23.2 mm pitch). The sloping chamber walls are read off
 * the drawing's proportions and are approximate; nothing here is a
 * dimension to machine to.
 *
 * Metres, Z-up. The section is centred on the origin and the member runs
 * one metre along Z (z in [-0.5, 0.5]): the consumer keeps x and y as they
 * are, scales z to the cut length and turns the member along its axis.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { namedMaterial, addMesh, ellipseHole } from "@botrail/authoring/geometry.mjs";

export const DIM = Object.freeze({
  side: 0.030, corner: 0.002, opening: 0.008, lip: 0.002, chamber: 0.0165, depth: 0.009,
  core: 0.012, bore: 0.0068, cornerHole: 0.0042, cornerPitch: 0.0232, length: 1.0,
});

const linear = (r, g, b) => new THREE.Color(r, g, b);
export const MATERIALS = Object.freeze({
  // Clear anodising. The consumer tints the member for a black finish.
  anodised: namedMaterial("anodised_aluminium", linear(.72, .74, .76), .8, .45),
});

/** The section as a Shape: the outline counter-clockwise with one T-slot per
 * face, the core bore and the four corner holes as real holes. */
export function sectionShape() {
  const h = DIM.side / 2, r = DIM.corner, o = DIM.opening / 2, c = DIM.chamber / 2, k = DIM.core / 2;
  const lipY = h - DIM.lip, floorY = h - DIM.depth;
  // The +Y face, right to left: lip, neck, chamber ceiling, sloping wall,
  // the core's side as the floor, and back out. The other faces are this
  // turned by 90 degrees, so the whole outline runs counter-clockwise.
  const face = [[h - r, h], [o, h], [o, lipY], [c, lipY], [k, floorY],
    [-k, floorY], [-c, lipY], [-o, lipY], [-o, h], [-(h - r), h]];
  const turn = ([x, y]) => [-y, x];
  const rot = (p, n) => n === 0 ? p : rot(turn(p), n - 1);
  const s = new THREE.Shape();
  for (let f = 0; f < 4; f++) {
    const pts = face.map(p => rot(p, f));
    pts.forEach(([x, y], i) => (f === 0 && i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
    const [cx, cy] = rot([-h, h], f);             // this face's far corner, rounded R2
    const [nx, ny] = rot(face[0], (f + 1) % 4);    // where the next face starts
    s.quadraticCurveTo(cx, cy, nx, ny);
  }
  s.closePath();
  ellipseHole(s, 0, 0, DIM.bore / 2);
  const p = DIM.cornerPitch / 2;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) ellipseHole(s, sx * p, sy * p, DIM.cornerHole / 2);
  return s;
}

/** One metre of profile, centred: a group of one finished mesh. */
export function buildProfile() {
  const g = new THREE.Group(); g.name = "profile_3030";
  const geometry = new THREE.ExtrudeGeometry(sectionShape(), { depth: DIM.length, bevelEnabled: false, curveSegments: 8 });
  addMesh(g, "extrusion", geometry, MATERIALS.anodised, [0, 0, -DIM.length / 2]);
  return g;
}

/** One renderable mesh — botrail binds a single gprim to an obstacle — with
 * the pieces' finishes kept as material groups. */
export function mergeProfile(group) {
  group.updateMatrixWorld(true);
  const geometry = mergeGeometries(group.children.map(child => {
    const geo = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
    return geo.applyMatrix4(child.matrixWorld);
  }), true);
  const merged = new THREE.Mesh(geometry, group.children.map(child => child.material));
  merged.name = group.name;
  return merged;
}
