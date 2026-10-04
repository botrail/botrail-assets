/** The building and what stands about in it: a waste bin (`waste_bin`) and a
 * round LED high-bay luminaire (`highbay`). Illustrative and unbranded,
 * drawn at the common sizes; the consumer (botrail `bt.parts`) scales them
 * to the box it builds.
 */
import * as THREE from "three";
import { namedMaterial } from "@botrail/authoring/geometry.mjs";
import { flatten } from "./people.mjs";

const PI = Math.PI;
const linear = s => (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4);
const finish = (name, [r, g, b], roughness, metalness = 0) =>
  namedMaterial(name, new THREE.Color(linear(r / 255), linear(g / 255), linear(b / 255)), metalness, roughness);
const lit = (material, [r, g, b]) => Object.assign(material, { emissive: new THREE.Color(r, g, b) });

export const FACILITY_MATERIALS = Object.freeze({
  binGrey: finish("bin_grey", [198, 200, 202], 0.55),
  liner: finish("bin_liner", [34, 36, 38], 0.4),
  housing: finish("luminaire_housing", [60, 62, 66], 0.45, 0.6),
  diffuser: lit(finish("luminaire_diffuser", [242, 242, 238], 0.3), [1.0, 1.0, 0.95]),
});
const M = FACILITY_MATERIALS;

/** A rounded rectangle (half extents hx, hy, corner radius r), counter-clockwise. */
function roundRect(hx, hy, r, Kind = THREE.Shape) {
  const s = new Kind();
  r = Math.min(r, hx, hy);
  s.moveTo(hx, -hy + r);
  s.lineTo(hx, hy - r); s.absarc(hx - r, hy - r, r, 0, PI / 2, false);
  s.lineTo(-hx + r, hy); s.absarc(-hx + r, hy - r, r, PI / 2, PI, false);
  s.lineTo(-hx, -hy + r); s.absarc(-hx + r, -hy + r, r, PI, 1.5 * PI, false);
  s.lineTo(hx - r, -hy); s.absarc(hx - r, -hy + r, r, 1.5 * PI, 2 * PI, false);
  return s;
}
function extrude(g, name, shape, depth, material, z0 = 0) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 10 });
  geo.translate(0, 0, z0);
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = name; g.add(mesh);
  return mesh;
}

// ------------------------------------------------------------------ waste bin
// A grey bin drawn 0.35 long (x) by 0.30 wide (y) by 0.55 tall: walls
// widening 10 % to the top, a rolled rim, and a black liner folded over it,
// hanging 6 cm down the outside. Open at the top.
export function wasteBin(g) {
  const body = new THREE.Group();
  const L = 0.35, W = 0.30, H = 0.55, t = 0.004, r = 0.03, flare = 0.1, rimW = 0.008, rimH = 0.02;
  const bl = (L - 2 * (rimW + 0.006)) / (1 + flare), bw = (W - 2 * (rimW + 0.006)) / (1 + flare), k = 1 + flare;
  const ring = roundRect(bl / 2, bw / 2, r);
  ring.holes.push(roundRect(bl / 2 - t, bw / 2 - t, r - t, THREE.Path));
  const walls = extrude(body, "walls", ring, H - 0.004, M.binGrey);
  const pos = walls.geometry.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const s = 1 + flare * (pos.getZ(i) / (H - 0.004));
    pos.setXYZ(i, pos.getX(i) * s, pos.getY(i) * s, pos.getZ(i));
  }
  walls.geometry.computeVertexNormals();
  extrude(body, "floor", roundRect(bl / 2 - t / 2, bw / 2 - t / 2, r - t / 2), 0.008, M.binGrey);
  const lip = roundRect((bl / 2) * k + rimW, (bw / 2) * k + rimW, r + rimW);
  lip.holes.push(roundRect((bl / 2) * k - t, (bw / 2) * k - t, r - t, THREE.Path));
  extrude(body, "rim", lip, rimH, M.binGrey, H - 0.004 - rimH);
  const band = roundRect((bl / 2) * k + rimW + 0.006, (bw / 2) * k + rimW + 0.006, 0.045);
  band.holes.push(roundRect((bl / 2) * k - 0.002, (bw / 2) * k - 0.002, 0.028, THREE.Path));
  extrude(body, "liner", band, 0.06, M.liner, H - 0.06);
  for (const mesh of flatten(body)) g.add(mesh);
}

// ------------------------------------------------------------------ high-bay luminaire
// A round LED high-bay luminaire drawn Ø 0.44 by 0.164 tall: a dark housing
// rising from a bezel round the diffuser, stepping in to its driver can, and
// the lit diffuser underneath (emissive), its face at the bottom.
export function highbay(g) {
  const body = new THREE.Group();
  const profile = [[0.204, 0.004], [0.22, 0.004], [0.22, 0.09], [0.12, 0.16], [0.0, 0.164]];   // bottom to top: faces outward
  const housing = new THREE.LatheGeometry(profile.map(([r, z]) => new THREE.Vector2(r, z)), 48);
  housing.rotateX(PI / 2);                            // revolve about z, the height along z
  const shell = new THREE.Mesh(housing, M.housing);
  shell.name = "housing"; body.add(shell);
  const disc = new THREE.CircleGeometry(0.205, 48);
  disc.rotateX(PI);                                   // facing down
  const diffuser = new THREE.Mesh(disc, M.diffuser);
  diffuser.name = "diffuser"; diffuser.position.set(0, 0, 0.0); body.add(diffuser);
  for (const mesh of flatten(body)) g.add(mesh);
}
