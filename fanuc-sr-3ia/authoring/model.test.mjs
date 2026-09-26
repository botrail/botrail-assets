import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {definition, DIM, FOOTPRINT, HOSE} from './model.mjs';

const d = Math.PI / 180;
const at = (s, name) => s.links.get(name).getWorldPosition(new THREE.Vector3());
const close = (p, xyz, tol = 1e-6) => assert.ok(p.distanceTo(new THREE.Vector3(...xyz)) < tol, `${p.toArray()} vs ${xyz}`);
const down = s => new THREE.Vector3(0, 0, 1).transformDirection(s.links.get('flange').matrixWorld);
// A link's own drawing: referenceScene adds the visual first, the child frames after.
const drawn = (s, name) => new THREE.Box3().setFromObject(s.links.get(name).children[0]);

test('zero pose: flange 200 + 200 forward, 150 over the mounting surface, +Z down', () => {
  const s = referenceScene(definition());
  close(at(s, 'flange'), [DIM.l1 + DIM.l2, 0, DIM.flangeZ]);
  close(at(s, 'tool0'), [0.400, 0, 0.150]);
  close(down(s), [0, 0, -1], 1e-12);
});

test('J3 lowers the flange by its 200 mm stroke, to 50 below the mounting surface', () => {
  const s = referenceScene(definition());
  s.pose({J3: DIM.stroke});
  close(at(s, 'flange'), [0.400, 0, -0.050]);
  // the flange stays level for any pose
  s.pose({J1: 1.1, J2: -2.0, J3: 0.13, J4: 7.0});
  close(down(s), [0, 0, -1], 1e-9);
});

test('J2 at its +-145 deg limits leaves the J4 axis R 120.3 from J1', () => {
  const s = referenceScene(definition());
  for (const q2 of [145 * d, -145 * d]) {
    s.pose({J1: 0.3, J2: q2});
    const p = at(s, 'flange');
    assert.ok(Math.abs(Math.hypot(p.x, p.y) - 0.1203) < 0.0005, `radius ${Math.hypot(p.x, p.y)}`);
  }
});

test('overall height 558: the spline shaft top at J3 = 0 is the highest point', () => {
  const s = referenceScene(definition());
  assert.ok(Math.abs(drawn(s, 'J3_link').max.z - DIM.height) < 1e-6, `shaft top ${drawn(s, 'J3_link').max.z}`);
  assert.ok(Math.abs(new THREE.Box3().setFromObject(s.root).max.z - DIM.height) < 1e-6);
});

test('the base collisions cover the published footprint', () => {
  const base = definition().links.find(l => l.name === 'base_link'), box = new THREE.Box3();
  for (const c of base.collisions) {
    const [hx, hy] = c.kind === 'box' ? [c.size[0] / 2, c.size[1] / 2] : [c.radius, c.radius];
    box.expandByPoint(new THREE.Vector3(c.xyz[0] - hx, c.xyz[1] - hy, 0));
    box.expandByPoint(new THREE.Vector3(c.xyz[0] + hx, c.xyz[1] + hy, 0));
  }
  close(box.min, [FOOTPRINT.rear, -FOOTPRINT.half, 0]);
  close(box.max, [FOOTPRINT.front, FOOTPRINT.half, 0]);
});

test('the three hose pieces meet on the J1 and J2 axes in any pose', () => {
  const s = referenceScene(definition());
  // hose points are authored in the zero-pose cell frame; the link's visual carries them
  const point = (link, [x, z]) => new THREE.Vector3(x, 0, z).applyMatrix4(s.links.get(link).children[0].matrixWorld);
  for (const [q1, q2] of [[0, 0], [142 * d, 0], [-1.2, 145 * d], [0.5, -145 * d], [-142 * d, 60 * d]]) {
    s.pose({J1: q1, J2: q2, J3: 0.2, J4: 3});
    // Q, on the J1 axis: base piece end = arm-1 piece start
    close(point('base_link', HOSE.rear.at(-1)), point('J1_link', HOSE.front[0]).toArray(), 1e-9);
    close(point('J1_link', HOSE.front[0]), HOSE.Q, 1e-9);
    // P, on the J2 axis: arm-1 piece end = head stub start, both running vertical
    close(point('J1_link', HOSE.front.at(-1)), point('J2_link', HOSE.stub[0]).toArray(), 1e-9);
    const inbound = point('J1_link', HOSE.front.at(-1)).sub(point('J1_link', HOSE.front.at(-2))).normalize();
    const outbound = point('J2_link', HOSE.stub[1]).sub(point('J2_link', HOSE.stub[0])).normalize();
    close(inbound, [0, 0, -1], 1e-9); close(outbound, [0, 0, -1], 1e-9);
  }
});

test('four commanded axes, primitive collisions on every drawn link, no fabricated dynamics', () => {
  const def = definition(), moving = def.joints.filter(j => j.type !== 'fixed');
  assert.deepEqual(moving.map(j => [j.name, j.type]),
    [['J1', 'revolute'], ['J2', 'revolute'], ['J3', 'prismatic'], ['J4', 'revolute']]);
  assert.ok(moving.every(j => !j.mimic));
  const j3 = moving[2].limit, j4 = moving[3].limit;
  assert.deepEqual([j3.lower, j3.upper, j3.velocity], [0, 0.2, 1.8]);
  assert.ok(Math.abs(j4.upper - 4 * Math.PI) < 1e-12 && Math.abs(j4.lower + 4 * Math.PI) < 1e-12);
  assert.ok(def.links.every(l => !l.inertial));
  for (const l of def.links) for (const c of l.collisions ?? []) assert.ok(['box', 'cylinder'].includes(c.kind));
  // every link that draws something collides as a primitive, never as its mesh
  assert.ok(def.links.filter(l => l.visual).every(l => l.collisions?.length));
});
