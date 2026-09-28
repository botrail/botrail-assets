import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { parseUsda } from "three-usd-robot/core";
import { DIM, PROFILES, buildProfile, buildProfileFor, mergeProfile } from "./profile.mjs";
import { LAYERS, exportLayers, exportModel } from "./export.mjs";

const probe = name => {
  const mesh = mergeProfile(buildProfileFor(name));
  mesh.material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }); mesh.updateMatrixWorld(true);
  return (x, y) => new THREE.Raycaster(new THREE.Vector3(x, y, -1), new THREE.Vector3(0, 0, 1)).intersectObject(mesh).length > 0;
};
const near = (v, e, what) => assert.ok(Math.abs(v - e) < 1e-6, `${what}: ${v} vs ${e}`);

test("each member is at its real section and one metre long, centred", () => {
  assert.deepEqual(Object.keys(PROFILES), ["profile_3030", "profile_3060", "profile_6060"]);
  for (const [name, { w, d }] of Object.entries(PROFILES)) {
    const b = new THREE.Box3().setFromObject(buildProfileFor(name));
    near(b.min.x, -w / 2, `${name} -x`); near(b.max.x, w / 2, `${name} +x`);
    near(b.min.y, -d / 2, `${name} -y`); near(b.max.y, d / 2, `${name} +y`);
    near(b.min.z, -0.5, `${name} -z`); near(b.max.z, 0.5, `${name} +z`);
  }
  assert.equal(DIM.side, 0.030);
  assert.equal(buildProfile().name, "profile_3030");
});

test("3030: every face is open along its 8 mm slot, the chamber and the bores are open, the lips and the core are material", () => {
  const hit = probe("profile_3030");
  for (const [x, y] of [[0, 0.0145], [0.0145, 0], [0, -0.0145], [-0.0145, 0]]) assert.equal(hit(x, y), false, `slot opening at ${x},${y}`);
  assert.equal(hit(0, 0.010), false, "the chamber under the lip");
  assert.equal(hit(0, 0), false, "the φ6.8 bore in the core");
  assert.equal(hit(0.0116, 0.0116), false, "a φ4.2 corner hole");
  assert.equal(hit(0.006, 0.0145), true, "the lip beside the slot");
  assert.equal(hit(0, 0.0045), true, "the core beside the bore");
  assert.equal(hit(0.0125, 0.0095), true, "the corner mass beside its hole");
});

test("3060: one slot in each 30 mm face, two in each 60 mm face, a bore per cell and the pocket between them", () => {
  const hit = probe("profile_3060");
  assert.equal(hit(0, 0.0295), false, "the slot in the +Y face");
  assert.equal(hit(0, -0.0295), false, "...and in the -Y face");
  for (const y of [-0.015, 0.015]) {
    assert.equal(hit(0.0145, y), false, `a slot in the +X face at ${y}`);
    assert.equal(hit(-0.0145, y), false, `a slot in the -X face at ${y}`);
    assert.equal(hit(0, y), false, `the bore behind it at ${y}`);
  }
  assert.equal(hit(0.0145, 0), true, "the long face between its two slots");
  assert.equal(hit(0, 0), false, "the pocket between the cells");
  assert.equal(hit(0.012, 0), false, "...reaches to the outer wall's web");
  assert.equal(hit(0.014, 0.005), true, "the outer wall");
  assert.equal(hit(0, 0.0095), true, "the web between the pocket and the bore");
  assert.equal(hit(0.0116, 0.026625), false, "a corner hole on the 23.2 x 53.25 pitch");
  assert.equal(hit(0.006, 0.0295), true, "the lip beside the slot");
});

test("6060: two slots in every face, four bores, no corner holes, a pocket in the middle and one behind each face", () => {
  const hit = probe("profile_6060");
  for (const s of [-0.015, 0.015]) {
    assert.equal(hit(s, 0.0295), false, `a slot in the +Y face at ${s}`);
    assert.equal(hit(0.0295, s), false, `a slot in the +X face at ${s}`);
    for (const t of [-0.015, 0.015]) assert.equal(hit(s, t), false, `the bore at ${s},${t}`);
  }
  assert.equal(hit(0.0295, 0), true, "a face between its two slots");
  assert.equal(hit(0.028, 0.028), true, "the corner mass — no corner hole");
  assert.equal(hit(0, 0), false, "the pocket in the middle");
  assert.equal(hit(0.0195, 0), false, "the pocket behind the +X face");
  assert.equal(hit(0, -0.0195), false, "...and behind the -Y face");
  assert.equal(hit(0.01225, 0), true, "the web between the middle pocket and a side pocket");
  assert.equal(hit(0.015, 0.0095), true, "the core beside a bore");
});

test("the layers are one mesh per part with subsets under /HFS6 and its Looks, and are deterministic", () => {
  assert.deepEqual(Object.keys(LAYERS), ["hfs6-3030", "hfs6-3060", "hfs6-6060", "hfc6-caps", "hblfs6"]);
  const first = exportLayers(), second = exportLayers();
  for (const [layer, parts] of Object.entries(LAYERS)) {
    assert.equal(first[layer], second[layer], layer);
    const root = parseUsda(first[layer]).prims[0];
    assert.equal(root.name, "HFS6");
    assert.deepEqual(root.children.map(p => `${p.name}:${p.typeName}`), [...parts.map(n => `${n}:Mesh`), "Looks:Scope"]);
    for (const prim of root.children.slice(0, -1)) {
      assert.ok(prim.children.filter(p => p.typeName === "GeomSubset").length >= 1, `${layer}/${prim.name} has subsets`);
    }
    assert.ok(!first[layer].includes("PhysicsArticulationRootAPI"), "a picture, not an articulation");
  }
  assert.ok(first["hfs6-3030"].includes('def Material "anodised_aluminium"'));
  assert.ok(first["hfc6-caps"].includes('def Material "black_polyamide"'));
  assert.ok(first["hblfs6"].includes('def Material "die_cast_aluminium"'));
  assert.equal(exportModel(), first["hfs6-3030"], "the 3030 layer keeps its old export name");
});
