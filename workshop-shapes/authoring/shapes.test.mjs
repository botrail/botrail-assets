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
  assert.deepEqual([...SHAPES], ["adjuster", "basket", "carton", "handle", "hose", "panel", "rim", "tray", "workpiece"]);
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
