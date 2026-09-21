import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {definition} from './model.mjs';

test('actual meshes stay inside the published 800 x 580 x 300 mm envelope',()=>{
  const s=referenceScene(definition());
  for(const angle of [0,Math.PI/4,Math.PI/2,3*Math.PI/4,Math.PI]) {
    const pose=Object.fromEntries(['fl','fr','bl','br'].map(tag=>[`${tag}_caster_rotation_joint`,angle]));
    s.pose(pose);
    const bounds=new THREE.Box3().setFromObject(s.root,true),size=bounds.getSize(new THREE.Vector3());
    assert.ok(Math.abs(size.x-0.800)<1e-6);
    assert.ok(Math.abs(size.y-0.580)<1e-6);
    assert.ok(Math.abs(bounds.min.z)<1e-6);
    assert.ok(Math.abs(bounds.max.z-0.300)<1e-6);
  }
  for(const name of ['deck','surface']) {
    assert.deepEqual(s.links.get(name).getWorldPosition(new THREE.Vector3()).toArray(),[0,0,0.3]);
  }
});

test('ten wheel axes move independently while deck stays on the chassis',()=>{
  const d=definition(),s=referenceScene(d);
  assert.equal(d.joints.filter(j=>j.type==='continuous').length,10);
  const left=s.links.get('left_wheel_link'),before=left.getWorldQuaternion(new THREE.Quaternion());
  s.pose({left_wheel_joint:1,fl_caster_rotation_joint:Math.PI/2});
  assert.ok(before.angleTo(left.getWorldQuaternion(new THREE.Quaternion()))>0.99);
  const caster=s.links.get('fl_caster_wheel_link').getWorldPosition(new THREE.Vector3());
  assert.ok(caster.distanceTo(new THREE.Vector3(0.295,0.188-0.0382,0.0625))<1e-12);
  const c=d.links.find(l=>l.name==='base_link').collisions[0];
  assert.ok(Math.abs(c.xyz[2]-c.size[2]/2-0.025)<1e-12);
  assert.ok(d.links.filter(l=>l.name!=='base_link').every(l=>!l.collisions));
  assert.ok(d.links.every(l=>!l.inertial));
  assert.ok(d.joints.every(j=>j.limit?.effort===undefined));
});
