import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { DIM, MOUNT_HOLES, CUP_CENTERS, buildVisuals, definition } from "./model.mjs";
import { exportModel } from "./export.mjs";

test("pump height and maximum radial envelope match L and D, separately from holder", () => {
  const body = buildVisuals(), pump = body.getObjectByName("pump");
  const bounds = new THREE.Box3().setFromObject(pump);
  assert.ok(Math.abs(bounds.max.z - 0.0886) < 0.00001);
  assert.ok(Math.abs(bounds.min.z) < 0.00001);
  let maxRadius = 0;
  pump.traverse(m => { if (!m.isMesh) return;
    const p = m.geometry.getAttribute("position"), v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); maxRadius = Math.max(maxRadius, Math.hypot(v.x, v.y));
    }
  });
  assert.ok(Math.abs(maxRadius * 2 - 0.1515) < 0.00002, `D=${maxRadius * 2000}`);
  assert.ok(Math.abs(new THREE.Box3().setFromObject(body).max.z - 0.118) < 0.00001);
});
test("manufacturer drawing gives four M4 blind bores on 46 mm PCD, not legacy three", () => {
  const body = buildVisuals(); assert.equal(MOUNT_HOLES.length, 4);
  for (const [x, y] of MOUNT_HOLES) {
    assert.ok(Math.abs(Math.hypot(x, y) * 2 - 46) < 1e-8);
    const ray = new THREE.Raycaster(new THREE.Vector3(x / 1000, y / 1000, -0.01), new THREE.Vector3(0, 0, 1));
    assert.ok(Math.abs(ray.intersectObject(body, true)[0].point.z * 1000 - 6) < 0.01);
  }
});
test("four cup mouths are hollow; all sealing lips end at the same TCP plane", () => {
  const body = buildVisuals();
  for (let i = 0; i < 4; i++) {
    const cup = body.getObjectByName(`hollow_bellows_cup_${i}`);
    const bounds = new THREE.Box3().setFromObject(cup);
    assert.ok(Math.abs(bounds.max.z - 0.118) < 1e-7);
    const [x, y] = CUP_CENTERS[i];
    const ray = new THREE.Raycaster(new THREE.Vector3(x / 1000, y / 1000, 0.119), new THREE.Vector3(0, 0, -1));
    assert.equal(ray.intersectObject(cup).length, 0);
    ray.ray.origin.x += 0.019;
    assert.ok(ray.intersectObject(cup).some(h => Math.abs(h.point.z - 0.118) < 1e-7));
  }
});
test("actual white/blue material split, new pump mass and legacy task TCP", () => {
  const d = definition(); assert.deepEqual(d.frames.tcp, [0, 0, 0.118]);
  assert.ok(Math.abs(d.inertial.mass - 1.025) < 1e-10);
  assert.equal(DIM.pumpMass, 0.775); assert.equal(d.collisions.length, 10);
  const shell = d.body.getObjectByName("trilobe_shell");
  assert.equal(shell.material.length, 2);
  assert.ok(shell.geometry.groups.some(g => g.materialIndex === 1));
});
test("USD export is deterministic with analytic collisions and material subsets", () => {
  const usd = exportModel(); assert.equal(usd, exportModel());
  assert.ok(usd.includes("blue_corner_cover")); assert.ok(usd.includes("normals"));
  assert.equal((usd.match(/"PhysicsCollisionAPI"/g) ?? []).length, 10);
});
