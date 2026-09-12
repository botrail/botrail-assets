import test from 'node:test';
import assert from 'node:assert/strict';
import {definition} from './model.mjs';
import {definition as changer} from '../../onrobot-dual-quick-changer-109878/authoring/model.mjs';
import {definition as extender} from '../../onrobot-bit-extender-109301/authoring/model.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {THREE} from '../../authoring/tool-shapes.mjs';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
test('two real mounting faces, 120 degrees apart, within 127 mm drawing width', () => {
  const d = changer(), [a, b] = d.joints;
  near(Math.cos(a.rpy[1] - b.rpy[1]), -.5);
  near(a.xyz[0] - b.xyz[0] + .071 * Math.cos(Math.PI / 3), .127);
  near(a.xyz[2] + .0355 * Math.sin(Math.PI / 3), .0935);
  assert.deepEqual(d.links.map(l => l.name), ['mount', 'flange_a', 'flange_b']);
});
test('the base screwdriver preserves the public static dimensions', () => {
  const d = definition();
  const g = new THREE.Group();
  for (const l of d.links.filter(l => ['body', 'nose'].includes(l.name))) g.add(l.visual);
  const b = new THREE.Box3().setFromObject(g), size = b.getSize(new THREE.Vector3());
  // BufferGeometry positions use float32.
  for (const [actual, expected] of [[size.x, .3085], [size.y, .086], [size.z, .114]]) {
    assert.ok(Math.abs(actual - expected) < .0005);
  }
  // The thin label protrudes 0.2 mm from the nominal shell surface.
  assert.ok(d.links.every(l => !l.inertial));
});
test('55 mm feed follows the side-mounted screw axis and extension adds 50 mm', () => {
  for (const extension of [0, .050]) {
    const d = definition(extension), feed = d.joints.find(j => j.name === 'shank');
    near(feed.limit.upper, .055); near(feed.xyz[0], .1531 - .017 + extension);
    const scene = referenceScene(d);
    scene.pose({shank: 0}); scene.root.updateMatrixWorld(true);
    const tip = scene.root.getObjectByName('tip');
    const p0 = tip.getWorldPosition(new THREE.Vector3());
    scene.pose({shank: .055}); scene.root.updateMatrixWorld(true);
    const p1 = tip.getWorldPosition(new THREE.Vector3());
    near(p1.x - p0.x, .055); near(p1.y, p0.y); near(p1.z, p0.z);
  }
  assert.throws(() => definition(.100));
  near(extender().joints[0].xyz[2], .050);
});
