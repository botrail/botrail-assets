import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition,D} from './model.mjs';
test('JMHZ2-16D attachments open from 17 to 27 mm and reach 135 mm',()=>{
  const d=definition(), s=referenceScene(d);
  const gap=q=>{s.pose({finger_joint:q});const a=new THREE.Box3().setFromObject(s.links.get('left_jaw'));const b=new THREE.Box3().setFromObject(s.links.get('right_jaw'));return b.min.x-a.max.x;};
  assert.ok(Math.abs(gap(0)-D.gapClosed)<1e-9); assert.ok(Math.abs(gap(D.stroke)-D.gapOpen)<1e-9);
  s.pose({finger_joint:0}); const all=new THREE.Box3().setFromObject(s.root);
  assert.ok(Math.abs(all.max.z-D.tip)<1e-6,`tip ${all.max.z}`);
  assert.ok(all.max.x-all.min.x<=.0855&&all.max.y-all.min.y<=.0725,`envelope ${all.max.x-all.min.x} x ${all.max.y-all.min.y}`);
});
