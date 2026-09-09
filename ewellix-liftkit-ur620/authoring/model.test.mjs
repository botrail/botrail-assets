import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {definition,dimensions} from './model.mjs';

test('620 column preserves the installed datum and totals 800 mm at at most 80 mm/s',()=>{
  const d=definition(),s=referenceScene(d);
  assert.equal(d.joints.filter(j=>j.type==='prismatic'&&!j.mimic).length,1);
  for(const [q,z] of [[0,.905],[.2,1.305],[.4,1.705]]) {
    s.pose({lift_lower_joint:q});
    assert.ok(Math.abs(s.links.get('lift_mount').getWorldPosition(new THREE.Vector3()).z-z)<1e-12);
  }
  const stages=d.joints.filter(j=>j.type==='prismatic');
  assert.equal(stages.reduce((sum,j)=>sum+j.limit.velocity,0),.08);
  assert.equal(dimensions.retracted+dimensions.basePlate+dimensions.topPlate,.905);
  assert.ok(dimensions.widths[0]-.006>dimensions.widths[1]);
  assert.ok(dimensions.widths[1]-.006>dimensions.widths[2]);
  for(const name of ['lift_base_link','lift_lower_link','lift_upper_link'])
    assert.equal(d.links.find(l=>l.name===name).collisions.length,4);
  assert.ok(d.links.every(l=>!l.inertial),'unverified stage inertias must remain absent');
});
