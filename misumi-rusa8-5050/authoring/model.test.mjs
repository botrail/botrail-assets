import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition,D} from './model.mjs';
const near=(a,b,t=1e-3)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`);
test('RUSA8-5050-W500-D400-JC keeps the frame size, the member lengths of the parts list and the foot positions',()=>{
  const d=definition(),s=referenceScene(d),part=n=>new THREE.Box3().setFromObject(s.root.getObjectByName(n));
  const all=new THREE.Box3().setFromObject(s.root),size=all.getSize(new THREE.Vector3());
  near(size.x,.500);near(size.y,.400);near(all.min.z,0,1e-6);near(all.max.z,.134);
  // parts list: W-6 x 2, D-100 x 2, W-100 x 1 of HFS8-5050
  near(part('outer_member_front').getSize(new THREE.Vector3()).x,.494,1e-6);
  near(part('side_member_l').getSize(new THREE.Vector3()).y,.300,1e-6);
  near(part('centre_member').getSize(new THREE.Vector3()).x,.400,1e-6);
  near(part('outer_member_front').min.z,.084,1e-6);
  // adjusters 75 mm in from each end of W and 95 mm in from each side of D; pad dia. 75
  const pad=part('adjuster_rb_pad'),centre=pad.getCenter(new THREE.Vector3());
  near(D.w/2-centre.x,.075,1e-6);near(D.d/2-centre.y,.095,1e-6);near(pad.getSize(new THREE.Vector3()).x,.075,1e-4);
  near(part('caster_rb_wheel').getSize(new THREE.Vector3()).z,.050,1e-4);
  near(s.links.get('top').getWorldPosition(new THREE.Vector3()).z,.134,1e-9);
  assert.ok(d.joints.every(j=>j.type==='fixed'));assert.ok(d.links.every(l=>!l.inertial));
});
