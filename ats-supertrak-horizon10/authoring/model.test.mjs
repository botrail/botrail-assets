import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { readFileSync } from "node:fs";
import { exportFixedModel } from "@botrail/authoring/fixed-usd.mjs";
import { definition, DIM } from "./model.mjs";
import { parseUsda } from "three-usd-robot/core";

test("modules join on their published pitch and leave the cell centre open", () => {
  const curve = definition("curve90"), straight = definition("straight1000");
  assert.deepEqual(curve.frames.start, [0.6, 0, DIM.bodyHeight]);
  assert.deepEqual(curve.frames.end, [0, 0.6, DIM.bodyHeight]);
  assert.equal(straight.frames.end[1] - straight.frames.start[1], 1);
  for (const c of curve.collisions) assert.ok(Math.hypot(...c.at.slice(0, 2)) - Math.hypot(...c.size.slice(0, 2)) / 2 > 0.48);
  const bounds = new THREE.Box3().setFromObject(straight.body);
  assert.ok(Math.abs(bounds.max.y - bounds.min.y - 1) < 1e-6);
});
test("checked-in USD matches the authoring code", () => {
  for (const v of ["curve90", "straight1000", "shuttle"])
    assert.equal(exportFixedModel(definition(v)), readFileSync(new URL(`../usd/horizon10-${v}.usda`, import.meta.url), "utf8"));
});
test("static companions remain importable visual geometry without articulation or collisions", () => {
  for (const v of ["curve90", "straight1000", "shuttle"]) {
    const stage = parseUsda(readFileSync(new URL(`../usd/horizon10-${v}-visual.usda`, import.meta.url), "utf8"));
    let meshes = 0;
    function visit(p) {
      assert.ok(!p.typeName.startsWith("Physics"));
      assert.ok(!p.name.startsWith("collision_"));
      assert.ok(!(p.metadata.apiSchemas || []).some(s => s.startsWith("Physics")));
      if (p.typeName === "Mesh") meshes++;
      p.children.forEach(visit);
    }
    stage.prims.forEach(visit);
    assert.ok(meshes > 0);
  }
});
