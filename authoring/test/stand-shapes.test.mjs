import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE, group} from '../tool-shapes.mjs';
import {profile, caster, knobAdjuster, padAdjuster, uHandle} from '../stand-shapes.mjs';

const bounds = g => { g.updateMatrixWorld(true); return new THREE.Box3().setFromObject(g); };
const near = (a, b, tolerance = 1e-6) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);

test('a profile keeps its section and length along each axis; slot lines add 0.3 mm a side', () => {
  for (const [axis, want] of [['x', [.5, .09, .06]], ['y', [.09, .5, .06]], ['z', [.09, .06, .5]]]) {
    const g = group();
    profile(g, 'member', axis, .5, [.09, .06], [.1, .2, .3]);
    const size = bounds(g).getSize(new THREE.Vector3()).toArray(), k = 'xyz'.indexOf(axis);
    size.forEach((v, n) => near(v, want[n] + (n === k ? 0 : .0006)));
    near(bounds(g).getCenter(new THREE.Vector3()).z, .3);
  }
  assert.throws(() => profile(group(), 'member', 'w', 1, [.03, .03], [0, 0, 0]), RangeError);
});

test('slot counts follow the 30 mm module unless the model states them', () => {
  const count = options => { const g = group(); profile(g, 'm', 'z', .3, [.06, .09], [0, 0, 0], options); return g.children.length - 1; };
  assert.equal(count(), 2 * (2 + 3));
  assert.equal(count({slots: [1, 1]}), 4);
});

test('a caster stands on the floor under its mounting face and rolls the way it is told', () => {
  for (const roll of ['x', 'y']) {
    const g = group(); caster(g, 'c', [.2, .1, .132], .0375, {roll});
    const b = bounds(g); near(b.min.z, 0); near(b.max.z, .132);
    const wheel = new THREE.Box3().setFromObject(g.getObjectByName('c_wheel')).getSize(new THREE.Vector3());
    near(roll === 'y' ? wheel.x : wheel.y, .026);
  }
  assert.throws(() => caster(group(), 'c', [0, 0, .05], .0375), RangeError);
});

test('adjusters reach from the floor to the stated height; the knob stays inside its radius', () => {
  const g = group(); knobAdjuster(g, 'k', [.3, -.2], .192);
  const b = bounds(g); near(b.min.z, 0); near(b.max.z, .192 + .03);
  near(b.max.x, .3 + .03); near(b.min.x, .3 - .03);
  const p = group(); padAdjuster(p, 'p', [0, 0], .084);
  near(bounds(p).max.z, .084); near(bounds(p).max.x, .0375);
});

test('a U handle spans its two feet and stands out by reach + radius', () => {
  const g = group(); uHandle(g, 'h', [-.1, 0, .8], [.1, 0, .8], [0, 0, 1], .045, .008);
  const b = bounds(g); near(b.max.z, .8 + .045 + .008); near(b.min.x, -.108); near(b.max.x, .108);
});
