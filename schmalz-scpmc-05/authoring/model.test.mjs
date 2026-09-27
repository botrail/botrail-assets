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
test('TCP measures from the mounting shoulder, not the thread end',()=>{
 const s=referenceScene(definition());near(s.links.get('tcp').getWorldPosition(new THREE.Vector3()).z,0);
});
