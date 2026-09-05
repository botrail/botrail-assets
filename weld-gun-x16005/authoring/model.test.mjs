import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { parseUsda } from "three-usd-robot/core";
import { buildVisuals, createRobot, collisions, DIM } from "./model.mjs";
import { exportModel } from "./export.mjs";

test("closed assembly matches published L/H/W without resizing the throat", () => {
  const { body, arm } = buildVisuals();
  const bounds = new THREE.Box3().setFromObject(body).union(new THREE.Box3().setFromObject(arm));
  const extent = bounds.getSize(new THREE.Vector3());
  for (const [axis, expected] of [["x", 1.161], ["y", 0.302], ["z", 0.532]]) {
    assert.ok(Math.abs(extent[axis] - expected) < 0.0001,
      `${axis} extent ${extent[axis]} != ${expected}; ${JSON.stringify(bounds)}`);
  }
  assert.ok(Math.abs((DIM.upperArmZ - DIM.conductorRadius) -
    (DIM.lowerArmZ + DIM.conductorRadius) - 0.160) < 1e-10);
  assert.ok(Math.abs(DIM.tip[0] - DIM.throatFront - 0.384) < 1e-10);
});

test("large frame windows are actual holes, not dark decals", () => {
  const { body } = buildVisuals();
  const mesh = body.getObjectByName("frame_cheek_right");
  mesh.updateMatrixWorld(true);
  const ray = new THREE.Raycaster(new THREE.Vector3(0.012, 1, 0.443), new THREE.Vector3(0, -1, 0));
  assert.equal(ray.intersectObject(mesh).length, 0);
  ray.ray.origin.set(-0.075, 1, 0.49);
  assert.ok(ray.intersectObject(mesh).length > 0);
});

test("the actual conductor surfaces leave the specified 160 mm throat", () => {
  const { body, arm } = buildVisuals();
  const ray = new THREE.Raycaster(new THREE.Vector3(0.37, 0, 0.36), new THREE.Vector3(0, 0, -1));
  const bottom = ray.intersectObject(body.getObjectByName("fixed_copper_arm"))[0];
  ray.ray.direction.set(0, 0, 1);
  const top = ray.intersectObject(arm.getObjectByName("moving_copper_arm"))[0];
  assert.ok(bottom && top);
  assert.ok(Math.abs(top.point.z - bottom.point.z - 0.160) < 0.0001);
});

test("legacy mount/TCP and opening direction remain explicit", () => {
  const tip = new THREE.Vector3(...DIM.movingTip).sub(new THREE.Vector3(...DIM.pivot));
  tip.applyAxisAngle(new THREE.Vector3(0, -1, 0), DIM.qOpen).add(new THREE.Vector3(...DIM.pivot));
  const travel = tip.z - DIM.movingTip[2];
  assert.ok(Math.abs(travel - 0.179) < 0.0002);
  assert.ok(tip.z > DIM.tip[2]);
  const { inertial } = createRobot();
  assert.ok(Math.abs(inertial.body.mass + inertial.electrode_arm.mass - 95.5) < 1e-8);
  for (const i of Object.values(inertial)) assert.ok(i.diagonalInertia.every(v => v > 0));
});

test("collision stays analytic and services never close the throat", () => {
  assert.ok(collisions().every(c => ["box", "cylinder"].includes(c.kind)));
  assert.ok(collisions().every(c => !/hose|coolant|shunt|cable/.test(c.name)));
  const { usda } = exportModel();
  const layer = parseUsda(usda);
  const root = layer.prims.find(p => p.name === "weld_gun_x16005");
  const shapes = root.children.flatMap(p => p.children).filter(p => p.name.startsWith("collision_"));
  assert.equal(shapes.length, 17);
  assert.ok(shapes.every(p => ["Cube", "Cylinder"].includes(p.typeName)));
  assert.ok(usda.includes("UsdPreviewSurface"));
  assert.ok(usda.includes("normals"));
  assert.ok(usda.includes("physxJoint:maxJointVelocity"));
});

test("export is deterministic", () => {
  assert.equal(exportModel().usda, exportModel().usda);
});
