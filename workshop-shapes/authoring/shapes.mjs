/** Generic workshop shapes: the curved, perforated and folded forms a box
 * cannot draw. No reference product and no SKU — each is an illustrative
 * form of "a carton", "a pressed tray", "a perforated basket".
 *
 * Every shape is registered into the unit box [-0.5, 0.5]^3 (Z-up). The
 * consumer (botrail `bt.parts.appearance`) scales it to the size at hand,
 * so a file carries a form and never a dimension the cell verifies.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { namedMaterial, addMesh, roundedBox, cylinderZ, roundedRectangle, ellipseHole,
  tubeGeometry } from "@botrail/authoring/geometry.mjs";
import { PEOPLE, buildPerson } from "./people.mjs";
import { orikon, pod, rollCage } from "./logistics.mjs";

// Linear RGB, the botrail convention. Metalness / roughness are authored
// finishes, not measured surface data.
const linear = (r, g, b) => new THREE.Color(r, g, b);
export const MATERIALS = Object.freeze({
  steel: namedMaterial("brushed_steel", linear(.55, .59, .61), .65, .32),
  aluminium: namedMaterial("machined_aluminium", linear(.67, .70, .74), .55, .28),
  rubber: namedMaterial("rubber", linear(.025, .03, .034), 0, .85),
  kraft: namedMaterial("kraft", linear(.57, .39, .21), 0, .93),
  tape: namedMaterial("packing_tape", linear(.38, .25, .12), 0, .48),
  paper: namedMaterial("label_paper", linear(.87, .85, .78), 0, .8),
  ink: namedMaterial("label_ink", linear(.035, .04, .04), 0, .8),
  panel: namedMaterial("laminate", linear(.40, .45, .39), 0, .58),
  // The blue of a VDA KLT (RAL 5003-ish); the consumer usually tints it anyway.
  tote: namedMaterial("polypropylene", linear(.05, .12, .35), 0, .55),
});
const { steel, aluminium, rubber, kraft, tape, paper, ink, panel, tote } = MATERIALS;

const box = (g, n, size, at, m, r = .005) => addMesh(g, n,
  r < .002 ? new THREE.BoxGeometry(...size) : roundedBox(size, Math.min(r, ...size.map(v => v / 3)), 1), m, at);
function extrude(g, n, shape, height, z, m, bevel = .01) {
  return addMesh(g, n, new THREE.ExtrudeGeometry(shape, { depth: height - 2 * bevel, bevelEnabled: bevel > 0,
    bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 4 }), m, [0, 0, z + bevel]);
}
const cylinder = (g, n, r, h, z, m) => addMesh(g, n, cylinderZ(r, h, { radial: 24 }), m, [0, 0, z]);
const tube = (g, n, points, r, m) => addMesh(g, n, tubeGeometry(points, r, { tubular: 32, radial: 10 }), m);

const builders = {
  carton(g) {
    box(g, "folded_board", [.996, .996, .992], [0, 0, -.004], kraft, .008);
    for (const e of [-1, 1]) {
      box(g, `lid_${e}`, [.487, .992, .008], [e * .25, 0, .492], kraft, .003);
      box(g, `tape_end_${e}`, [.13, .003, .19], [0, e * .498, .39], tape, .001);
    }
    box(g, "lid_seam", [.006, .992, .002], [0, 0, .495], ink, .0005);
    box(g, "top_tape", [.13, .996, .004], [0, 0, .498], tape, .001);
    box(g, "shipping_label", [.38, .003, .28], [.14, -.499, .02], paper, .001);
    for (let i = 0; i < 14; i++) box(g, `barcode_${i}`, [i % 3 === 0 ? .011 : .005, .001, .085],
      [-.018 + i * .023, -.501, -.055], ink, .0002);
    for (let i = 0; i < 3; i++) box(g, `address_${i}`, [.22 - i * .035, .001, .006], [.12, -.501, .105 - i * .035], ink, .0002);
  },
  workpiece(g) {
    // An illustrative machined blank with real through-bores and a counterbore.
    // Not a drawing of any product; a form to stand in for "the machined part".
    const outline = (size, r, z) => roundedRectangle(size, size, r).getPoints(24).slice(0, -1).map(p => [p.x, p.y, z]);
    const circle = (x, y, r, z) => Array.from({ length: 48 }, (_, i) => {
      const a = 2 * Math.PI * i / 48; return [x + r * Math.cos(a), y + r * Math.sin(a), z];
    });
    function wall(name, rings, inward = false) {
      const n = rings[0].length, indices = [];
      for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < n; i++) {
        const a = k * n + i, b = k * n + (i + 1) % n, c = a + n, d = b + n;
        indices.push(...(inward ? [a, c, b, b, c, d] : [a, b, c, b, d, c]));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(rings.flat(2), 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(rings.length * n * 2), 2));
      geo.setIndex(indices); geo.computeVertexNormals(); addMesh(g, name, geo, aluminium);
    }
    wall("chamfered_body", [outline(.94, .03, -.5), outline(.97, .045, -.485), outline(.97, .045, .485), outline(.94, .03, .5)]);
    wall("stepped_bore", [circle(0, 0, .175, -.5), circle(0, 0, .16, -.485), circle(0, 0, .16, .2),
      circle(0, 0, .27, .2), circle(0, 0, .27, .485), circle(0, 0, .285, .5)], true);
    for (const x of [-.34, .34]) for (const y of [-.34, .34])
      wall(`mount_${x}_${y}`, [circle(x, y, .08, -.5), circle(x, y, .065, -.485), circle(x, y, .065, .485), circle(x, y, .08, .5)], true);
    for (const z of [-.5, .5]) {
      const s = roundedRectangle(.94, .94, .03);
      ellipseHole(s, 0, 0, z < 0 ? .175 : .285);
      for (const x of [-.34, .34]) for (const y of [-.34, .34]) ellipseHole(s, x, y, .08);
      const geo = new THREE.ShapeGeometry(s, 24);
      if (z < 0) geo.rotateX(Math.PI);
      addMesh(g, z < 0 ? "bottom_face" : "top_face", geo, aluminium, [0, 0, z]);
    }
  },
  rim(g) {
    const s = roundedRectangle(.96, .96, .12);
    s.holes.push(roundedRectangle(.80, .80, .09));
    extrude(g, "rolled_rim", s, 1, -.5, steel, .02);
  },
  tray(g) {
    const s = roundedRectangle(.98, .98, .10);
    s.holes.push(roundedRectangle(.87, .87, .07));
    extrude(g, "pressed_sides", s, .92, -.42, steel, .01);
    box(g, "bottom", [.98, .98, .08], [0, 0, -.46], steel, .025);
  },
  basket(g) {
    const s = roundedRectangle(1, 1, .035);
    for (let x = -.42; x < .45; x += .105) for (let y = -.42; y < .45; y += .105) ellipseHole(s, x, y, .035);
    extrude(g, "perforated_sheet", s, 1, -.5, steel, 0);
  },
  adjuster(g) {
    cylinder(g, "rubber_pad", .5, .27, -.365, rubber);
    cylinder(g, "foot_disc", .44, .12, -.17, steel);
    cylinder(g, "threaded_stem", .15, .67, .165, steel);
    for (let i = 0; i < 6; i++) cylinder(g, `thread_${i}`, .18, .025, -.06 + i * .09, steel);
  },
  panel(g) { box(g, "rounded_laminate", [1, 1, 1], [0, 0, 0], panel, .08); },
  handle(g) {
    tube(g, "bent_handle", [[-.4, 0, -.4], [-.4, 0, .25], [-.27, 0, .4], [.27, 0, .4], [.4, 0, .25], [.4, 0, -.4]], .055, steel);
  },
  hose(g) {
    tube(g, "drain_hose", [[0, 0, .45], [.35, 0, .35], [.36, 0, -.15], [0, 0, -.4], [-.3, 0, -.3]], .055, rubber);
  },
  tote(g) {
    // The ribbed sleeve of a small-load container (a VDA KLT): the outer
    // skin, its vertical ribs, the stacking rim and the base band, a grip
    // ledge on each end and a card pocket on one long side. Open inside
    // and below — the walls and floor are the consumer's plain boxes,
    // which this wraps (botrail scales it a little past them, so the skin
    // stands just outside their faces and the ribs stand proud of that).
    // Depths are fractions of the side, so a 300 mm and a 600 mm bin get
    // ribs in proportion. No SKU: an illustrative form of "a KLT".
    const rib = .012, skin = .012;                   // rib depth, skin thickness (of the side)
    const outer = .5 - rib, inner = outer - skin;    // the skin's two faces
    const ring = roundedRectangle(2 * outer, 2 * outer, .03);
    ring.holes.push(roundedRectangle(2 * inner, 2 * inner, .02));
    extrude(g, "skin", ring, .92, -.46, tote, 0);
    for (const [name, z] of [["rim", .48], ["base_band", -.48]]) {
      const band = roundedRectangle(1, 1, .04);
      band.holes.push(roundedRectangle(2 * (inner - .032), 2 * (inner - .032), .02));
      extrude(g, name, band, .04, z - .02, tote, 0);
    }
    // Vertical ribs on every face, between the bands; the long sides get
    // more of them. Each is a slab standing on the skin, rib deep.
    const along = (n, span) => Array.from({ length: n }, (_, i) => -span / 2 + span * (i + .5) / n);
    for (const x of along(5, .8)) for (const side of [-1, 1]) {
      box(g, `rib_y${side}_${x.toFixed(2)}`, [.022, rib, .9], [x, side * (outer + rib / 2), 0], tote, 0);
    }
    for (const y of along(3, .6)) for (const side of [-1, 1]) {
      box(g, `rib_x${side}_${y.toFixed(2)}`, [rib, .022, .9], [side * (outer + rib / 2), y, 0], tote, 0);
    }
    // A grip ledge under the rim on each end (the KLT's under-grip), and
    // the card pocket on one long side.
    for (const side of [-1, 1]) box(g, `grip_${side}`, [rib, .42, .05], [side * (outer + rib / 2), 0, .32], tote, 0);
    box(g, "card_pocket", [.34, rib * .6, .2], [-.1, -(outer + rib * .3), .2], tote, 0);
  },
  tslot(g) {
    // A T-slot aluminium extrusion, square section, one slot per face and a
    // hollow core — the form of "an aluminium frame member" (the 30 / 40 mm
    // profiles every maker sells), not any maker's drawing. Proportions are
    // fractions of the side: an 8 mm slot on a 30 mm profile is .27, so the
    // consumer scales x and y by the section and z by the cut length, and a
    // 30 mm and a 60 mm member keep the same look. Ends are open geometry,
    // like the workpiece's bores (a raycast down the slot passes through).
    const neck = .135, deep = .07, chamber = .25, floor = .23, chamfer = .05;
    // One face (the +Y one), right to left, so the four rotated copies run
    // counter-clockwise round the section.
    const face = [[.5 - chamfer, .5], [neck, .5], [neck, .5 - deep], [chamber, .5 - deep], [chamber, floor],
      [-chamber, floor], [-chamber, .5 - deep], [-neck, .5 - deep], [-neck, .5], [-(.5 - chamfer), .5]];
    const turned = (k, [x, y]) => k === 0 ? [x, y] : turned(k - 1, [-y, x]);
    const outline = [0, 1, 2, 3].flatMap(k => face.map(p => turned(k, p)));
    const section = new THREE.Shape();
    outline.forEach(([x, y], i) => i === 0 ? section.moveTo(x, y) : section.lineTo(x, y));
    section.closePath();
    ellipseHole(section, 0, 0, .11);
    extrude(g, "extrusion", section, 1, -.5, aluminium, 0);
  },
  tslot_2(g) {
    // The 1 : 2 rectangular member of the same family (a 30 x 60 on a 30 mm
    // system): one slot in each short face, two in each long face at the
    // quarter points, a bore behind each pair and a pocket between them.
    // Built at 1 x 2 in the short side's units and registered into the unit
    // box, so the consumer scales x by the short side, y by the long one and
    // z by the cut length — the same slot on the same look as `tslot`.
    const section = slotted(1, 2, [0], [-.5, .5]);
    for (const y of [-.5, .5]) ellipseHole(section, 0, y, .11);
    section.holes.push(polygon([[.43, .16], [.2, .23], [-.2, .23], [-.43, .16], [-.43, -.16], [-.2, -.23], [.2, -.23], [.43, -.16]]));
    extrude(g, "extrusion", section, 1, -.5, aluminium, 0);
  },
  bracket(g) {
    // The die-cast corner bracket of a T-slot frame: two flanges at right
    // angles with a bolt hole each and a triangular rib down either side.
    // The fold corner sits at the unit box's (-x, -y) corner with the
    // flanges along +x and +y and the width along z, so a consumer scales it
    // to (leg, leg, width) and puts that corner where two members meet.
    // Proportions are the common 28 x 28 x 20 mm bracket of a 30 mm system
    // (flange 4.5 thick, hole at 20 from the corner), not any maker's drawing.
    const leg = 1, width = 20 / 28, t = 4.5 / 28, hole = 3.15 / 28, at = 20 / 28, rib = 2 / 28;
    const flange = () => {
      const s = new THREE.Shape();
      s.moveTo(0, -width / 2); s.lineTo(leg, -width / 2); s.lineTo(leg, width / 2); s.lineTo(0, width / 2); s.closePath();
      ellipseHole(s, at, 0, hole);
      return new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 12 });
    };
    // Flange A: the sheet in the xz plane, its thickness along +y.
    addMesh(g, "flange_a", flange().rotateX(-Math.PI / 2), aluminium);
    // Flange B: the sheet in the yz plane, its thickness along +x (a cyclic turn, so no mirror).
    addMesh(g, "flange_b", flange().applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1)), aluminium);
    const gusset = new THREE.Shape();
    gusset.moveTo(t * .8, t * .8); gusset.lineTo(leg, t * .8); gusset.lineTo(t * .8, leg); gusset.closePath();
    for (const side of [-1, 1]) {
      addMesh(g, `rib_${side}`, new THREE.ExtrudeGeometry(gusset, { depth: rib, bevelEnabled: false }), aluminium,
        [0, 0, side > 0 ? width / 2 - rib : -width / 2]);
    }
  },
};

/** The outline of a T-slot section `w` x `d` (short side 1), centred:
 * `slotsY` are the x positions of the slots in the +Y / -Y faces, `slotsX`
 * the y positions of those in the +X / -X faces. Each slot is the `tslot`
 * one — the same neck, lip, chamber and floor, as fractions of the short
 * side — so the whole family looks alike. Counter-clockwise, chamfered corners. */
function slotted(w, d, slotsY, slotsX) {
  const neck = .135, deep = .07, chamber = .25, floor = .27, chamfer = .05;
  const slot = p => [[p - neck, 0], [p - neck, deep], [p - chamber, deep], [p - chamber, floor],
    [p + chamber, floor], [p + chamber, deep], [p + neck, deep], [p + neck, 0]];
  // Each face: its outward normal, the direction of travel along it, its
  // distance from the centre, its half-length and its slots (in travel order).
  const faces = [
    { n: [0, 1], t: [-1, 0], h: d / 2, half: w / 2, slots: slotsY.map(x => -x) },
    { n: [-1, 0], t: [0, -1], h: w / 2, half: d / 2, slots: slotsX.map(y => -y) },
    { n: [0, -1], t: [1, 0], h: d / 2, half: w / 2, slots: [...slotsY] },
    { n: [1, 0], t: [0, 1], h: w / 2, half: d / 2, slots: [...slotsX] },
  ];
  const s = new THREE.Shape();
  faces.forEach(({ n, t, h, half, slots }, f) => {
    const pt = (a, depth) => [n[0] * (h - depth) + t[0] * a, n[1] * (h - depth) + t[1] * a];
    const run = [[-(half - chamfer), 0], ...slots.sort((a, b) => a - b).flatMap(slot), [half - chamfer, 0]];
    run.forEach(([a, depth], i) => { const [x, y] = pt(a, depth); f === 0 && i === 0 ? s.moveTo(x, y) : s.lineTo(x, y); });
  });
  s.closePath();
  return s;
}

/** A real clockwise hole through a section, like `ellipseHole`. */
const polygon = points => {
  const ring = THREE.ShapeUtils.isClockWise(points.map(([x, y]) => new THREE.Vector2(x, y))) ? points : [...points].reverse();
  const p = new THREE.Path();
  ring.forEach(([x, y], i) => i === 0 ? p.moveTo(x, y) : p.lineTo(x, y));
  p.closePath();
  return p;
};

// People (`people.mjs`): one shape per posture; carriers (`logistics.mjs`).
for (const name of PEOPLE) builders[name] = g => buildPerson(g, name);
builders.roll_cage = rollCage;
builders.orikon = orikon;
builders.pod = pod;

export const SHAPES = Object.freeze(Object.keys(builders).sort());

/** The shape as a group of finished pieces, registered into the unit box. */
export function buildShape(name) {
  if (!builders[name]) throw new RangeError(`unknown shape ${name}; one of ${SHAPES.join(", ")}`);
  const g = new THREE.Group(); g.name = name;
  builders[name](g);
  g.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(g);
  const size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
  for (const child of g.children) {
    child.position.sub(center).divide(size);
    child.scale.divide(size);
  }
  g.updateMatrixWorld(true);
  return g;
}

/** One renderable mesh — botrail's visual asset addresses a single gprim —
 * with the pieces' finishes kept as material groups (USD GeomSubsets). */
export function mergeShape(group) {
  const geometry = mergeGeometries(group.children.map(child => {
    const geo = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
    return geo.applyMatrix4(child.matrixWorld);
  }), true);
  const merged = new THREE.Mesh(geometry, group.children.map(child => child.material));
  merged.name = group.name;
  return merged;
}
