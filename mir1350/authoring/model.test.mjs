import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {definition,dimensions} from './model.mjs';

test('MiR1350 keeps its published envelope and the interface frames',()=>{
  const d=definition(),s=referenceScene(d);
  const z=name=>s.links.get(name).getWorldPosition(new THREE.Vector3()).z;
  assert.ok(Math.abs(z('deck')-0.192)<1e-12);
  assert.ok(Math.abs(z('cover_top')-dimensions.height)<1e-12);
  assert.equal(dimensions.height,0.322);
  const body=d.links.find(l=>l.name==='base_link'), cover=d.links.find(l=>l.name==='top_cover');
  assert.deepEqual(body.collisions[0].size.slice(0,2),[1.350,0.910]);
  // Chassis box + cover box stack exactly from the ground clearance to the published height.
  const top=cover.collisions[0].xyz[2]+cover.collisions[0].size[2]/2+dimensions.deck;
  assert.ok(Math.abs(top-dimensions.height)<1e-12);
  assert.ok(Math.abs(body.collisions[0].xyz[2]-body.collisions[0].size[2]/2-dimensions.clearance)<1e-12);
  assert.equal(d.joints.filter(j=>j.type==='continuous').length,6);
  assert.ok(d.links.filter(l=>l.name.endsWith('wheel_link')).every(l=>!l.collisions),'wheels are visual only');
  assert.ok(d.links.every(l=>!l.inertial),'unverified inertias must remain absent');
});
