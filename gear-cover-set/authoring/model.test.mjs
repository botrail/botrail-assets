import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { parseUsda } from "three-usd-robot/core";
import { DIM, buildHousing, buildCover, mergePart } from "./model.mjs";
import { exportModel } from "./export.mjs";

const probe = group => {
  const mesh = mergePart(group); mesh.material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }); mesh.updateMatrixWorld(true);
  return (x, y, from = -1, dz = 1) => new THREE.Raycaster(new THREE.Vector3(x, y, from), new THREE.Vector3(0, 0, dz)).intersectObject(mesh);
};

test("the housing is its block, about the block's centre, with real threads and dowel seats", () => {
  const b = new THREE.Box3().setFromObject(buildHousing());
  for (const [v, e] of [[b.min.x, -0.08], [b.max.x, 0.08], [b.min.y, -0.06], [b.max.y, 0.06], [b.min.z, -0.03], [b.max.z, 0.03]]) assert.ok(Math.abs(v - e) < 1e-6, `${v} vs ${e}`);
  const hit = probe(buildHousing());
  for (const [x, y] of DIM.holes) {
    const top = hit(x, y, 0.1, -1).at(0);   // from above, down the bore: the floor 13 mm under the face
    assert.ok(top && Math.abs(top.point.z - (0.03 - DIM.threadDepth)) < 1e-4, `thread at ${x},${y}`);
  }
  for (const [x, y] of DIM.dowels) assert.ok(!hit(x, y, 0.029).some(h => h.point.z > 0.0295), "a dowel seat is open through the flange");
  assert.ok(hit(0.075, 0.050).length > 0, "flange material beside the holes");
});

test("the cover stands on its underside with clearance and dowel holes through it and the boss on top", () => {
  const b = new THREE.Box3().setFromObject(buildCover());
  for (const [v, e] of [[b.min.z, 0], [b.max.z, 0.04], [b.max.x, 0.08], [b.max.y, 0.06]]) assert.ok(Math.abs(v - e) < 1e-6, `${v} vs ${e}`);
  const hit = probe(buildCover());
  for (const [x, y] of [...DIM.holes, ...DIM.dowels]) assert.equal(hit(x, y).length, 0, `open at ${x},${y}`);
  assert.ok(hit(0, 0).some(h => Math.abs(h.point.z - 0.04) < 1e-4), "the boss top");
});

test("the layer is two meshes with subsets and a Looks scope, and is deterministic", () => {
  const usda = exportModel(); assert.equal(usda, exportModel());
  const root = parseUsda(usda).prims[0];
  assert.equal(root.name, "GH160");
  assert.deepEqual(root.children.map(p => `${p.name}:${p.typeName}`), ["housing:Mesh", "cover:Mesh", "Looks:Scope"]);
  for (const mesh of root.children.slice(0, 2)) assert.ok(mesh.children.filter(p => p.typeName === "GeomSubset").length >= 3, mesh.name);
  assert.ok(!usda.includes("PhysicsArticulationRootAPI"));
  assert.ok(["cast_aluminium", "machined_aluminium", "bore"].every(m => usda.includes(`def Material "${m}"`)));
});
