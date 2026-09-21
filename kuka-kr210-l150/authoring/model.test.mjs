import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {definition} from './model.mjs';

test('flange zero pose and outward normal preserve the r1 coordinate contract',()=>{
  const s=referenceScene(definition()),f=s.links.get('flange');
  const p=f.getWorldPosition(new THREE.Vector3());
  assert.ok(p.distanceTo(new THREE.Vector3(2.080001517,-0.00000014,1.94479176))<1e-8);
  const z=new THREE.Vector3(0,0,1).transformDirection(f.matrixWorld);
  assert.ok(z.distanceTo(new THREE.Vector3(1,0,0))<1e-12);
  assert.equal(s.links.get('base_link').getWorldPosition(new THREE.Vector3()).z,0);
});

test('A1 rotates the entire arm about its offset axis; A6 holds flange position',()=>{
  const s=referenceScene(definition()),p=()=>s.links.get('flange').getWorldPosition(new THREE.Vector3());
  const initial=p();s.pose({joint_a6:0.7});
  // tool0 is 0.23924 mm off A6: that small legacy offset is preserved.
  assert.ok(p().distanceTo(initial)<0.00048);
  s.pose({joint_a1:Math.PI/2});
  const expected=new THREE.Vector3(-0.00262-(initial.y-0.00097586),0.00097586+(initial.x+0.00262),initial.z);
  assert.ok(p().distanceTo(expected)<1e-10);
});

test('six axes and separate primitive collisions; no fabricated dynamics',()=>{
  const d=definition();
  assert.deepEqual(d.joints.filter(j=>j.type==='revolute').map(j=>j.name),
    ['joint_a1','joint_a2','joint_a3','joint_a4','joint_a5','joint_a6']);
  assert.ok(d.links.every(l=>!l.inertial));
  assert.ok(d.joints.every(j=>j.limit?.effort===undefined));
  assert.ok(d.links.filter(l=>l.visual).every(l=>l.collisions?.length));
  for(const l of d.links) for(const c of l.collisions??[]) assert.ok(['box','cylinder'].includes(c.kind));
});
