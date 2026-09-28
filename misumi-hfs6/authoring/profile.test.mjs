import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { parseUsda } from "three-usd-robot/core";
import { DIM, buildProfile, mergeProfile } from "./profile.mjs";
import { exportModel } from "./export.mjs";

const probe = () => {
  const mesh = mergeProfile(buildProfile());
  mesh.material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }); mesh.updateMatrixWorld(true);
  return (x, y) => new THREE.Raycaster(new THREE.Vector3(x, y, -1), new THREE.Vector3(0, 0, 1)).intersectObject(mesh).length > 0;
};

test("the member is 30 mm square at its real section and one metre long, centred", () => {
  const b = new THREE.Box3().setFromObject(buildProfile());
  for (const [v, e] of [[b.min.x, -0.015], [b.max.x, 0.015], [b.min.y, -0.015], [b.max.y, 0.015], [b.min.z, -0.5], [b.max.z, 0.5]]) {
    assert.ok(Math.abs(v - e) < 1e-6, `${v} vs ${e}`);
  }
  assert.equal(DIM.side, 0.030);
});

test("every face is open along its 8 mm slot, the chamber and the bores are open, the lips and the core are material", () => {
  const hit = probe();
  for (const [x, y] of [[0, 0.0145], [0.0145, 0], [0, -0.0145], [-0.0145, 0]]) assert.equal(hit(x, y), false, `slot opening at ${x},${y}`);
  assert.equal(hit(0, 0.010), false, "the chamber under the lip");
  assert.equal(hit(0, 0), false, "the φ6.8 bore in the core");
  assert.equal(hit(0.0116, 0.0116), false, "a φ4.2 corner hole");
  assert.equal(hit(0.006, 0.0145), true, "the lip beside the slot");
  assert.equal(hit(0, 0.0045), true, "the core beside the bore");
  assert.equal(hit(0.0125, 0.0095), true, "the corner mass beside its hole");
});

test("the layer is one mesh with subsets under /HFS6 and its Looks, and is deterministic", () => {
  const usda = exportModel(); assert.equal(usda, exportModel());
  const root = parseUsda(usda).prims[0];
  assert.equal(root.name, "HFS6");
  assert.deepEqual(root.children.map(p => `${p.name}:${p.typeName}`), ["profile_3030:Mesh", "Looks:Scope"]);
  const subsets = root.children[0].children.filter(p => p.typeName === "GeomSubset");
  assert.equal(subsets.length, 1);
  assert.ok(usda.includes('def Material "anodised_aluminium"'));
  assert.ok(!usda.includes("PhysicsArticulationRootAPI"), "a picture, not an articulation");
});
