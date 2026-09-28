import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { parseUsda } from "three-usd-robot/core";
import { SHAPES, buildShape, mergeShape } from "./shapes.mjs";
import { exportShapes } from "./export.mjs";

const probe = name => {
  const mesh = mergeShape(buildShape(name));
  mesh.material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  mesh.updateMatrixWorld(true);
  return (x, y) => new THREE.Raycaster(new THREE.Vector3(x, y, -1), new THREE.Vector3(0, 0, 1)).intersectObject(mesh).length > 0;
};

test("every shape is registered into the unit box", () => {
  assert.deepEqual([...SHAPES], ["adjuster", "basket", "bracket", "carton", "handle", "hose", "panel", "rim", "tote", "tray", "tslot", "tslot_2", "workpiece"]);
  for (const name of SHAPES) {
    const bounds = new THREE.Box3().setFromObject(buildShape(name));
    for (const axis of ["x", "y", "z"]) {
      assert.ok(Math.abs(bounds.min[axis] + .5) < 1e-6 && Math.abs(bounds.max[axis] - .5) < 1e-6, `${name} ${axis}`);
    }
  }
});

test("the workpiece's bores and the basket's perforations are open geometry", () => {
  const workpiece = probe("workpiece");
  assert.equal(workpiece(0, 0), false, "central bore goes all the way through");
  assert.equal(workpiece(.34, .34), false, "mounting bore, not a dark decal");
  assert.equal(workpiece(.38, 0), true, "material beside the bores remains");
  const basket = probe("basket");
  assert.equal(basket(-.42, -.42), false, "a perforation");
  assert.equal(basket(-.3675, -.42), true, "the sheet between two perforations");
  // The tote is a sleeve: open inside (the consumer's boxes are the walls
  // and floor) and skinned round the outside, with ribs standing proud.
  const tote = probe("tote");
  assert.equal(tote(0, 0), false, "open inside");
  assert.equal(tote(.47, 0), true, "the skin");
  // The T-slot member is hollow, and every face is open along its slot.
  const tslot = probe("tslot");
  assert.equal(tslot(0, 0), false, "the hollow core");
  assert.equal(tslot(0, .49), false, "the slot opening in the +Y face");
  assert.equal(tslot(.49, 0), false, "...and in the +X face");
  assert.equal(tslot(0, .35), false, "the T-slot's chamber");
  assert.equal(tslot(.2, .48), true, "the face beside the slot");
  assert.equal(tslot(.4, .4), true, "the corner");
  // The 1 : 2 member: one slot in a short face, two in a long one, a bore
  // behind each pair and the pocket between them — y is the long side.
  const wide = probe("tslot_2");
  assert.equal(wide(0, .49), false, "the slot in the +Y (short) face");
  assert.equal(wide(.49, .25), false, "a slot in the +X (long) face, at the quarter point");
  assert.equal(wide(.49, -.25), false, "...and the other");
  assert.equal(wide(.49, 0), true, "the long face between its slots");
  assert.equal(wide(0, .25), false, "the bore behind the upper slots");
  assert.equal(wide(0, 0), false, "the pocket between the two cells");
  assert.equal(wide(.3, .25), true, "the cell wall beside the bore");
  assert.equal(wide(.4, .45), true, "a corner");
});

test("the bracket's fold corner is the box's -x -y corner, with a hole through each flange", () => {
  const mesh = mergeShape(buildShape("bracket"));
  mesh.material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }); mesh.updateMatrixWorld(true);
  const hits = (origin, direction) => new THREE.Raycaster(new THREE.Vector3(...origin), new THREE.Vector3(...direction)).intersectObject(mesh).length;
  assert.ok(hits([-.45, -1, 0], [0, 1, 0]) > 0, "flange B stands on the -x side");
  assert.ok(hits([-1, -.45, 0], [1, 0, 0]) > 0, "flange A lies on the -y side");
  assert.equal(hits([.45, .45, -1], [0, 0, 1]), 0, "nothing in the open corner opposite the fold");
  assert.equal(hits([.214, -1, 0], [0, 1, 0]), 0, "the bolt hole through flange A (20/28 of the leg from the corner)");
  assert.equal(hits([-1, .214, 0], [1, 0, 0]), 0, "...and through flange B");
  assert.ok(hits([.214, -1, .3], [0, 1, 0]) > 0, "the flange beside its hole");
  assert.ok(hits([0, 0, -1], [0, 0, 1]) > 0, "a rib spans the corner");
  assert.equal(hits([0, 0, -.2], [0, 0, 1]), 2, "...at the sides only: from the middle a ray up meets just the far rib (its two faces)");
});

test("finishes survive flattening as material groups", () => {
  const carton = mergeShape(buildShape("carton"));
  assert.ok(carton.geometry.groups.length >= 4);
  assert.ok(new Set(carton.material.map(m => m.name)).size >= 4, "cardboard, tape, paper and ink");
  for (const name of SHAPES) {
    const merged = mergeShape(buildShape(name));
    assert.equal(merged.geometry.groups.length, buildShape(name).children.length, name);
  }
});

test("each layer is one mesh with subsets and its materials, and is deterministic", () => {
  const first = exportShapes(), second = exportShapes();
  for (const name of SHAPES) {
    assert.equal(first[name], second[name], name);
    const root = parseUsda(first[name]).prims[0];
    assert.equal(root.name, "Shapes");
    assert.deepEqual(root.children.map(p => `${p.name}:${p.typeName}`), [`${name}:Mesh`, "Looks:Scope"]);
    const mesh = root.children[0], looks = root.children[1];
    const subsets = mesh.children.filter(p => p.typeName === "GeomSubset");
    assert.equal(subsets.length, buildShape(name).children.length, name);
    const bound = new Set(subsets.map(p => p.properties.find(q => q.name === "material:binding").targets[0]));
    for (const target of bound) assert.ok(looks.children.some(m => `/Shapes/Looks/${m.name}` === target), `${name}: ${target}`);
    assert.ok(!first[name].includes("PhysicsArticulationRootAPI"), "a form, not an articulation");
  }
});
