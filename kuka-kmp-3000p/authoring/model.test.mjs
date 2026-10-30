import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {definition,dimensions} from './model.mjs';

const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);
const at=(s,link)=>s.links.get(link).getWorldPosition(new THREE.Vector3());

test('the envelope is the published 2200 x 1200 x 370 mm, standing on the floor',()=>{
  const s=referenceScene(definition());
  const b=new THREE.Box3().setFromObject(s.root);
  near(b.min.x,-1.1,1e-6);near(b.max.x,1.1,1e-6);
  near(b.min.y,-0.6,1e-6);near(b.max.y,0.6,1e-6);
  near(b.min.z,0,1e-6);near(b.max.z,dimensions.height,1e-6);
});

test('the deck sits 370 mm over the floor and lifts 100 mm at 30 mm/s',()=>{
  const d=definition(),s=referenceScene(d);
  s.pose({lift:0});near(at(s,'deck').z,0.370);
  s.pose({lift:dimensions.stroke});near(at(s,'deck').z,0.470);
  const lift=d.joints.find(j=>j.name==='lift');
  assert.equal(lift.type,'prismatic');assert.equal(lift.limit.upper,0.100);near(lift.limit.velocity,0.030);
});

test('turning on the spot sweeps the published 1.3 m radius (half diagonal within 5 %)',()=>{
  const r=Math.hypot(dimensions.length/2,dimensions.width/2);
  assert.ok(Math.abs(r-dimensions.turningRadius)/dimensions.turningRadius<0.05,`${r}`);
});

test('every wheel stands on the floor and every swivel turns about the vertical',()=>{
  const d=definition(),s=referenceScene(d);
  const wheels=d.joints.filter(j=>j.type==='continuous'&&j.axis[1]===1);
  assert.equal(wheels.length,6);
  for(const w of wheels){
    const r=w.name.startsWith('drive')?dimensions.driveWheel[0]:dimensions.castor[0];
    near(at(s,w.child).z,r);
  }
  const swivels=d.joints.filter(j=>j.type==='continuous'&&j.axis[2]===1);
  assert.deepEqual(swivels.map(j=>j.name).sort(),['castor_fl_swivel','castor_fr_swivel','castor_rl_swivel','castor_rr_swivel','steer_front','steer_rear']);
});

test('the collisions: the chassis box clears the lowered lift plate, which covers the deck',()=>{
  const d=definition();
  const [chassis]=d.links.find(l=>l.name==='base_link').collisions;
  near(chassis.xyz[2]+chassis.size[2]/2,0.348);
  assert.deepEqual(chassis.size.slice(0,2),[2.2,1.2]);
  const [plate]=d.links.find(l=>l.name==='lift_plate').collisions;
  assert.deepEqual(plate.size,[2.06,1.06,0.02]);
  assert.ok(d.links.every(l=>!l.inertial));
});
