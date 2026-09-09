import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {definition,dimensions} from './model.mjs';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';

for(const type of Object.keys(dimensions)) test(`${type}: separate joint links and ISO contact plane`,()=>{
  const d=definition(type), s=referenceScene(d);
  assert.equal(d.joints.filter(j=>j.type==='revolute').length,6);
  assert.equal(d.links.filter(l=>l.visual).length,7);
  for(const link of d.links.filter(l=>l.visual)) {
    const bounds=new THREE.Box3().setFromObject(link.visual),size=bounds.getSize(new THREE.Vector3());
    assert.ok(size.toArray().every(x=>Number.isFinite(x)&&x>0));
    assert.ok(link.collisions.length>0);
  }
  const face=d.links.find(l=>l.name==='wrist_3_link').visual.getObjectByName('tool_face');
  assert.ok(Math.abs(new THREE.Box3().setFromObject(face).max.z)<1e-8);
  const initial=s.links.get('tool0').getWorldPosition(new THREE.Vector3());
  s.pose({shoulder_lift_joint:-Math.PI/2,elbow_joint:Math.PI/2});
  assert.ok(initial.distanceTo(s.links.get('tool0').getWorldPosition(new THREE.Vector3()))>.3);
});
