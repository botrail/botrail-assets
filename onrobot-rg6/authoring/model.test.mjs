import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {definition} from './model.mjs';

test('RG6 pads stay parallel, close without overlap, and traverse the published 160 mm stroke',()=>{
  const d=definition(), s=referenceScene(d), p='rg6_v2_gripper';
  assert.equal(d.joints.filter(j=>j.type!=='fixed'&&!j.mimic).length,1);
  const gaps=[];
  for(let n=0;n<=26;n++) {
    s.pose({[`${p}_joint`]:n*.05});
    const a=new THREE.Box3().setFromObject(s.links.get(`${p}_finger_1_flex_finger`));
    const b=new THREE.Box3().setFromObject(s.links.get(`${p}_finger_2_flex_finger`));
    gaps.push(b.min.x-a.max.x);
    assert.ok(b.min.x-a.max.x>=-1e-8);
    assert.ok(Math.abs(a.getSize(new THREE.Vector3()).x-.0084)<1e-8);
    if(n>0) assert.ok(gaps[n]<gaps[n-1]);
  }
  assert.ok(Math.abs(gaps[0]-.160)<.00005,`open gap ${gaps[0]}`);
  assert.ok(Math.abs(gaps.at(-1))<1e-8);
  const bounds=new THREE.Box3().setFromObject(s.root);
  assert.ok(Math.abs(bounds.max.z-.262)<1e-6,`closed tip ${bounds.max.z}`);
  assert.ok(Math.abs(s.links.get('tcp').getWorldPosition(new THREE.Vector3()).z-.2681)<1e-12);
  assert.ok(d.links.every(l=>(l.collisions??[]).every(c=>c.kind==='box')));
});
