import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition,D} from './model.mjs';
const near=(a,b,t=1e-3)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`);
test('ZFM-F401 keeps the dimensioned body, deck, robot plate position, handle and outrigger span',()=>{
  const d=definition(),s=referenceScene(d),part=n=>new THREE.Box3().setFromObject(s.root.getObjectByName(n));
  const all=new THREE.Box3().setFromObject(s.root),size=all.getSize(new THREE.Vector3());
  near(size.x,1.1277,2e-3);near(size.y,.9771,2e-3);near(all.min.z,0,1e-6);near(all.max.z,.700+.178,1e-6);
  // body 850 x 700, deck at 700, lower storage 686 x 536 between the members
  const deck=part('deck');near(deck.getSize(new THREE.Vector3()).x,.850,1e-6);near(deck.getSize(new THREE.Vector3()).y,.700,1e-6);near(deck.max.z,.700,1e-3);
  near(part('post_rr').min.x-part('post_hr').max.x,.686);near(part('post_rr').min.y-part('post_rl').max.y,.536);
  near(part('post_rr').max.x-part('post_hl').min.x,.850);near(part('post_rr').max.y-part('post_hl').min.y,.700);
  near(part('top_rail_l').min.z-part('bottom_rail_l').max.z,.3885,2e-3);
  // robot plate: 205 mm from the robot end, on the centre line, mounting face at 720
  const plate=part('robot_plate'),centre=plate.getCenter(new THREE.Vector3());
  near(D.l/2-centre.x,.205,1e-6);near(centre.y,0,1e-6);near(plate.max.z,.720,1e-6);
  const mount=s.links.get('robot_mount').getWorldPosition(new THREE.Vector3());
  near(mount.x,.220,1e-9);near(mount.y,0,1e-9);near(mount.z,.720,1e-9);
  // the handle is at the end away from the robot
  assert.ok(new THREE.Box3().setFromObject(s.root.getObjectByName('handle_grip')).max.x<-.3);
  near(part('cable_inlet').getSize(new THREE.Vector3()).x,.080,1e-6);near(part('cable_inlet').getSize(new THREE.Vector3()).y,.100,1e-6);
  assert.ok(d.joints.every(j=>j.type==='fixed'));assert.ok(d.links.every(l=>!l.inertial));
});
