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
});
const { steel, aluminium, rubber, kraft, tape, paper, ink, panel } = MATERIALS;

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
};

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
