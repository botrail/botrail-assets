import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {definition,dimensions,layout} from './model.mjs';

const near=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);
const at=(s,link)=>s.links.get(link).getWorldPosition(new THREE.Vector3());
const bounds=(s,link)=>new THREE.Box3().setFromObject(s.links.get(link));
/** The bounds of the meshes of `link` whose names start with `prefix`. */
function part(s,link,prefix,exact=false){
  const b=new THREE.Box3();
  s.links.get(link).traverse(o=>{if(o.isMesh&&(exact?o.name===prefix:o.name.startsWith(prefix)))b.expandByObject(o);});
  assert.ok(!b.isEmpty(),`${link} has no ${prefix}`);
  return b;
}

test('the sheet metal is the published 2316 mm wide and 1818 mm high, and the machine stands 2724 mm',()=>{
  const s=referenceScene(definition());
  const walls=part(s,'body','wall_');
  near(walls.min.x,-1.158);near(walls.max.x,1.158);near(walls.max.z,1.818);
  const all=new THREE.Box3().setFromObject(s.root);
  near(all.min.z,0);near(all.max.z,2.724);
  // Front of the enclosure to the back of the cabinet: the catalog's 1984 mm.
  near(part(s,'body','front_apron').min.y,-0.992);near(part(s,'body','cabinet',true).max.y,0.992);
  near(part(s,'body','cabinet',true).max.z,2.247);
  near(part(s,'body','base_skirt').max.z,0.544);
  near(part(s,'body','pad_0_foot').min.z,0);
});

test('the table is 914 x 368 with its top 853 mm over the floor, and travels 762 x 406',()=>{
  const d=definition(),s=referenceScene(d);
  const top=at(s,'table');
  near(top.z,0.853);near(top.x,-0.381);near(top.y,-0.473);
  const t=part(s,'table','table',true);
  near(t.max.x-t.min.x,0.914);near(t.max.y-t.min.y,0.368);near(t.max.z,0.853);
  // Machine coordinates: 0 at home, negative from there — X to the table's right, Y to its back.
  s.pose({x:-0.762,y:-0.406});
  const far=at(s,'table');
  near(far.x,0.381);near(far.y,-0.473+0.406);near(far.z,0.853);
  for(const name of ['x','y','z']){
    const j=d.joints.find(q=>q.name===name);
    assert.equal(j.type,'prismatic');assert.equal(j.limit.upper,0);near(j.limit.velocity,25.4/60,1e-5);
  }
  assert.deepEqual(['x','y','z'].map(n=>-d.joints.find(q=>q.name===n).limit.lower*1000),[762,406,508]);
});

test('three 16 mm T-slots stand 125 mm apart',()=>{
  const d=definition(),table=d.links.find(l=>l.name==='table').visual;
  table.updateMatrixWorld(true);
  // The slot floors: the faces at the full slot depth, by their Y.
  const deep=-(dimensions.slot.throatDepth+dimensions.slot.wideDepth)/1000,ys=new Set();
  table.traverse(o=>{
    if(!o.isMesh||o.name!=='table')return;
    const p=o.geometry.getAttribute('position'),v=new THREE.Vector3();
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);if(Math.abs(v.z-deep)<1e-6)ys.add(Math.round(v.y*1e6)/1e3);}
  });
  const half=dimensions.slot.wide/2;
  assert.deepEqual([...ys].sort((a,b)=>a-b).map(y=>Number(y.toFixed(2))),
    [-125-half,-125+half,-half,half,125-half,125+half].map(y=>Number(y.toFixed(2))));
});

test('the spindle nose stands 610 mm over the table at home and 102 mm at the bottom, on the spindle line',()=>{
  const s=referenceScene(definition()),L=layout();
  near(at(s,'head').z-0.853,0.610);near(at(s,'head').x,0);near(at(s,'head').y,L.ySpindle/1000);
  s.pose({z:-0.508});near(at(s,'head').z-0.853,0.102);
  // At home the spindle is 381 mm right of the table's middle and 211.5 mm behind it.
  s.pose({});
  near(at(s,'head').x-at(s,'table').x,0.381);near(at(s,'head').y-at(s,'table').y,0.2115);
});

test('the front doors part to the published 939 mm, behind the skins beside the opening',()=>{
  const d=definition(),s=referenceScene(d);
  near(bounds(s,'front_door_left').max.x,0,1e-6);near(bounds(s,'front_door_right').min.x,0,1e-6);
  s.pose({front_door_left:0.4695,front_door_right:0.4695});
  const left=part(s,'front_door_left','lower_panel'),right=part(s,'front_door_right','lower_panel');
  near(right.min.x-left.max.x,0.939);
  // Open, each leaf is inside the wall, between the skin and the liner.
  const skin=part(s,'body','front_skin_right'),liner=part(s,'body','front_liner_right');
  assert.ok(right.max.x<1.158-dimensions.wall/1000+1e-9);
  assert.ok(bounds(s,'front_door_right').min.y>skin.max.y-1e-9,'the handle clears the skin');
  assert.ok(right.max.y<liner.min.y+1e-9);
  near(part(s,'body','front_apron').max.z,0.817);
});

test('the side windows are 677 mm wide from 818 mm and lift until their lower edge stands at 1413 mm',()=>{
  const d=definition(),s=referenceScene(d),L=layout();
  for(const side of ['left','right']){
    const sill=part(s,'body',`wall_${side}_sill`),front=part(s,'body',`wall_${side}_front`),rear=part(s,'body',`wall_${side}_rear`);
    near(sill.max.z,0.818);near(rear.min.y-front.max.y,0.677);near((rear.min.y+front.max.y)/2,L.yWindow/1000);
  }
  near(part(s,'side_door_right','lower_rail').min.z,0.819);
  s.pose({side_door_right:0.595});
  near(part(s,'side_door_right','lower_rail').min.z,1.414);
  const j=d.joints.find(q=>q.name==='side_door_right');
  assert.deepEqual(j.axis,[0,0,1]);near(j.limit.upper,0.595);
});

test('the umbrella changer: twenty pockets on the 585 mm circle, 522 mm from the spindle, reaching it in 230 mm',()=>{
  const d=definition(),s=referenceScene(d),c=dimensions.changer;
  const spindle=at(s,'head'),rest=at(s,'tool_carousel');
  near(spindle.x-rest.x,0.522);near(rest.y,spindle.y);near(rest.z,spindle.z);
  const shuttle=d.joints.find(q=>q.name==='tool_shuttle');
  // The drawing prints 9 in [230 mm] for 20.6 in less half of 23 in.
  assert.ok(Math.abs(shuttle.limit.upper*1000-c.travel)<=1);
  s.pose({tool_shuttle:shuttle.limit.upper});
  near(spindle.x-at(s,'tool_carousel').x,c.toolCircle/2000);
  const disc=part(s,'tool_carousel','carousel_disc');
  // The rim is the published 331 mm radius: the farthest any of the disc stands from its axis.
  let rim=0;
  s.links.get('tool_carousel').traverse(o=>{
    if(!o.isMesh||o.name!=='carousel_disc')return;
    const p=o.geometry.getAttribute('position'),v=new THREE.Vector3(),centre=at(s,'tool_carousel');
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);rim=Math.max(rim,Math.hypot(v.x-centre.x,v.y-centre.y));}
  });
  near(rim,c.radius/1000,1e-6);
  // The pocket at 0 turns stands on the spindle line: the disc is open there, out to the rim.
  near(disc.max.x,at(s,'tool_carousel').x+Math.sqrt(c.radius**2-23**2)/1000,1e-6);
  near(part(s,'tool_carousel','hub_boss').min.z-0.853,c.low[1]/1000);
  assert.equal(d.joints.find(q=>q.name==='tool_carousel').type,'continuous');
  // Shuttled in, nothing of the changer stands in the spindle's way.
  const nose=part(s,'head','spindle_cartridge');
  assert.ok(part(s,'tool_shuttle','hub_cover').max.x<nose.min.x);
});

test('the head clears the changer and its hood all the way down',()=>{
  const s=referenceScene(definition());
  s.pose({z:-0.508});
  const head=new THREE.Box3().union(part(s,'head','head_')).union(part(s,'head','motor_'));
  assert.ok(part(s,'body','changer_hood').max.x<head.min.x);
  assert.ok(part(s,'tool_carousel','carousel_disc').max.x<head.min.x);
});

test('the collisions are boxes and cylinders, and no mass is invented',()=>{
  const d=definition();
  for(const link of d.links){
    assert.ok(link.collisions.length>0,link.name);
    assert.ok(link.collisions.every(c=>c.kind==='box'||c.kind==='cylinder'));
    assert.ok(!link.inertial);
  }
  assert.deepEqual(d.links.map(l=>l.name),['body','saddle','table','head','front_door_left','front_door_right',
    'side_door_left','side_door_right','tool_shuttle','tool_carousel']);
});
