import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition,variants,V} from './model.mjs';
test('CKD UR grippers keep the listed envelopes and published strokes',()=>{
  for(const sku of variants){
    const v=V[sku], d=definition(sku), s=referenceScene(d);
    s.pose({finger_joint:0}); const b=new THREE.Box3().setFromObject(s.root);
    assert.ok(Math.abs(b.max.z-v.height)<1e-6,`${sku} height ${b.max.z}`);
    if(v.jaws===2){
      const gap=q=>{s.pose({finger_joint:q});const a=new THREE.Box3().setFromObject(s.links.get('left_jaw'));const c=new THREE.Box3().setFromObject(s.links.get('right_jaw'));return c.min.x-a.max.x;};
      assert.ok(Math.abs(gap(v.stroke)-gap(0)-2*v.stroke)<1e-9,`${sku} stroke`);
    } else {
      const r=q=>{s.pose({finger_joint:q});return s.links.get('jaw_1_contact').getWorldPosition(new THREE.Vector3()).length();};
      assert.ok(Math.abs(Math.hypot(r(v.stroke))-Math.hypot(r(0)))>0);
    }
    assert.equal(d.joints.filter(j=>j.type!=='fixed'&&!j.mimic).length,1);
  }
});
