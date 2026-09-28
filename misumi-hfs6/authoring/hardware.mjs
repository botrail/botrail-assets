/** The 6-series hardware the pack draws beside its members: the frame caps
 * HFC6-3030-B / HFC6-3060-B / HFC6-6060-B and the corner bracket HBLFS6.
 *
 * Authored from the maker's published drawings (the caps' and the bracket's
 * outline drawings), not from the maker's CAD; the peg diameters and the
 * ribs' thickness are read off the drawings' proportions.
 *
 * Metres, Z-up. A cap is a plate in its section's own frame — x along the
 * section's `w`, y along `d`, centred, the plate's thickness centred on
 * z = 0 with the outer face toward +Z and the pegs going -Z into the
 * profile's holes — so a consumer turns +Z along the member, outward, and
 * puts the origin half a plate past the cut end. The bracket has its fold
 * corner at the origin, one flange along +X, the other along +Y, the width
 * centred on Z: a consumer turns those onto the two members of a joint.
 */
import * as THREE from "three";
import { namedMaterial, addMesh, roundedRectangle, ellipseHole, cylinderZ } from "@botrail/authoring/geometry.mjs";

const linear = (r, g, b) => new THREE.Color(r, g, b);
export const MATERIALS = Object.freeze({
  // The caps' black polyamide; the bracket's die-cast aluminium (ADC12) as delivered.
  polyamide: namedMaterial("black_polyamide", linear(.02, .02, .022), 0, .55),
  dieCast: namedMaterial("die_cast_aluminium", linear(.58, .60, .61), .75, .55),
});

/** The caps: the plate (`w` x `d`, R2 corners, 3 mm) and the pegs that go
 * into the profile — the 3030's four into its corner holes, the 3060's two
 * and the 6060's four into the bores. */
export const CAPS = Object.freeze({
  cap_3030: { w: 0.030, d: 0.030, thickness: 0.003, peg: { r: 0.002, h: 0.010 },
    pegs: [-1, 1].flatMap(sx => [-1, 1].map(sy => [sx * 0.0112, sy * 0.0112])) },
  cap_3060: { w: 0.030, d: 0.060, thickness: 0.003, peg: { r: 0.00325, h: 0.0085 },
    pegs: [[0, -0.015], [0, 0.015]] },
  cap_6060: { w: 0.060, d: 0.060, thickness: 0.003, peg: { r: 0.00325, h: 0.0095 },
    pegs: [-1, 1].flatMap(sx => [-1, 1].map(sy => [sx * 0.015, sy * 0.015])) },
});
export const CAP_CORNER = 0.002;

/** HBLFS6: 28 x 28 legs, 20 wide, 4.5 thick flanges, a φ6.3 hole 20 from
 * the corner in each, a rib down either side; the 0.7 mm locating tabs at
 * the flange tips are left out. */
export const BRACKET = Object.freeze({ leg: 0.028, width: 0.020, thickness: 0.0045, hole: 0.0063, holeAt: 0.020, rib: 0.002 });

export function buildCap(name) {
  const cap = CAPS[name];
  if (!cap) throw new RangeError(`unknown cap ${name}; one of ${Object.keys(CAPS).join(", ")}`);
  const g = new THREE.Group(); g.name = name;
  // A bevel grows the outline by its size, so the plate is drawn that much
  // smaller and comes out exactly w x d x thickness with softened edges.
  const bevel = 0.0003;
  const plate = new THREE.ExtrudeGeometry(roundedRectangle(cap.w - 2 * bevel, cap.d - 2 * bevel, CAP_CORNER - bevel), {
    depth: cap.thickness - 2 * bevel, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, curveSegments: 4,
  });
  addMesh(g, "plate", plate, MATERIALS.polyamide, [0, 0, -cap.thickness / 2 + bevel]);
  cap.pegs.forEach(([x, y], i) => {
    addMesh(g, `peg_${i}`, cylinderZ(cap.peg.r, cap.peg.h, { radial: 12 }), MATERIALS.polyamide, [x, y, -cap.thickness / 2 - cap.peg.h / 2]);
  });
  return g;
}

export function buildBracket() {
  const { leg, width, thickness: t, hole, holeAt, rib } = BRACKET;
  const g = new THREE.Group(); g.name = "bracket";
  const flange = () => {
    const s = new THREE.Shape();
    s.moveTo(0, -width / 2); s.lineTo(leg, -width / 2); s.lineTo(leg, width / 2); s.lineTo(0, width / 2); s.closePath();
    ellipseHole(s, holeAt, 0, hole / 2);
    return new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 12 });
  };
  // Flange A: the sheet in the xz plane, its thickness along +y.
  addMesh(g, "flange_a", flange().rotateX(-Math.PI / 2), MATERIALS.dieCast);
  // Flange B: the sheet in the yz plane, its thickness along +x (a cyclic turn, so no mirror).
  addMesh(g, "flange_b", flange().applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1)), MATERIALS.dieCast);
  // The ribs: a right triangle between the flange tips, sunk a little into
  // the flanges so no two faces coincide.
  const gusset = new THREE.Shape();
  gusset.moveTo(t * .8, t * .8); gusset.lineTo(leg, t * .8); gusset.lineTo(t * .8, leg); gusset.closePath();
  for (const side of [-1, 1]) {
    addMesh(g, `rib_${side > 0 ? "p" : "n"}`, new THREE.ExtrudeGeometry(gusset, { depth: rib, bevelEnabled: false }), MATERIALS.dieCast,
      [0, 0, side > 0 ? width / 2 - rib : -width / 2]);
  }
  return g;
}
