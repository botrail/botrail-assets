import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition,D} from './model.mjs';
const near=(a,b,t=1e-3)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`);
test('AK-R-FKT10 keeps the 650 x 840 x 800 body, the 590 x 630 deck and the 120 mm outriggers',()=>{
  const d=definition(),s=referenceScene(d),part=n=>new THREE.Box3().setFromObject(s.root.getObjectByName(n));
  const all=new THREE.Box3().setFromObject(s.root),size=all.getSize(new THREE.Vector3());
  near(size.x,D.w+2*D.outrigger);near(size.y,D.d);near(all.min.z,0,1e-6);
  // body: posts to posts, floor gap, deck surface
  near(part('post_rb').max.x-part('post_lb').min.x,D.w);near(part('post_rb').max.y-part('post_rf').min.y,D.d);
  near(part('post_lf').min.z,.132,1e-6);near(part('deck_slat_0').max.z,.800,1e-6);
  // deck: seven 90 mm slats = 630 mm deep, 590 mm wide, a 90 mm opening before the rear rail
  const first=part('deck_slat_0'),last=part('deck_slat_6');
  assert.equal(s.root.getObjectByName('deck_slat_7'),undefined);
  near(last.max.y-first.min.y,.630);near(first.getSize(new THREE.Vector3()).x,.590,1e-6);
  near(part('deck_end_rail_b').min.y-last.max.y,.090);
  // panel openings between the members: 530 and 720 wide, 548 high
  const front=part('panel_f').getSize(new THREE.Vector3()),side=part('panel_l').getSize(new THREE.Vector3());
  near(front.x,.530,1e-6);near(side.y,.720,1e-6);near(front.z,.548,1e-6);
  near(part('top_rail_f').min.z-part('bottom_rail_f').max.z,.548);
  near(part('bottom_plate').getSize(new THREE.Vector3()).x,.585,1e-6);near(part('bottom_plate').getSize(new THREE.Vector3()).y,.240,1e-6);
  const mount=s.links.get('robot_mount').getWorldPosition(new THREE.Vector3());
  near(mount.z,.800,1e-9);near(mount.x,0,1e-9);near(mount.y,(first.min.y+last.max.y)/2,1e-3);
  assert.ok(d.joints.every(j=>j.type==='fixed'));assert.ok(d.links.every(l=>!l.inertial));
});
