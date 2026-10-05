import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition,D} from './model.mjs';
test('PowerPick10 default configuration matches the manual envelope and TCP',()=>{
  const d=definition(), s=referenceScene(d);
  const b=new THREE.Box3().setFromObject(s.root);
  assert.ok(Math.abs(b.max.x-b.min.x-D.length)<.004,`length ${b.max.x-b.min.x}`);
  assert.ok(Math.abs(b.max.y-b.min.y-D.width)<.001,`width ${b.max.y-b.min.y}`);
  assert.ok(Math.abs(b.max.z-b.min.z-D.height)<.001,`height ${b.max.z-b.min.z}`);
  assert.ok(Math.abs(b.max.x-(D.offset+D.cupPitch[0]/2+D.cupR))<1e-6,'far cup edge ends the envelope');
  const t=s.links.get('tcp').getWorldPosition(new THREE.Vector3());
  assert.ok(Math.abs(t.x-D.offset)<1e-9&&Math.abs(t.z-D.tcpZ)<1e-9);
  for(let i=1;i<=4;i++) assert.ok(Math.abs(s.links.get(`cup_${i}_contact`).getWorldPosition(new THREE.Vector3()).z-D.tcpZ)<1e-9);
  // hose elbows stay outside the Ø75 wrist flange
  for(const sy of [-1,1]) assert.ok(Math.hypot(D.elbow[0]+.008,D.elbow[1]-.008)>.0375);
});
