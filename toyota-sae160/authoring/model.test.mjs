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

import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {urdf,meshFiles as rawMeshFiles} from '../../authoring/reference-export.mjs';
import {compactObj,meshFiles} from './compact-obj.mjs';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
const bbox=o=>new THREE.Box3().setFromObject(o,true);
const ray=(g,origin,direction)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction).normalize()).intersectObject(g,true);
const hashes={tx:'b12d8fcb944b6e868146ec693115a57dce0b5da117e183b6f7adba08d4866a74',dx:'a6a6b92d199e7c1a73d9a4e9f10e166b915e46cca93f79eec07a5bbf67ec4190'};
for(const mast of ['tx','dx']){
 test(`${mast}: inherited URDF, collision/contact boxes and all frames/limits are byte-identical`,()=>{
  const xml=urdf(definition(mast));assert.equal(createHash('sha256').update(xml).digest('hex'),hashes[mast]);
  assert.equal(fs.readFileSync(new URL(mast==='tx'?'../urdf/toyota-sae160.urdf':'../dx/urdf/toyota-sae160-dx.urdf',import.meta.url),'utf8'),xml);
 });
 test(`${mast}: staged free lift/mast travel and steering work through 36 combined poses`,()=>{
  const d=definition(mast),s=referenceScene(d),v=variants[mast];
  for(const f of [0,.1,.3448,.3452,.5,1])for(const steer of [-Math.PI/2,0,Math.PI/2])for(const spin of [0,.7]){
   const travel=f*v.lift,free=Math.min(travel,v.freeLift),ml=travel-free;
   s.pose({free_lift:free,mast_lift:ml,steer,drive_wheel:spin});
   near(at(s,'forks').z,dimensions.forkLowered+travel,1e-9,'fork travel');
   near(at(s,'mast_inner').z,mast==='tx'?ml:ml/2,1e-9,'inner staging');
   if(mast==='tx')near(at(s,'mast_stage1').z,ml/2,1e-9,'middle staging');
   const box=bbox(s.root);assert.ok(box.min.z>-.000001,'no visuals below floor');
   near(at(s,'nav_scanner').z,v.scannerEye,1e-9,'fixed scanner');
   near(at(s,'drive_wheel').x,-dimensions.wheelbase,1e-9,'steering retains axle');
   const fits=(roller,rail)=>{const r=bbox(s.root.getObjectByName(roller)),c=bbox(s.root.getObjectByName(rail));
    assert.ok(r.min.z>=c.min.z-1e-7&&r.max.z<=c.max.z+1e-7,`${roller} loses vertical overlap with ${rail} at lift ${travel}`);};
   for(const sy of [-1,1]){
    const side=sy>0?'left':'right';
    for(const k of [0,1])fits(`carriage_roller_${side}_${k}`,`inner_channel_${side}`);
   }

   assert.ok([...box.min.toArray(),...box.max.toArray()].every(Number.isFinite));
  }
 });
 test(`${mast}: open channel sections, rolling guides and tapered fork windows are actual geometry`,()=>{
  const d=definition(mast),s=referenceScene(d),g=s.root,v=variants[mast];
  for(const name of ['outer_channel_left','inner_channel_left',...(mast==='tx'?['stage_channel_left']:[])]){
   const o=g.getObjectByName(name),b=bbox(o),center=b.getCenter(new THREE.Vector3());
   const hits=ray(o,[center.x,b.min.y-.1,center.z],[0,1,0]);assert.ok(hits.length);
   assert.ok(hits[0].point.y>b.max.y-.010,`${name}: open throat must reach the outward web`);
  }
  for(const side of ['left','right']){
   const o=g.getObjectByName(`fork_${side}`),b=bbox(o),cy=(b.max.y+b.min.y)/2;
   assert.equal(ray(o,[0,cy,1],[0,0,-1]).length,0,'load-wheel window is really open');
   const heel=ray(o,[-v.loadDistance+.25,cy+.085,-.1],[0,0,1])[0];
   const toe=ray(o,[-v.loadDistance+1.14,cy+.060,-.1],[0,0,1])[0];
   near(heel.point.z,dimensions.forkLowered-.070,1e-7,'heel thickness');
   assert.ok(toe.point.z>heel.point.z+.020,'underside tapers toward tip');
   near(b.max.x,-v.loadDistance+1.250,1e-7,'bare tip envelope');
   near(b.max.z,dimensions.forkLowered,1e-7,'flat contact top');
  }
  for(const sy of [-1,1])assert.equal(ray(g,[0,sy*.195,.8],[0,0,-1])[0]?.object.name,`support_wheel_${sy>0?'left':'right'}_tyre`,'wheel is visible through both nested apertures');
  assert.ok(g.getObjectByName('carriage_roller_left_0'));
  assert.equal(g.getObjectByName('backrest_bar_0'),undefined);
 });
 test(`${mast}: sculpted shell, wide HMI and charging contacts are visible and within the retained vehicle width`,()=>{
  const g=referenceScene(definition(mast)).root,v=variants[mast],b=bbox(g);
  near(b.max.y-b.min.y,dimensions.width,1e-6,'published width reached by low scanner feet');
  assert.ok(b.min.x>=-v.loadDistance-v.lengthToForkFace-1e-6,'rear overhang');
  assert.ok(b.max.z<=v.scannerTop+1e-6,'scanner top envelope');
  assert.ok(bbox(g.getObjectByName('hmi_crossbar')).getSize(new THREE.Vector3()).y>.65);
  assert.ok(g.getObjectByName('drive_cover').geometry.index,'lofted cover');
  for(let k=0;k<5;k++){
   const h=ray(g,[-v.chargePlateX,-1,dimensions.chargePlateHeight+.12-k*.060],[0,1,0]);
   assert.equal(h[0]?.object.name,`charging_contact_${k}`);
  }
  assert.ok(g.getObjectByName('tiller_open_grip_1'));assert.ok(g.getObjectByName('tiller_open_grip_-1'));
 });
 test(`${mast}: every visual is finite, nondegenerate, closed and positive-volume`,()=>{
  let count=0,triangles=0;
  for(const link of definition(mast).links)link.visual?.traverse(o=>{if(!o.isMesh)return;count++;
   const geo=o.geometry,p=geo.attributes.position,index=geo.index?.array??Array.from({length:p.count},(_,i)=>i);
   assert.ok([...p.array,...geo.attributes.normal.array].every(Number.isFinite),o.name);
   const vs=Array.from({length:p.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(p,i));
   const keys=vs.map(p=>p.toArray().map(c=>Math.round(c*1e8)).join(',')),edges=new Map();let volume=0;
   for(let i=0;i<index.length;i+=3){triangles++;const ids=[index[i],index[i+1],index[i+2]],[a,b,c]=ids.map(k=>vs[k]);
    assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).length()>1e-14,`${o.name}: degenerate triangle ${i/3}`);volume+=a.dot(b.clone().cross(c))/6;
    for(let j=0;j<3;j++){const e=[keys[ids[j]],keys[ids[(j+1)%3]]].sort().join('|');edges.set(e,(edges.get(e)??0)+1);}
   }
   assert.ok([...edges.values()].every(n=>n===2),`${o.name}: nonmanifold`);assert.ok(volume>0,`${o.name}: inverted volume ${volume}`);
  });assert.ok(count>120);assert.ok(triangles<150000);
 });
}
function semanticDigest(text){
 const values={v:[null],vt:[null],vn:[null]},hash=createHash('sha256');
 for(const line of text.split('\n')){
  const m=/^(v|vt|vn) (.*)$/.exec(line);if(m){values[m[1]].push(m[2]);continue;}
  if(line.startsWith('f '))hash.update(JSON.stringify(line.slice(2).split(' ').map(t=>t.split('/').map((v,i)=>v?values[['v','vt','vn'][i]][+v]:''))));
  else hash.update(line+'\n');
 }return hash.digest('hex');
}
test('lossless OBJ compaction preserves every exact face corner, material and object in TX and DX',()=>{
 const loader=new OBJLoader();
 for(const mast of ['tx','dx'])for(const [name,content] of Object.entries(rawMeshFiles(definition(mast).links)))if(name.endsWith('.obj')){
  const compact=compactObj(content);assert.equal(semanticDigest(compact),semanticDigest(content));assert.equal(compactObj(compact),compact);
  assert.ok(Buffer.byteLength(compact)<8_000_000);const a=loader.parse(content),b=loader.parse(compact);assert.equal(a.children.length,b.children.length);
  for(let i=0;i<a.children.length;i++)for(const attr of ['position','normal','uv'])assert.deepEqual(a.children[i].geometry.attributes[attr]?.array,b.children[i].geometry.attributes[attr]?.array);
 }
});
test('TX and DX generated OBJ/MTL files are deterministic and match committed artifacts',()=>{
 for(const mast of ['tx','dx']){
  const a=meshFiles(definition(mast).links);assert.deepEqual(a,meshFiles(definition(mast).links));
  for(const [name,text] of Object.entries(a))assert.equal(fs.readFileSync(new URL('../'+(mast==='dx'?'dx/':'')+name,import.meta.url),'utf8'),text,name);
 }
});

test('moving crossmembers, ears and carriage clear fixed mast/scanner parts and each other throughout both lift sweeps',()=>{
 for(const mast of ['tx','dx']){
  const d=definition(mast),s=referenceScene(d),max=d.joints.find(j=>j.name==='mast_lift').limit.upper;
  const staticNames=['scanner_post','nav_scanner','nav_scanner_window','scanner_post_collar','scanner_post_foot','outer_head','outer_foot','beacon','mast_top_shroud_flange_1_1','mast_top_shroud_flange_-1_1','chassis_core','battery_bay','drive_cover','support_root_yoke_1','support_root_yoke_-1','support_arm_left','support_arm_right'];
  const names=['inner_crossmember','inner_crossmember_ear_1','inner_crossmember_ear_-1',...(mast==='tx'?['stage_crossmember','stage_crossmember_ear_1','stage_crossmember_ear_-1']:[])];
  const sweep=Array.from({length:101},(_,i)=>({mast_lift:max*i/100,free_lift:variants[mast].freeLift}));
  if(mast==='tx')sweep.push(...Array.from({length:101},(_,i)=>({mast_lift:0,free_lift:variants[mast].freeLift*i/100})));
  for(const [i,pose] of sweep.entries()){
   s.pose(pose);
   if(mast==='tx'){
    for(const n of ['inner_crossmember','inner_crossmember_ear_1','inner_crossmember_ear_-1'])for(const m of ['stage_crossmember','stage_crossmember_ear_1','stage_crossmember_ear_-1'])assert.ok(!bbox(s.root.getObjectByName(n)).intersectsBox(bbox(s.root.getObjectByName(m))),`${n} crosses ${m} at step ${i}`);
   }
   for(const n of names)for(const m of ['carriage_upper_tie','carriage_lower_tie','carriage_stile_left','carriage_stile_right','carriage_window_plate','carriage_roller_mount_left_1','carriage_roller_mount_right_1'])assert.ok(!bbox(s.root.getObjectByName(n)).intersectsBox(bbox(s.root.getObjectByName(m))),`${n} crosses ${m} at step ${i}`);
   const carriageNames=['carriage_upper_tie','carriage_lower_tie','carriage_stile_left','carriage_stile_right','carriage_window_plate','carriage_roller_mount_left_1','carriage_roller_mount_right_1'];
   for(const name of [...names,...carriageNames])for(const fixed of staticNames)assert.ok(!bbox(s.root.getObjectByName(name)).intersectsBox(bbox(s.root.getObjectByName(fixed))),`${mast} ${name} intersects ${fixed} at step ${i}`);
  }
 }
});
test('forks really nest around fixed support arms and roller brackets join the carriage through the open rail throats',()=>{
 for(const mast of ['tx','dx']){
  const s=referenceScene(definition(mast)),g=s.root,bb=n=>bbox(g.getObjectByName(n)),over=(a,b)=>assert.ok(bb(a).intersectsBox(bb(b)),`${a} does not join ${b}`);
  for(const sy of [-1,1]){
   const side=sy>0?'left':'right',arm=bb(`support_arm_${side}`),deck=bb(`fork_${side}_deck`),rail=bb(`inner_channel_${side}`);
   assert.ok(deck.min.z>arm.max.z+.005,'deck clears the nested support arm');
   assert.ok(arm.min.y>deck.min.y+.011&&arm.max.y<deck.max.y-.011,'arm clears both fork walls');
   assert.ok(bb('carriage_window_plate').min.z>arm.max.z,'plate clears fixed root yokes and arms');
   over(`support_root_yoke_${sy}`,`support_arm_${side}`);over(`support_root_yoke_${sy}`,'chassis_core');over(`support_root_yoke_${sy}`,'outer_foot');
   over('carriage_upper_tie',`fork_shank_${side}`);over(`fork_shank_${side}`,`fork_${side}_deck`);over('carriage_upper_tie',`carriage_stile_${side}`);over('carriage_lower_tie',`carriage_stile_${side}`);over('carriage_window_plate','carriage_lower_tie');
   assert.ok(bb(`carriage_stile_${side}`).min.x>rail.max.x,'stiles sit forward of rail flanges');
   for(const k of [0,1]){
    const bracket=bb(`carriage_roller_mount_${side}_${k}`);
    assert.ok(sy>0?bracket.max.y<rail.min.y:bracket.min.y>rail.max.y,'bracket enters through inner throat');
    over(`carriage_roller_mount_${side}_${k}`,`carriage_stile_${side}`);over(`carriage_roller_mount_${side}_${k}`,`carriage_axle_${side}_${k}`);over(`carriage_axle_${side}_${k}`,`carriage_roller_${side}_${k}`);
   }
  }
 }
});
