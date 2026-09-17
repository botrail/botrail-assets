import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {definition,dimensions} from './model.mjs';

test('AUBO-AMR300 keeps its published envelope and the mounting frames',()=>{
  const d=definition(),s=referenceScene(d);
  const at=name=>s.links.get(name).getWorldPosition(new THREE.Vector3());
  assert.equal(dimensions.height,0.600);
  assert.ok(Math.abs(at('deck').z-dimensions.height)<1e-12);
  assert.ok(Math.abs(at('load_surface').z-dimensions.height)<1e-12);
  assert.ok(Math.abs(at('arm_mount').z-dimensions.height)<1e-12);
  assert.ok(Math.abs(at('arm_mount').x-dimensions.armMountX)<1e-12);
  assert.deepEqual(dimensions.loadSurface,[0.650,0.620]);
  const body=d.links.find(l=>l.name==='base_link');
  const [skirt,shell]=body.collisions;
  // The shell box is the published footprint; skirt and shell boxes stack from the ground
  // clearance to the published height with no gap.
  assert.deepEqual(shell.size.slice(0,2),[1.000,0.700]);
  assert.ok(Math.abs(skirt.xyz[2]-skirt.size[2]/2-dimensions.clearance)<1e-12);
  assert.ok(Math.abs((skirt.xyz[2]+skirt.size[2]/2)-(shell.xyz[2]-shell.size[2]/2))<1e-12);
  assert.ok(Math.abs(shell.xyz[2]+shell.size[2]/2-dimensions.height)<1e-12);
  assert.equal(d.joints.filter(j=>j.type==='continuous').length,6);
  assert.ok(d.links.filter(l=>l.name.endsWith('wheel_link')).every(l=>!l.collisions),'wheels are visual only');
  assert.ok(d.links.every(l=>!l.inertial),'unverified inertias must remain absent');
  // Wheels touch the floor: each wheel centre sits one radius above base_footprint.
  for(const j of d.joints.filter(j=>j.type==='continuous')) {
    const r=j.child.includes('caster')?dimensions.casterRadius:dimensions.driveWheelRadius;
    assert.ok(Math.abs(j.xyz[2]-r)<1e-12,j.name);
  }
});
