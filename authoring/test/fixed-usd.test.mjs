import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { parseUsda } from "three-usd-robot/core";
import { exportFixedModel } from "../fixed-usd.mjs";

function fixture() {
  const body = new THREE.Group(); body.name = "body";
  body.add(new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01), new THREE.MeshStandardMaterial()));
  return { name: "unit_test", body, frames: { tcp: [0, 0, 0.02] },
    inertial: { mass: 1, centerOfMass: [0, 0, 0], diagonalInertia: [0.01, 0.01, 0.01] },
    collisions: [{ kind: "box", name: "base", size: [0.01, 0.01, 0.01], at: [0, 0, 0] },
      ...["X", "Y", "Z"].map(axis => ({ kind: "cylinder", name: `pin_${axis}`, axis,
        radius: 0.002, length: 0.01, at: [0, 0, 0] }))] };
}

test("fixed export is deterministic with explicit frames, materials, normals and guide collisions", () => {
  const d = fixture(), usd = exportFixedModel(d); assert.equal(exportFixedModel(d), usd);
  assert.match(usd, /normals/); assert.match(usd, /UsdPreviewSurface/);
  const root = parseUsda(usd).prims.find(p => p.name === d.name);
  assert.ok(root.children.some(p => p.name === "tcp"));
  const body = root.children.find(p => p.name === "body");
  const collisions = body.children.filter(p => p.name.startsWith("collision_"));
  assert.equal(collisions.length, 4);
  assert.deepEqual(collisions.map(p => p.typeName), ["Cube", "Cylinder", "Cylinder", "Cylinder"]);
  assert.equal((usd.match(/uniform token purpose = "guide"/g) ?? []).length, 4);
  // Importers must see native-Z cylinders, including the X/Y-oriented ones.
  assert.equal((usd.match(/uniform token axis = "Z"/g) ?? []).length, 3);
  assert.match(usd, /0\.7071067811865476, -0\.7071067811865476, 0, 0/);
});

test("unknown/invalid collisions fail instead of becoming a silent default cylinder", () => {
  for (const changes of [{ kind: "mesh" }, { size: [0, 1, 1] }, { at: [NaN, 0, 0] },
    { name: 'bad"name' }, { axis: "X" }]) {
    const d = fixture(); Object.assign(d.collisions[0], changes);
    assert.throws(() => exportFixedModel(d));
  }
  for (const changes of [{ radius: -1 }, { length: 0 }, { axis: "invalid" }]) {
    const d = fixture(); Object.assign(d.collisions[1], changes);
    assert.throws(() => exportFixedModel(d));
  }
});

test("reserved frame names and duplicate collision names are rejected", () => {
  const d = fixture(); d.frames.mount = [0, 0, 0]; assert.throws(() => exportFixedModel(d), /Duplicate link/);
  delete d.frames.mount; d.collisions[1].name = "base";
  assert.throws(() => exportFixedModel(d), /Duplicate collision/);
});
