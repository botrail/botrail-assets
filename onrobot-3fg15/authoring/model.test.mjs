import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition,D,open} from './model.mjs';
test('3FG15 fingertips span 4 mm closed to 152 mm open and reach 156.5 mm',()=>{
  const d=definition(), s=referenceScene(d);
  const radius=q=>{s.pose({finger_joint:q});return [1,2,3].map(i=>{const p=s.links.get(`finger_${i}_tip`).getWorldPosition(new THREE.Vector3());return Math.hypot(p.x,p.y);});};
  const c=radius(0), o=radius(open);
  assert.ok(c.every(r=>Math.abs(2*(r-D.tipR)-D.closedDiameter)<1e-6),`closed ${c}`);
  assert.ok(o.every(r=>Math.abs(2*(r-D.tipR)-D.openDiameter)<1e-6),`open ${o}`);
  s.pose({finger_joint:0}); const b=new THREE.Box3().setFromObject(s.root);
  assert.ok(Math.abs(b.max.z-D.overall)<1e-6,`overall ${b.max.z}`);
  s.pose({finger_joint:open}); const w=new THREE.Box3().setFromObject(s.root);
  assert.ok(w.max.x-w.min.x<.185&&w.max.y-w.min.y<.185,'sweep inside Ø180.5');
});
