import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition,D} from './model.mjs';
test('ARH350A fingers reach the published closed/open heights and 143 mm opening',()=>{
  const d=definition(), s=referenceScene(d);
  s.pose({finger_joint:0}); let b=new THREE.Box3().setFromObject(s.root);
  assert.ok(Math.abs(b.max.z-D.closedHeight)<.002,`closed height ${b.max.z}`);
  s.pose({finger_joint:D.swing}); const endZ=s.links.get('finger_1').localToWorld(new THREE.Vector3(0,0,D.finger)).z;
  assert.ok(Math.abs(endZ-D.openHeight)<.001,`open height ${endZ}`);
  const r=[1,2,3].map(i=>{const p=s.links.get(`finger_${i}`).localToWorld(new THREE.Vector3(0,0,D.finger));return Math.hypot(p.x,p.y);});
  assert.ok(Math.abs(2*r[0]-D.openDiameter)<.004,`open diameter ${2*r[0]}`);
  assert.ok(Math.abs(r[0]-r[1])<1e-9&&Math.abs(r[1]-r[2])<1e-9);
  assert.equal(d.joints.filter(j=>j.type!=='fixed'&&!j.mimic).length,1);
});
