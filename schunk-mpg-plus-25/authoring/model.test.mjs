import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition} from './model.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('reference has SI geometry, fixed mount/TCP and analytic collision',()=>{
 const d=definition(),s=referenceScene(d),b=new THREE.Box3().setFromObject(s.root);
 assert.ok(b.getSize(new THREE.Vector3()).length()<.2);
 assert.ok(d.links.find(x=>x.name==='mount'));
 assert.ok(d.joints.find(x=>x.child==='tcp'&&x.type==='fixed'));
 assert.ok(d.links.flatMap(x=>x.collisions??[]).every(x=>['box','cylinder'].includes(x.kind)));
});
test('both physical jaws travel symmetrically through the rated stroke',()=>{
 const s=referenceScene(definition());
 const before=['left_contact','right_contact'].map(n=>s.links.get(n).getWorldPosition(new THREE.Vector3()));
 s.pose({finger_joint:0.003});
 const after=['left_contact','right_contact'].map(n=>s.links.get(n).getWorldPosition(new THREE.Vector3()));
 near(after[0].x-before[0].x,0.003);near(after[1].x-before[1].x,-0.003);
 near(after[0].x+after[1].x,0);near(after[0].z,after[1].z);
});
