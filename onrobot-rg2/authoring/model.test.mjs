import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition,dimensions} from './model.mjs';

// The legacy closedLength datum (213 mm, shoulder to bare tip) stays distinct from the
// visible boot tip. TCP and contact boxes follow the boots (contract test).
// Strict URDF hashes, continuous analytic stroke and 1001-pose pivot checks:
// node --test authoring/test/onrobot-contract.test.mjs
const visualBoot=[.0114,.0202,.0298], visualClosedTip=.232;
test('RG2 visible boots stay parallel, touch at closure and retain 110 mm contact travel',()=>{
  const d=definition(),s=referenceScene(d),p='rg2_v2_gripper',gaps=[];
  assert.equal(d.joints.filter(j=>j.type!=='fixed'&&!j.mimic).length,1);
  for(let n=0;n<=100;n++) {
    s.pose({[`${p}_joint`]:n*dimensions.upper/100});
    const a=new THREE.Box3().setFromObject(s.links.get(`${p}_finger_1_flex_finger`));
    const b=new THREE.Box3().setFromObject(s.links.get(`${p}_finger_2_flex_finger`));
    const gap=b.min.x-a.max.x;gaps.push(gap);
    assert.ok(gap>=-1e-8,`Pad overlap at step ${n}`);
    const size=a.getSize(new THREE.Vector3()).toArray();
    for(let axis=0;axis<3;axis++) assert.ok(Math.abs(size[axis]-visualBoot[axis])<1e-8,`Boot axis ${axis}`);
    if(n>0)assert.ok(gap<gaps[n-1]);
  }
  assert.ok(Math.abs(gaps[0]-.110)<1e-6,`Open gap ${gaps[0]}`);
  assert.ok(Math.abs(gaps.at(-1))<1e-8,`Closed gap ${gaps.at(-1)}`);
  const bounds=new THREE.Box3().setFromObject(s.root);
  assert.ok(Math.abs(bounds.min.z)<1e-8,`Visible mounting face must meet mount z=0: ${bounds.min.z}`);
  assert.ok(Math.abs(bounds.max.z-visualClosedTip)<1e-6,`Visible tip from mount ${bounds.max.z}`);
  assert.equal(dimensions.closedLength,.213,'Keep the legacy datum distinct from visual height');
  assert.ok(Math.abs(s.links.get('tcp').getWorldPosition(new THREE.Vector3()).z-.2171)<1e-12);
  assert.ok(d.links.every(l=>(l.collisions??[]).every(c=>c.kind==='box'||c.kind==='cylinder')));
});
