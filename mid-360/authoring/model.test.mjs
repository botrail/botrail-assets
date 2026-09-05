import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { DIM, MOUNT_HOLES, LOCATING_HOLES, buildVisuals, definition } from "./model.mjs";
import { exportModel } from "./export.mjs";

function hitZ(body, x, y) {
  const ray = new THREE.Raycaster(new THREE.Vector3(x / 1000, y / 1000, -0.01), new THREE.Vector3(0, 0, 1));
  return ray.intersectObject(body, true)[0]?.point.z * 1000;
}
test("published body envelope including connector, without protruding fins", () => {
  const body = buildVisuals(), box = new THREE.Box3().setFromObject(body);
  for (const [v, expected] of [[box.min.x, -0.0405], [box.max.x, 0.0325],
    [box.min.y, -0.0325], [box.max.y, 0.0325], [box.min.z, 0], [box.max.z, 0.060]]) {
    assert.ok(Math.abs(v - expected) < 0.00002, `${v} != ${expected}`);
  }
});
test("four blind M3 bores have 48 x 36 pitch and 5 mm depth in actual surfaces", () => {
  const body = buildVisuals();
  for (const [x, y] of MOUNT_HOLES) {
    assert.ok(Math.abs(Math.abs(x) - 24) < 1e-8 && Math.abs(Math.abs(y) - 18) < 1e-8);
    assert.ok(Math.abs(hitZ(body, x, y) - DIM.mountDepth) < 0.02);
    assert.ok(Math.abs(hitZ(body, x + 2, y)) < 0.02);
  }
});
test("locating bores are actual 1.8 mm deep recesses", () => {
  const body = buildVisuals();
  for (const [x, y] of LOCATING_HOLES) assert.ok(Math.abs(hitZ(body, x, y) - 1.8) < 0.02);
});
test("optical origin, mass and primitive collisions remain explicit", () => {
  const d = definition(); assert.deepEqual(d.frames.livox_frame, [0, 0, 0.047]);
  assert.equal(d.inertial.mass, 0.265); assert.equal(d.collisions.length, 3);
  assert.ok(d.collisions.every(c => ["box", "cylinder"].includes(c.kind)));
});
test("USD retains named materials and authored normals and is deterministic", () => {
  const usd = exportModel(); assert.equal(usd, exportModel());
  assert.ok(usd.includes("dark_optical_window")); assert.ok(usd.includes("normals"));
  assert.equal((usd.match(/"PhysicsCollisionAPI"/g) ?? []).length, 3);
});
