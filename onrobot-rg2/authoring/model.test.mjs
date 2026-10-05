import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition,dimensions} from './model.mjs';

test('RG2 pads stay parallel, close without overlap, and traverse the published 110 mm stroke',()=>{
  const d=definition(), s=referenceScene(d), p='rg2_v2_gripper';
  assert.equal(d.joints.filter(j=>j.type!=='fixed'&&!j.mimic).length,1);
  const gaps=[], steps=26;
  for(let n=0;n<=steps;n++) {
    s.pose({[`${p}_joint`]:n*dimensions.upper/steps});
    const a=new THREE.Box3().setFromObject(s.links.get(`${p}_finger_1_flex_finger`));
    const b=new THREE.Box3().setFromObject(s.links.get(`${p}_finger_2_flex_finger`));
    gaps.push(b.min.x-a.max.x);
    assert.ok(b.min.x-a.max.x>=-1e-8);
    assert.ok(Math.abs(a.getSize(new THREE.Vector3()).x-dimensions.pad[0])<1e-8);
    if(n>0) assert.ok(gaps[n]<gaps[n-1]);
  }
  assert.ok(Math.abs(gaps[0]-dimensions.stroke)<.00005,`open gap ${gaps[0]}`);
  assert.ok(Math.abs(gaps.at(-1))<1e-8,`closed gap ${gaps.at(-1)}`);
  const bounds=new THREE.Box3().setFromObject(s.root);
  assert.ok(Math.abs(bounds.max.z-dimensions.closedLength)<1e-6,`closed tip ${bounds.max.z}`);
  assert.ok(bounds.max.z-bounds.min.z<=dimensions.closedLength+1e-6);
  s.pose({[`${p}_joint`]:0});
  const open=new THREE.Box3().setFromObject(s.root);
  assert.ok(open.max.x-open.min.x<.160,`open width ${open.max.x-open.min.x}`);
  assert.ok(Math.abs(s.links.get('tcp').getWorldPosition(new THREE.Vector3()).z-(dimensions.closedLength-dimensions.pad[2]/2))<1e-12);
  assert.ok(d.links.every(l=>(l.collisions??[]).every(c=>c.kind==='box'||c.kind==='cylinder')));
});
