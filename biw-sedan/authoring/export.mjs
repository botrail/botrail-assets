/**
 * Export biw-sedan to USD through three-usd-robot's RobotBuilder.
 *
 * The collision compound goes in as `collisions` with
 * `collisionApproximation: "convexHull"`, which is the UsdPhysics-standard way
 * of saying "these pieces are finished, do not decompose them".
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as THREE from "three";
import { RobotBuilder, serializeUsda } from "three-usd-robot";
import { buildPieces, buildVisualMeshes, MASS_KG } from "./biw.mjs";

const out = process.argv[2] ?? "out/biw-sedan.usda";

const pieces = buildPieces();
const { structure, skin } = buildVisualMeshes(pieces);
const collisions = pieces.map((p) => {
  const m = new THREE.Mesh(p.geometry, new THREE.MeshStandardMaterial());
  m.name = p.name;
  return m;
});

// area-weighted mass distribution: a BIW is sheet metal, so volume-weighting
// pulls the centre of mass up into the roof
const areaOf = (g) => {
  const pos = g.getAttribute("position");
  const index = g.getIndex();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  let total = 0;
  const n = index ? index.count : pos.count;
  for (let i = 0; i < n; i += 3) {
    const [i0, i1, i2] = index ? [index.getX(i), index.getX(i + 1), index.getX(i + 2)] : [i, i + 1, i + 2];
    a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
    total += b.clone().sub(a).cross(c.clone().sub(a)).length() / 2;
  }
  return total;
};
const centroidOf = (g) => {
  const pos = g.getAttribute("position");
  const v = new THREE.Vector3();
  const sum = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) sum.add(v.fromBufferAttribute(pos, i));
  return sum.divideScalar(pos.count);
};
const areas = pieces.map((p) => areaOf(p.geometry));
const totalArea = areas.reduce((s, a) => s + a, 0);
const com = new THREE.Vector3();
pieces.forEach((p, i) => com.addScaledVector(centroidOf(p.geometry), areas[i] / totalArea));

const builder = new RobotBuilder({ name: "biw_sedan" });
builder.addLink({
  name: "biw",
  visuals: [structure, skin],
  collisions,
  inertial: { mass: MASS_KG, centerOfMass: [com.x, com.y, com.z], diagonalInertia: [154, 472, 490] },
  collisionApproximation: "convexHull",
});
builder.addFixedJoint({ name: "root_joint", child: "biw" });

const usda = serializeUsda(builder.toUsda());
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, usda);
console.log(`${out}: ${(usda.length / 1024).toFixed(0)} KB`);
console.log("collision prims :", (usda.match(/PhysicsCollisionAPI/g) ?? []).length);
console.log("convexHull      :", (usda.match(/convexHull/g) ?? []).length);
console.log("centre of mass  :", com.toArray().map((v) => v.toFixed(4)).join(", "));
