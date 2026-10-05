import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition,D} from './model.mjs';
test('AX base keeps the published footprint, height and 1500 mm stroke',()=>{
  const d=definition(), s=referenceScene(d);
  s.pose({lift_joint:0}); const b=new THREE.Box3().setFromObject(s.root);
  assert.ok(Math.abs(b.max.x-b.min.x-D.base[0])<.001&&Math.abs(b.max.y-b.min.y-D.base[1])<.001,`footprint ${b.max.x-b.min.x} x ${b.max.y-b.min.y}`);
  assert.ok(Math.abs(b.max.z-D.height)<.001,`height ${b.max.z}`);
  const z0=s.links.get('robot_mount').getWorldPosition(new THREE.Vector3()).z;
  s.pose({lift_joint:D.stroke}); const z1=s.links.get('robot_mount').getWorldPosition(new THREE.Vector3()).z;
  assert.ok(Math.abs(z1-z0-D.stroke)<1e-9); assert.ok(Math.abs(z0-D.plateZ0)<1e-9,`plate z0 ${z0}`);
  assert.ok(z1<D.height,'plate stays below the column top');
});
