import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { binaryStl, liftingEye, visualUsd, wireGrid } from '../equipment-meshes.mjs';
import { grid, WIDTHS, HEIGHTS, outputs } from '../../x-guard-classic/authoring/export.mjs';
import { eye } from '../../nito-fz/authoring/export.mjs';

test('all 52 grids keep native size and at most 1200 triangles, in one geometry', () => {
  assert.equal(WIDTHS.length * HEIGHTS.length, 52);
  for (const w of WIDTHS) for (const h of HEIGHTS) {
    const g = grid(w, h); g.computeBoundingBox();
    const size = g.boundingBox.getSize(new THREE.Vector3());
    assert.ok(Math.abs(size.x - (w - 60) / 1000) < 1e-6);
    assert.ok(Math.abs(size.z - (h - 60) / 1000) < 1e-6);
    assert.ok(g.userData.triangles <= 1200);
    assert.equal(g.index.count / 3, g.userData.triangles);
    assert.equal(binaryStl(g).length, 84 + 50 * g.userData.triangles);
  }
});
test('apertures are open geometry, not an opaque sheet or coarse five-wire substitute', () => {
  const geometry = grid(1000, 2200);
  assert.equal(geometry.userData.verticalWires, 18);
  assert.equal(geometry.userData.horizontalWires, 66);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({side: THREE.DoubleSide}));
  mesh.updateMatrixWorld(true);
  const ray = x => new THREE.Raycaster(new THREE.Vector3(x, -1, 0), new THREE.Vector3(0, 1, 0));
  assert.equal(ray(0).intersectObject(mesh).length, 0);
  assert.ok(ray(0.0265).intersectObject(mesh).length > 0);
});
test('unsupported grid sizes are refused instead of scaled', () => {
  assert.throws(() => grid(1050, 2200), /unsupported/);
  assert.throws(() => grid(1000, 2300), /unsupported/);
  assert.throws(() => wireGrid({width: NaN}), /positive/);
});
test('mesh generation is deterministic', () => {
  const a = outputs(), b = outputs();
  for (let i = 0; i < a.length; i++) assert.ok(a[i][1].equals(b[i][1]));
  assert.ok(binaryStl(eye()).equals(binaryStl(eye())));
});
test('lifting eye has a real bore and a 52 mm height', () => {
  const geometry = eye(); geometry.computeBoundingBox();
  assert.ok(Math.abs(geometry.boundingBox.min.z) < 1e-7);
  assert.ok(Math.abs(geometry.boundingBox.max.z - 0.052) < 1e-7);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({side: THREE.DoubleSide}));
  mesh.updateMatrixWorld(true);
  const ray = new THREE.Raycaster(new THREE.Vector3(0, -1, 0.036), new THREE.Vector3(0, 1, 0));
  assert.equal(ray.intersectObject(mesh).length, 0);
  assert.throws(() => liftingEye({outerRadius: 1, innerRadius: 2, thickness: 1, totalHeight: 3}), /invalid/);
});
test('both shapes export through three-usd-robot in metres without physics claims', () => {
  for (const [name, shape] of [['grid', grid(1000, 2200)], ['eye', eye()]]) {
    const usd = visualUsd(name, shape);
    assert.match(usd, /metersPerUnit = 1/);
    assert.match(usd, /def Mesh/);
    assert.doesNotMatch(usd, /PhysicsCollisionAPI/);
  }
});
