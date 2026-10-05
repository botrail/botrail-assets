import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition,D} from './model.mjs';
test('2FG7 fingers inwards: 1 mm closed, 39 mm open, 145 mm overall',()=>{
  const d=definition(), s=referenceScene(d);
  const gap=q=>{s.pose({finger_joint:q});const a=new THREE.Box3().setFromObject(s.links.get('left_finger'));const b=new THREE.Box3().setFromObject(s.links.get('right_finger'));return b.min.x-a.max.x;};
  assert.ok(Math.abs(gap(0)-.001)<1e-9); assert.ok(Math.abs(gap(D.stroke)-.039)<1e-9);
  s.pose({finger_joint:0}); const all=new THREE.Box3().setFromObject(s.root);
  assert.ok(Math.abs(all.max.z-D.overall)<1e-6); assert.ok(Math.abs(all.max.x-all.min.x-D.width)<1e-6);
});
