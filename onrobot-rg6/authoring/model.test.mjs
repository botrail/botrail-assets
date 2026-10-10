import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition,dimensions} from './model.mjs';

// Visible boot dimensions and envelope are deliberately separate from the
// frozen legacy collision proxy, whose closedLength remains 262 mm.
// Strict URDF hashes, continuous analytic stroke and 1001-pose pivot checks:
// node --test authoring/test/onrobot-contract.test.mjs
const visualBoot=[.01315,.025,.037], visualClosedTip=.291;
test('RG6 visible boots stay parallel, touch at closure and retain 160 mm contact travel',()=>{
  const d=definition(),s=referenceScene(d),p='rg6_v2_gripper',gaps=[];
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
  assert.ok(Math.abs(gaps[0]-.160)<1e-6,`Open gap ${gaps[0]}`);
  assert.ok(Math.abs(gaps.at(-1))<1e-8,`Closed gap ${gaps.at(-1)}`);
  const bounds=new THREE.Box3().setFromObject(s.root);
  assert.ok(Math.abs(bounds.min.z)<1e-8,`Visible mounting face must meet mount z=0: ${bounds.min.z}`);
  assert.ok(Math.abs(bounds.max.z-visualClosedTip)<1e-6,`Visible tip from mount ${bounds.max.z}`);
  assert.equal(dimensions.closedLength,.262,'Keep the legacy datum distinct from visual height');
  assert.ok(Math.abs(s.links.get('tcp').getWorldPosition(new THREE.Vector3()).z-.2681)<1e-12);
  assert.ok(d.links.every(l=>(l.collisions??[]).every(c=>c.kind==='box')));
});
