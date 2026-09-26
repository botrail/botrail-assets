import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {definition, DIM} from './model.mjs';

const d = Math.PI / 180;
const at = (s, name) => s.links.get(name).getWorldPosition(new THREE.Vector3());
const close = (p, xyz, tol = 1e-6) => assert.ok(p.distanceTo(new THREE.Vector3(...xyz)) < tol, `${p.toArray()} vs ${xyz}`);

test('zero pose: faceplate 390 + 1300 + 255 forward, 1110 + 1220 - 159 up, +Z down', () => {
  const s = referenceScene(definition());
  close(at(s, 'flange'), [DIM.j2x + DIM.upper + DIM.wristX, 0, DIM.j2z + DIM.lower + DIM.wristZ]);
  const z = new THREE.Vector3(0, 0, 1).transformDirection(s.links.get('flange').matrixWorld);
  close(z, [0, 0, -1], 1e-12);
});

test('the operating space extremes of the data sheet', () => {
  const s = referenceScene(definition()), z = () => at(s, 'flange').z, x = () => at(s, 'flange').x;
  s.pose({J2: 0, J3: 10 * d}); assert.ok(Math.abs(z() - 2.397) < 0.001, `top ${z()}`);
  s.pose({J2: 100 * d, J3: -90 * d}); assert.ok(Math.abs(z() + 0.561) < 0.001, `bottom ${z()}`);
  s.pose({J2: 79 * d, J3: 0}); assert.ok(Math.abs(x() - 3.143) < 0.001, `reach ${x()}`);
});

test('the parallelograms close and keep the wrist level in any pose', () => {
  const s = referenceScene(definition());
  for (const [q2, q3] of [[0, 0], [60 * d, -30 * d], [-44 * d, -26 * d], [100 * d, -120 * d]]) {
    s.pose({J1: 0.4, J2: q2, J3: q3, J4: 0.9});
    const z = new THREE.Vector3(0, 0, 1).transformDirection(s.links.get('flange').matrixWorld);
    close(z, [0, 0, -1], 1e-9);
    // drive rod top meets the upper arm's rear lever; levelling rod meets the wrist
    const rodTop = new THREE.Vector3(0, 0, DIM.lower).applyMatrix4(s.links.get('rod_link').matrixWorld);
    const lever = new THREE.Vector3(-0.51, -0.40, 0.27).applyMatrix4(s.links.get('J3_link').matrixWorld);
    close(rodTop, lever.toArray(), 1e-9);
    const levelEnd = new THREE.Vector3(DIM.upper, 0, 0).applyMatrix4(s.links.get('level_upper_link').matrixWorld);
    const wristPin = new THREE.Vector3(0.485, 0, 0.279).applyMatrix4(s.links.get('wrist_link').matrixWorld);
    close(levelEnd, wristPin.toArray(), 1e-9);
  }
});

test('four commanded axes, passive links follow, primitive collisions, no fabricated dynamics', () => {
  const def = definition();
  assert.deepEqual(def.joints.filter(j => j.type === 'revolute').map(j => j.name), ['J1', 'J2', 'J3', 'J4']);
  for (const j of def.joints.filter(j => j.type === 'continuous')) assert.ok(['J2', 'J3'].includes(j.mimic.joint));
  assert.ok(def.links.every(l => !l.inertial));
  for (const l of def.links) for (const c of l.collisions ?? []) assert.ok(['box', 'cylinder'].includes(c.kind));
  // every link that draws something collides as a primitive, never as its mesh
  assert.ok(def.links.filter(l => l.visual).every(l => l.collisions?.length));
});
