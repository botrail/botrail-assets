import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {definition} from './model.mjs';

test('flange zero pose and outward normal preserve the r1 coordinate contract',()=>{
  const s=referenceScene(definition()),f=s.links.get('flange');
  const p=f.getWorldPosition(new THREE.Vector3());
  assert.ok(p.distanceTo(new THREE.Vector3(2.080001517,-0.00000014,1.94479176))<1e-8);
  const z=new THREE.Vector3(0,0,1).transformDirection(f.matrixWorld);
  assert.ok(z.distanceTo(new THREE.Vector3(1,0,0))<1e-12);
  assert.equal(s.links.get('base_link').getWorldPosition(new THREE.Vector3()).z,0);
});

test('A1 rotates the entire arm about its offset axis; A6 holds flange position',()=>{
  const s=referenceScene(definition()),p=()=>s.links.get('flange').getWorldPosition(new THREE.Vector3());
  const initial=p();s.pose({joint_a6:0.7});
  // tool0 is 0.23924 mm off A6: that small legacy offset is preserved.
  assert.ok(p().distanceTo(initial)<0.00048);
  s.pose({joint_a1:Math.PI/2});
  const expected=new THREE.Vector3(-0.00262-(initial.y-0.00097586),0.00097586+(initial.x+0.00262),initial.z);
  assert.ok(p().distanceTo(expected)<1e-10);
});

test('six axes and separate primitive collisions; no fabricated dynamics',()=>{
  const d=definition();
  assert.deepEqual(d.joints.filter(j=>j.type==='revolute').map(j=>j.name),
    ['joint_a1','joint_a2','joint_a3','joint_a4','joint_a5','joint_a6']);
  assert.ok(d.links.every(l=>!l.inertial));
  assert.ok(d.joints.every(j=>j.limit?.effort===undefined));
  assert.ok(d.links.filter(l=>l.visual).every(l=>l.collisions?.length));
  for(const l of d.links) for(const c of l.collisions??[]) assert.ok(['box','cylinder'].includes(c.kind));
});

import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {meshFiles,urdf} from '@botrail/authoring/reference-export.mjs';
import {loftGeometry} from './casting.mjs';
import {createScene,balancerState,poseValues} from './scene.mjs';
import {balancerAnchors} from './model.mjs';
const baseline=JSON.parse(fs.readFileSync(new URL('./kinematics-baseline.json',import.meta.url),'utf8'));

test('complete URDF contract is byte-identical to e1565dd: frames, signs, limits and collisions',()=>{
  assert.equal(createHash('sha256').update(urdf(definition())).digest('hex'),
    'e28a9f8a2a5e0c4f4677c03a8ed9c75c87c8f9f4e5c9237af5043a29e8ea09ce');
});

test('all legacy link matrices match independently frozen FK in five poses including joint limits',()=>{
  const scene=createScene();
  for(const [name,fixture] of Object.entries(baseline.poses)) {
    scene.pose(Object.fromEntries(fixture.degrees.map((q,i)=>[`joint_a${i+1}`,q*Math.PI/180])));
    for(const [link,expected] of Object.entries(fixture.frames)) {
      const actual=scene.links.get(link).matrixWorld.clone().transpose().elements;
      actual.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<1e-10,`${name}/${link}/${i}: ${v} != ${expected[i]}`));
    }
  }
});

test('original casting lofts are closed, outward-facing and non-degenerate',()=>{
  for(const axis of ['x','z']) {
    const g=loftGeometry([[0,0,0,.2,.1,3],[.4,.03,0,.13,.08,4],[.7,0,0,.1,.07,2]],axis);
    const p=g.getAttribute('position'),edges=new Map();let volume=0;
    const vec=i=>new THREE.Vector3().fromBufferAttribute(p,i);
    const key=v=>v.toArray().map(x=>String(Math.round(x*1e7))).join(',');
    for(let i=0;i<g.index.count;i+=3) {
      const vertices=[0,1,2].map(k=>vec(g.index.getX(i+k)));
      const [a,b,c]=vertices;
      assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).length()>1e-9);
      volume+=a.dot(b.clone().cross(c))/6;
      for(let k=0;k<3;k++) {
        const edge=[key(vertices[k]),key(vertices[(k+1)%3])].sort().join('|');
        edges.set(edge,(edges.get(edge)??0)+1);
      }
    }
    assert.ok(volume>0);assert.ok([...edges.values()].every(n=>n===2));
  }
});

test('every authored mesh has finite positions and normals; geometry stays in plausible metre-scale bounds',()=>{
  const d=definition();let count=0;
  for(const link of d.links)link.visual?.traverse(o=>{
    if(!o.isMesh)return;count++;
    for(const attr of ['position','normal']) {
      assert.ok(o.geometry.getAttribute(attr),`${o.name} lacks ${attr}`);
      assert.ok([...o.geometry.getAttribute(attr).array].every(Number.isFinite));
    }
    o.geometry.computeBoundingBox();assert.ok(o.geometry.boundingBox.getSize(new THREE.Vector3()).length()<3);
  });
  assert.ok(count>=50);assert.ok(count<150);
});

test('counterbalance anchors remain connected for full A2 sweep at multiple A1 angles',()=>{
  const s=createScene(),L=balancerAnchors.barrelLength;
  for(const yaw of [-185,-90,0,90,185]) for(let a2=-45;a2<=85;a2++) {
    s.pose({joint_a1:yaw*Math.PI/180,joint_a2:a2*Math.PI/180});
    const state=balancerState(s),body=s.balancer;
    assert.ok(body.localToWorld(new THREE.Vector3()).distanceTo(state.rear)<1e-10);
    assert.ok(body.localToWorld(new THREE.Vector3(0,0,state.length)).distanceTo(state.moving)<1e-10);
    assert.ok(state.exposedRod>0 && state.exposedRod<.5);
    const rod=body.getObjectByName('counterbalance_piston_rod');
    assert.ok(Math.abs(rod.scale.z-state.exposedRod)<1e-12);
    assert.ok(Math.abs(rod.position.z-(L+state.exposedRod/2))<1e-12);
  }
});

test('counterbalance is viewer-only; repeated poses reset without drift and hide mode stays compatible',()=>{
  const s=createScene();const initial=s.balancer.matrixWorld.clone();
  for(let i=0;i<4;i++) for(const name of ['reach','folded','zero'])s.pose(poseValues(name));
  assert.ok(s.balancer.matrixWorld.equals(initial));
  assert.equal(createScene({balancer:false}).balancer,undefined);
  assert.equal(definition().links.length,10);
  assert.equal(definition().joints.length,9);
  assert.equal(Object.keys(meshFiles(definition().links)).length,14);
});

test('published nominal A6 bores have physical depth instead of dark decals',()=>{
  const g=definition().links.find(l=>l.name==='link_6').visual;g.updateMatrixWorld(true);
  const xAt=(y,z)=>{
    const r=new THREE.Raycaster(new THREE.Vector3(.08,y,z-.00023924),new THREE.Vector3(-1,0,0));
    const hits=r.intersectObject(g,true);assert.ok(hits.length);return hits[0].point.x;
  };
  assert.ok(Math.abs(xAt(0,0)-.0295)<1e-7,'8 mm centering recess');
  for(let i=0;i<6;i++) {
    const a=i*Math.PI/3;
    assert.ok(Math.abs(xAt(.080*Math.cos(a),.080*Math.sin(a))-.0235)<1e-7,'14 mm nominal threaded bore');
  }
  assert.ok(Math.abs(xAt(0,.080)-.0275)<1e-7,'10 mm locating bore');
  assert.ok(Math.abs(xAt(.065,0)-.0375)<1e-7,'unchanged tool contact plane');
});

test('fresh definitions produce byte-identical OBJ and MTL files',()=>{
  assert.deepEqual(meshFiles(definition().links),meshFiles(definition().links));
});

import {framingBounds} from './framing.mjs';
import {frameCamera,DISPLAY_PROFILE} from '@botrail/authoring/display.mjs';
test('fixed viewer envelope keeps every preset and slider limit inside narrow, square and wide cameras',()=>{
  const s=createScene(),bounds=framingBounds(s),point=new THREE.Vector3();
  const directions=[[1.5,-2,1],[0,-1,.02],[0,-.001,1],[0,-.001,-1]];
  for(const aspect of [.6,1,16/9]) for(const direction of directions) {
    const camera=new THREE.PerspectiveCamera(DISPLAY_PROFILE.fov,aspect,.001,100);
    frameCamera(camera,bounds,direction);camera.updateMatrixWorld(true);
    for(const name of ['zero','reach','folded']) for(const degrees of [-45,0,35,85]) {
      s.pose({...poseValues(name),joint_a2:degrees*Math.PI/180});
      s.root.traverse(o=>{
        if(!o.isMesh)return;const b=o.geometry.boundingBox;
        for(const x of [b.min.x,b.max.x]) for(const y of [b.min.y,b.max.y]) for(const z of [b.min.z,b.max.z]) {
          point.set(x,y,z).applyMatrix4(o.matrixWorld).project(camera);
          assert.ok(Math.abs(point.x)<.99 && Math.abs(point.y)<.99,`${name}/${degrees}/${aspect}/${o.name} cropped`);
        }
      });
    }
  }
});

test('counterbalance barrel and all tie rods yaw rigidly with A1 without spurious roll',()=>{
  const s=createScene(),axisOrigin=new THREE.Vector3(-.00262,.00097586,.33099);
  const point=i=>s.balancer.getObjectByName(`counterbalance_tie_rod_${i}`).getWorldPosition(new THREE.Vector3());
  for(const a2 of [-45,0,85]) {
    s.pose({joint_a2:a2*Math.PI/180});const baseline=[0,1,2,3].map(point);
    for(const yaw of [-185,25,90,185]) {
      s.pose({joint_a1:yaw*Math.PI/180,joint_a2:a2*Math.PI/180});
      for(let i=0;i<4;i++) {
        const expected=baseline[i].clone().sub(axisOrigin)
          .applyAxisAngle(new THREE.Vector3(0,0,1),yaw*Math.PI/180).add(axisOrigin);
        assert.ok(point(i).distanceTo(expected)<1e-10);
      }
    }
  }
});

test('every exported component is a closed, non-degenerate outward solid after positional welding',()=>{
  for(const link of definition().links)link.visual?.traverse(o=>{
    if(!o.isMesh)return;const g=o.geometry,p=g.attributes.position,indices=g.index?.array??Array.from({length:p.count},(_,i)=>i);
    const vertices=Array.from({length:p.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(p,i));
    const keys=vertices.map(v=>v.toArray().map(x=>String(Math.round(x*1e7))).join(','));const edges=new Map();let volume=0;
    for(let i=0;i<indices.length;i+=3){
      const id=Array.from(indices.slice(i,i+3)),[a,b,c]=id.map(i=>vertices[i]);
      assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).length()>1e-12,`${o.name}: zero-area triangle`);
      volume+=a.dot(b.clone().cross(c))/6;
      for(let j=0;j<3;j++){const edge=[keys[id[j]],keys[id[(j+1)%3]]].sort().join('|');edges.set(edge,(edges.get(edge)??0)+1);}
    }
    assert.ok([...edges.values()].every(n=>n===2),`${o.name}: open/non-manifold edge`);
    assert.ok(volume>0,`${o.name}: inward winding`);
  });
});
