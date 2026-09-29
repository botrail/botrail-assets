import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {definition,dimensions,variants,liftJoints} from './model.mjs';

const at=(s,name)=>s.links.get(name).getWorldPosition(new THREE.Vector3());
const near=(a,b,tol,what)=>assert.ok(Math.abs(a-b)<tol,`${what}: ${a} vs ${b}`);
/** The zero-pose world AABB of every collision box of `d`. */
function envelope(d,s){
  const lo=[Infinity,Infinity,Infinity], hi=[-Infinity,-Infinity,-Infinity];
  for(const link of d.links) for(const c of link.collisions??[]) {
    const m=s.links.get(link.name).matrixWorld;
    for(const sx of [-1,1]) for(const sy of [-1,1]) for(const sz of [-1,1]) {
      const p=new THREE.Vector3(c.xyz[0]+sx*c.size[0]/2,c.xyz[1]+sy*c.size[1]/2,c.xyz[2]+sz*c.size[2]/2).applyMatrix4(m);
      p.toArray().forEach((v,i)=>{lo[i]=Math.min(lo[i],v);hi[i]=Math.max(hi[i],v);});
    }
  }
  return {lo,hi};
}

for(const mast of Object.keys(variants)) {
  const v=variants[mast];
  test(`${v.name}: the sheet's lengths, the fork seat, and the lift`,()=>{
    const d=definition(mast), s=referenceScene(d);
    // The fork seat: 87.5 mm over the floor, the load distance behind the wheel axle.
    const seat=at(s,'forks');
    near(seat.x,-v.loadDistance,1e-12,'load distance x'); near(seat.z,dimensions.forkLowered,1e-12,'h13');
    near(at(s,'fork_tips').x,-v.loadDistance+dimensions.forks[2],1e-12,'fork tips');
    // The envelope: rear end to fork tips is l1, b1 wide, the scanner on top.
    const {lo,hi}=envelope(d,s);
    near(hi[0]-lo[0],v.overallLength,0.002,'l1'); near(hi[1]-lo[1],dimensions.width,1e-9,'b1');
    near(lo[0],-v.loadDistance-v.lengthToForkFace,1e-9,'l2'); near(hi[2],v.scannerTop,1e-9,'h20');
    near(lo[2],dimensions.clearanceMast,1e-9,'m1');
    // Lifted through every joint the mast has, the fork top reaches h23 and
    // the backrest h4; nothing else grows past the extended mast.
    const pose={}; for(const j of liftJoints[mast]) pose[j]=d.joints.find(x=>x.name===j).limit.upper;
    s.pose(pose);
    near(at(s,'forks').z,v.liftHeight,0.0005,'h23');
    near(envelope(d,s).hi[2],v.mastExtended,0.0005,'h4');
    s.pose({});
  });

  test(`${v.name}: the published turning radius is the rear corner about the wheel axle`,()=>{
    const d=definition(mast), s=referenceScene(d);
    let wa=0;
    for(const link of d.links) for(const c of link.collisions??[]) {
      const m=s.links.get(link.name).matrixWorld;
      for(const sx of [-1,1]) for(const sy of [-1,1]) {
        const p=new THREE.Vector3(c.xyz[0]+sx*c.size[0]/2,c.xyz[1]+sy*c.size[1]/2,c.xyz[2]).applyMatrix4(m);
        wa=Math.max(wa,Math.hypot(p.x,p.y));
      }
    }
    // Wa 1767 on the sheet; the geometry gives √(1718² + 465²) = 1780, 0.7 % over.
    assert.ok(Math.abs(wa-v.turningRadius)/v.turningRadius<0.015,`Wa ${wa} vs ${v.turningRadius}`);
  });
}

test('running gear: the drive wheel steers about the vertical on the wheelbase, every wheel stands on the floor',()=>{
  const d=definition('tx'), s=referenceScene(d);
  const steer=d.joints.find(j=>j.name==='steer');
  assert.equal(steer.type,'revolute'); assert.deepEqual(steer.axis,[0,0,1]);
  near(steer.xyz[0],-dimensions.wheelbase,1e-12,'y');
  for(const [name,radius,y] of [['drive_wheel',0.115,0],['castor_left',0.0625,0.2925],['castor_right',0.0625,-0.2925],
                                ['support_wheel_left',0.0425,0.195],['support_wheel_right',0.0425,-0.195]]) {
    const j=d.joints.find(x=>x.name===name);
    assert.equal(j.type,'continuous'); assert.deepEqual(j.axis,[0,1,0]);
    const hub=at(s,name); near(hub.z,radius,1e-12,`${name} hub`); near(hub.y,y,1e-12,`${name} track`);
    assert.ok(!d.links.find(l=>l.name===name).collisions,'wheels are visual only');
  }
  near(at(s,'support_wheel_left').x,0,1e-12,'the origin is the support wheel axle');
  near(at(s,'drive_wheel').x,-dimensions.wheelbase,1e-12,'wheelbase');
  assert.ok(d.links.every(l=>!l.inertial),'unverified inertias must remain absent');
});

test('the lift joints run at the sheet\'s unladen lift speed and the stages follow at half',()=>{
  for(const mast of ['tx','dx']) {
    const d=definition(mast);
    for(const j of liftJoints[mast]) near(d.joints.find(x=>x.name===j).limit.velocity,0.34,1e-12,`${mast} ${j}`);
    const stage=d.joints.find(x=>x.name==='mast_stage');
    assert.deepEqual(stage.mimic,{joint:'mast_lift',multiplier:0.5,offset:0});
  }
  near(definition('tx').joints.find(j=>j.name==='free_lift').limit.upper,1.592,1e-12,'h2');
  near(definition('tx').joints.find(j=>j.name==='mast_lift').limit.upper,4.613-1.592,1e-9,'h3 - h2');
  near(definition('dx').joints.find(j=>j.name==='mast_lift').limit.upper,2.263,1e-12,'h3');
});
