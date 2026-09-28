/** MISUMI HFS6 — the T-slot profiles of the 6 series (slot width 8 mm) — as
 * the catalog's frame-system pack draws its members: the 30 mm square
 * HFS6-3030, the 30 x 60 HFS6-3060 and the 60 mm square HFS6-6060.
 *
 * Authored from the maker's published section drawings, not from the
 * maker's CAD: the outline a user has to mate to (R2 corners, an 8 mm slot
 * in each face under a 2 mm lip, the chamber 16.5 wide under the lip
 * narrowing to the 12 mm core 9 mm in, a φ6.8 bore behind every slot pair,
 * the φ4.2 corner holes where the drawing has them). The sloping chamber
 * walls and the pockets between the cells of the larger sections are read
 * off the drawings' proportions and are approximate; nothing here is a
 * dimension to machine to.
 *
 * Metres, Z-up. Each section is centred on the origin — x along the side
 * the pack calls `w`, y along `d` — and the member runs one metre along Z
 * (z in [-0.5, 0.5]): the consumer keeps x and y as they are, scales z to
 * the cut length and turns the member along its axis.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { namedMaterial, addMesh, ellipseHole } from "@botrail/authoring/geometry.mjs";

/** The slot and the corner every 6-series profile shares (HFS6-3030's
 * drawing), and the length the members are authored at. */
export const DIM = Object.freeze({
  side: 0.030, corner: 0.002, opening: 0.008, lip: 0.002, chamber: 0.0165, depth: 0.009,
  core: 0.012, bore: 0.0068, cornerHole: 0.0042, cornerPitch: 0.0232, length: 1.0,
});

const p = DIM.cornerPitch / 2;
/** The three sections: the outline (`w` x `d`), where the slots sit in the
 * ±Y faces (x positions) and the ±X faces (y positions), the bores, the
 * corner holes and the pockets hollowed between the cells. Positions in
 * metres from the section's centre. */
export const PROFILES = Object.freeze({
  profile_3030: {
    w: 0.030, d: 0.030, slotsY: [0], slotsX: [0], bores: [[0, 0]],
    cornerHoles: [-1, 1].flatMap(sx => [-1, 1].map(sy => [sx * p, sy * p])), pockets: [],
  },
  profile_3060: {
    // Two 3030 cells one above the other: one slot in each 30 mm face, two
    // in each 60 mm face at ±15, a bore in each cell, the corner holes on
    // the drawing's 23.2 x 53.25 pitch, and the pocket between the cells'
    // walls (2 mm webs to the chambers, wider in the middle where the
    // chambers narrow).
    w: 0.030, d: 0.060, slotsY: [0], slotsX: [-0.015, 0.015], bores: [[0, -0.015], [0, 0.015]],
    cornerHoles: [-1, 1].flatMap(sx => [-1, 1].map(sy => [sx * 0.0116, sy * 0.026625])),
    pockets: [[[0.013, 0.00475], [0.006, 0.007], [-0.006, 0.007], [-0.013, 0.00475],
      [-0.013, -0.00475], [-0.006, -0.007], [0.006, -0.007], [0.013, -0.00475]]],
  },
  profile_6060: {
    // Four cells: two slots in every face at ±15, a bore in each cell, no
    // corner holes; a pocket in the middle between the four cores and one
    // behind each face between its two slots.
    w: 0.060, d: 0.060, slotsY: [-0.015, 0.015], slotsX: [-0.015, 0.015],
    bores: [-1, 1].flatMap(sx => [-1, 1].map(sy => [sx * 0.015, sy * 0.015])), cornerHoles: [],
    pockets: [
      [[0.011, 0.0045], [0.0045, 0.011], [-0.0045, 0.011], [-0.011, 0.0045],
        [-0.011, -0.0045], [-0.0045, -0.011], [0.0045, -0.011], [0.011, -0.0045]],
      ...[[1, 0], [0, 1], [-1, 0], [0, -1]].map(([nx, ny]) => {
        // A 12 x 9.5 pocket centred 19.5 mm out along the face's normal.
        const along = [0.0135, 0.0255], across = 0.00475;
        return [[along[0], -across], [along[1], -across], [along[1], across], [along[0], across]]
          .map(([a, c]) => [nx * a - ny * c, ny * a + nx * c]);
      }),
    ],
  },
});

const linear = (r, g, b) => new THREE.Color(r, g, b);
export const MATERIALS = Object.freeze({
  // Clear anodising. The consumer tints the member for a black finish.
  anodised: namedMaterial("anodised_aluminium", linear(.72, .74, .76), .8, .45),
});

/** A real clockwise hole through a section — `ellipseHole`'s rule for a polygon. */
export function polygonHole(shape, points) {
  const ring = THREE.ShapeUtils.isClockWise(points.map(([x, y]) => new THREE.Vector2(x, y))) ? points : [...points].reverse();
  const hole = new THREE.Path();
  ring.forEach(([x, y], i) => (i === 0 ? hole.moveTo(x, y) : hole.lineTo(x, y)));
  hole.closePath();
  shape.holes.push(hole);
  return shape;
}

/** A section as a Shape: the outline counter-clockwise with its T-slots cut
 * into the faces and its corners rounded R2, then the bores, the corner
 * holes and the pockets as real holes. */
export function sectionShapeFor(name) {
  const profile = PROFILES[name];
  if (!profile) throw new RangeError(`unknown profile ${name}; one of ${Object.keys(PROFILES).join(", ")}`);
  const { w, d, slotsY, slotsX } = profile;
  const r = DIM.corner, o = DIM.opening / 2, c = DIM.chamber / 2, k = DIM.core / 2;
  // One slot, along the face in the direction of travel: lip, neck, chamber
  // ceiling, sloping wall, the core's side as the floor, and back out.
  const slot = a => [[a - o, 0], [a - o, DIM.lip], [a - c, DIM.lip], [a - k, DIM.depth],
    [a + k, DIM.depth], [a + c, DIM.lip], [a + o, DIM.lip], [a + o, 0]];
  // Each face: its outward normal, the direction of travel along it (so the
  // whole outline runs counter-clockwise), its distance from the centre, its
  // half-length and its slots as positions along the travel.
  const faces = [
    { n: [0, 1], t: [-1, 0], h: d / 2, half: w / 2, slots: slotsY.map(x => -x) },
    { n: [-1, 0], t: [0, -1], h: w / 2, half: d / 2, slots: slotsX.map(y => -y) },
    { n: [0, -1], t: [1, 0], h: d / 2, half: w / 2, slots: [...slotsY] },
    { n: [1, 0], t: [0, 1], h: w / 2, half: d / 2, slots: [...slotsX] },
  ];
  const at = ({ n, t, h }, a, depth) => [n[0] * (h - depth) + t[0] * a, n[1] * (h - depth) + t[1] * a];
  const s = new THREE.Shape();
  faces.forEach((face, f) => {
    const run = [[-(face.half - r), 0], ...face.slots.sort((a, b) => a - b).flatMap(slot), [face.half - r, 0]];
    run.forEach(([a, depth], i) => {
      const [x, y] = at(face, a, depth);
      f === 0 && i === 0 ? s.moveTo(x, y) : s.lineTo(x, y);
    });
    const [cx, cy] = at(face, face.half, 0);                     // this face's far corner, rounded R2
    const next = faces[(f + 1) % 4];
    const [nx, ny] = at(next, -(next.half - r), 0);              // where the next face starts
    s.quadraticCurveTo(cx, cy, nx, ny);
  });
  s.closePath();
  for (const [x, y] of profile.bores) ellipseHole(s, x, y, DIM.bore / 2);
  for (const [x, y] of profile.cornerHoles) ellipseHole(s, x, y, DIM.cornerHole / 2);
  for (const pocket of profile.pockets) polygonHole(s, pocket);
  return s;
}

/** HFS6-3030's section (the first of the family, kept under its old name). */
export function sectionShape() {
  return sectionShapeFor("profile_3030");
}

/** One metre of a profile, centred: a group of one finished mesh named
 * after the profile (`profile_3030`), which is the prim the layer exports. */
export function buildProfileFor(name) {
  const g = new THREE.Group(); g.name = name;
  const geometry = new THREE.ExtrudeGeometry(sectionShapeFor(name), { depth: DIM.length, bevelEnabled: false, curveSegments: 8 });
  addMesh(g, "extrusion", geometry, MATERIALS.anodised, [0, 0, -DIM.length / 2]);
  return g;
}

export function buildProfile() {
  return buildProfileFor("profile_3030");
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
