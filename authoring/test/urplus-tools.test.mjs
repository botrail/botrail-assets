import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceScene} from '../reference-model.mjs';
import {THREE} from '../tool-shapes.mjs';
import {definition as hand} from '../../robotiq-hand-e/authoring/model.mjs';
import {definition as zimmer, variants} from '../../zimmer-hrc-03/authoring/model.mjs';
import {definition as vacuum} from '../../onrobot-vgc10/authoring/model.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
for(const [label,make,drive,limit,gap0] of [['Hand-E',hand,'finger_joint',.025,0],...variants.map(s=>[s,()=>zimmer(s),'jaw_joint',.01,.0128])]) {
 test(label+' has parallel mirrored contact motion and a stationary TCP',()=>{
  const d=make(),view=referenceScene(d),a=view.links.get('left_contact'),b=view.links.get('right_contact');
  for(let i=0;i<=20;i++) {
   view.pose({[drive]:limit*i/20});
   const p=a.getWorldPosition(new THREE.Vector3()),q=b.getWorldPosition(new THREE.Vector3());
   near(p.x-q.x,gap0+2*limit*i/20);near(p.z,q.z);near(p.y,q.y);
   near(view.links.get('tcp').getWorldPosition(new THREE.Vector3()).z,label==='Hand-E'?.146:.1354);
  }
  assert.ok(d.links.every(l=>!l.inertial));
 });
}
test('VGC10 separates four cup frames into two channels without a fictional actuator',()=>{
 const d=vacuum(),v=referenceScene(d);assert.ok(d.joints.every(j=>j.type==='fixed'));
 for(const channel of ['a','b']) {
  const a=v.links.get(`cup_${channel}1_contact`).getWorldPosition(new THREE.Vector3());
  const b=v.links.get(`cup_${channel}2_contact`).getWorldPosition(new THREE.Vector3());
  const c=v.links.get(`channel_${channel}`).getWorldPosition(new THREE.Vector3());
  near((a.x+b.x)/2,c.x);near((a.y+b.y)/2,c.y);near(a.z,.1135);near(b.z,.1135);
 }
});
