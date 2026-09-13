import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {definition,dimensions} from './model.mjs';

test('pallet seat sits 154 mm over the mount plane and lifts 60 mm in 4 s',()=>{
  const d=definition(),s=referenceScene(d);
  const seat=()=>s.links.get('pallet').getWorldPosition(new THREE.Vector3()).z;
  s.pose({lift:0}); assert.ok(Math.abs(seat()-dimensions.height)<1e-12);
  s.pose({lift:dimensions.stroke}); assert.ok(Math.abs(seat()-(dimensions.height+0.060))<1e-12);
  const lift=d.joints.find(j=>j.name==='lift');
  assert.equal(lift.type,'prismatic'); assert.equal(lift.limit.upper,0.060);
  assert.ok(Math.abs(lift.limit.velocity-0.015)<1e-9);
  const frame=d.links.find(l=>l.name==='frame');
  assert.deepEqual(frame.collisions[0].size,[1.371,0.853,0.067]);
  assert.equal(d.links.find(l=>l.name==='platform').collisions.length,2);
  assert.ok(d.links.every(l=>!l.inertial));
});
