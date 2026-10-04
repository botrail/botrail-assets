import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {definition,dimensions} from './model.mjs';

test('Racrew keeps its published envelope and the deck frame on the turntable',()=>{
  const d=definition(),s=referenceScene(d);
  const z=name=>s.links.get(name).getWorldPosition(new THREE.Vector3()).z;
  assert.ok(Math.abs(z('deck')-0.380)<1e-12,'the deck frame at the published height');
  // everything drawn stays inside the published 990 x 916 x 380, bumpers included
  const bounds=new THREE.Box3().setFromObject(s.root);
  const size=bounds.getSize(new THREE.Vector3());
  assert.ok(Math.abs(size.x-dimensions.length)<0.002,`length ${size.x}`);
  assert.ok(Math.abs(size.y-dimensions.width)<0.004,`width ${size.y}`);
  assert.ok(Math.abs(bounds.max.z-dimensions.height)<0.0015,`height ${bounds.max.z}`);
  assert.ok(bounds.min.z>=dimensions.clearance-1e-9,'nothing below the ground clearance');
  const body=d.links.find(l=>l.name==='base_link');
  assert.deepEqual(body.collisions[0].size,[0.990,0.916,0.380-0.015]);
  assert.ok(Math.abs(body.collisions[0].xyz[2]-body.collisions[0].size[2]/2-dimensions.clearance)<1e-12);
  assert.ok(d.joints.every(j=>j.type==='fixed'),'no joint: the lift stroke and the turntable are not published');
  assert.ok(d.links.every(l=>!l.inertial),'unverified inertias must remain absent');
});
