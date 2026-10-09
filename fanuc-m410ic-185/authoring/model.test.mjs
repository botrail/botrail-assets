import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {definition, DIM, POCKETS} from './model.mjs';

import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {meshFiles,compactObj} from './compact-obj.mjs';
import {meshFiles as uncompressedMeshFiles,urdf} from '@botrail/authoring/reference-export.mjs';
import {createScene,poses,poseValues} from './scene.mjs';
import {framingBounds} from './framing.mjs';
import {frameCamera,DISPLAY_PROFILE} from '@botrail/authoring/display.mjs';
const d = Math.PI / 180;
const at = (s, name) => s.links.get(name).getWorldPosition(new THREE.Vector3());
const close = (p, xyz, tol = 1e-6) => assert.ok(p.distanceTo(new THREE.Vector3(...xyz)) < tol, `${p.toArray()} vs ${xyz}`);

test('zero pose: faceplate 390 + 1300 + 255 forward, 1110 + 1220 - 159 up, +Z down', () => {
  const s = referenceScene(definition());
  close(at(s, 'flange'), [DIM.j2x + DIM.upper + DIM.wristX, 0, DIM.j2z + DIM.lower + DIM.wristZ]);
  const z = new THREE.Vector3(0, 0, 1).transformDirection(s.links.get('flange').matrixWorld);
  close(z, [0, 0, -1], 1e-12);
});

test('the operating space extremes of the data sheet', () => {
  const s = referenceScene(definition()), z = () => at(s, 'flange').z, x = () => at(s, 'flange').x;
  s.pose({J2: 0, J3: 10 * d}); assert.ok(Math.abs(z() - 2.397) < 0.001, `top ${z()}`);
  s.pose({J2: 100 * d, J3: -90 * d}); assert.ok(Math.abs(z() + 0.561) < 0.001, `bottom ${z()}`);
  s.pose({J2: 79 * d, J3: 0}); assert.ok(Math.abs(x() - 3.143) < 0.001, `reach ${x()}`);
});

test('the parallelograms close and keep the wrist level in any pose', () => {
  const s = referenceScene(definition());
  for (const [q2, q3] of [[0, 0], [60 * d, -30 * d], [-44 * d, -26 * d], [100 * d, -120 * d]]) {
    s.pose({J1: 0.4, J2: q2, J3: q3, J4: 0.9});
    const z = new THREE.Vector3(0, 0, 1).transformDirection(s.links.get('flange').matrixWorld);
    close(z, [0, 0, -1], 1e-9);
    // drive rod top meets the upper arm's rear lever; levelling rod meets the wrist
    const rodTop = new THREE.Vector3(0, 0, DIM.lower).applyMatrix4(s.links.get('rod_link').matrixWorld);
    const lever = new THREE.Vector3(-0.51, -0.40, 0.27).applyMatrix4(s.links.get('J3_link').matrixWorld);
    close(rodTop, lever.toArray(), 1e-9);
    const levelEnd = new THREE.Vector3(DIM.upper, 0, 0).applyMatrix4(s.links.get('level_upper_link').matrixWorld);
    const wristPin = new THREE.Vector3(0.485, 0, 0.279).applyMatrix4(s.links.get('wrist_link').matrixWorld);
    close(levelEnd, wristPin.toArray(), 1e-9);
  }
});

test('four commanded axes, passive links follow, primitive collisions, no fabricated dynamics', () => {
  const def = definition();
  assert.deepEqual(def.joints.filter(j => j.type === 'revolute').map(j => j.name), ['J1', 'J2', 'J3', 'J4']);
  for (const j of def.joints.filter(j => j.type === 'continuous')) assert.ok(['J2', 'J3'].includes(j.mimic.joint));
  assert.ok(def.links.every(l => !l.inertial));
  for (const l of def.links) for (const c of l.collisions ?? []) assert.ok(['box', 'cylinder'].includes(c.kind));
  // every link that draws something collides as a primitive, never as its mesh
  assert.ok(def.links.filter(l => l.visual).every(l => l.collisions?.length));
});


test('all link frames, joints, axes, limits, mimics and primitive collisions match the pre-refinement contract',()=>{
 const def=definition(),baseline=JSON.parse(fs.readFileSync(new URL('./kinematics-baseline.json',import.meta.url)));
 assert.deepEqual({name:def.name,joints:def.joints,links:def.links.map(({visual,...v})=>v)},baseline);
 assert.equal(fs.readFileSync(new URL('../urdf/fanuc-m410ic-185.urdf',import.meta.url),'utf8'),urdf(def));
});

test('front lower-arm recesses have geometric depth and are absent from the side faces',()=>{
 const v=definition().links.find(l=>l.name==='J2_link').visual;v.updateMatrixWorld(true);
 function ray(y,z){return new THREE.Raycaster(new THREE.Vector3(.5,y,z),new THREE.Vector3(-1,0,0),0,1).intersectObject(v,true);}
 for(const z of POCKETS.z){const cavity=ray(0,z),rim=ray(.087,z);assert.ok(cavity.length&&rim.length);
  assert.ok(rim[0].point.x-cavity[0].point.x>.025,`Recess at ${z} is not deep`);
  assert.equal(rim[0].object.name,'lower_arm_front_pocket_wall');
 }
 assert.ok(!v.children.some(o=>o.material?.name==='casting_recess'));
});

test('pedestal portals and wrist fork have real through openings',()=>{
 const def=definition(),base=def.links.find(l=>l.name==='base_link').visual,wrist=def.links.find(l=>l.name==='wrist_link').visual;
 base.updateMatrixWorld(true);wrist.updateMatrixWorld(true);
 const portal=base.getObjectByName('pedestal_front_portal');
 for(const z of [.16,.365]){
  assert.equal(new THREE.Raycaster(new THREE.Vector3(.7,0,z),new THREE.Vector3(-1,0,0),0,2).intersectObject(portal).length,0);
  assert.equal(new THREE.Raycaster(new THREE.Vector3(.7,0,z),new THREE.Vector3(-1,0,0),0,2).intersectObject(base,true).length,0,'Cabinet must not block the assembled pedestal portal');
 }
 for(const side of [-1,1]){
  const cheek=wrist.getObjectByName(`wrist_fork_cheek_${side}`);
  assert.equal(new THREE.Raycaster(new THREE.Vector3(.370,-.4,.174),new THREE.Vector3(0,1,0),0,1).intersectObject(cheek).length,0);
 }
});

test('mesh components are finite, nondegenerate, closed and outward wound',()=>{
 let count=0,triangles=0;
 for(const l of definition().links)l.visual?.traverse(o=>{if(!o.isMesh)return;count++;
  const g=o.geometry,p=g.attributes.position,idx=g.index?.array??Array.from({length:p.count},(_,i)=>i);
  assert.ok([...p.array,...g.attributes.normal.array].every(Number.isFinite),o.name);
  const verts=Array.from({length:p.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(p,i));
  const keys=verts.map(v=>v.toArray().map(x=>Math.round(x*1e7)).join(',')),edges=new Map(),directed=new Map();let volume=0;
  for(let i=0;i<idx.length;i+=3){triangles++;const ids=[idx[i],idx[i+1],idx[i+2]],[a,b,c]=ids.map(j=>verts[j]);
   assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).length()>1e-14,`${o.name}: degenerate triangle ${i/3}`);
   volume+=a.dot(b.clone().cross(c))/6;
   for(let k=0;k<3;k++){const pair=[keys[ids[k]],keys[ids[(k+1)%3]]],edge=[...pair].sort().join('|');
    edges.set(edge,(edges.get(edge)??0)+1);directed.set(pair.join('|'),(directed.get(pair.join('|'))??0)+1);}
  }
  assert.ok([...edges.values()].every(n=>n===2),`${o.name}: open/nonmanifold edge`);
  for(const edge of edges.keys()){const [a,b]=edge.split('|');assert.equal(directed.get(a+'|'+b),directed.get(b+'|'+a),`${o.name}: winding`);}
  assert.ok(volume>0,`${o.name}: inward winding`);
 });
 assert.ok(count>100);assert.ok(triangles<120000);
});

test('every named pose fits full-chain bounds and view frusta at desktop and narrow aspect',()=>{
 const s=createScene(),bounds=framingBounds(s);
 for(const name of Object.keys(poses)){
  s.pose(poseValues(name));const actual=new THREE.Box3().setFromObject(s.root);assert.ok(bounds.containsBox(actual));
  for(const aspect of [1.6,.6])for(const dir of [[1.5,-2,1],[0,-1,.02],[1,0,.02],[0,-.001,1]]){
   const camera=new THREE.PerspectiveCamera(DISPLAY_PROFILE.fov,aspect,.001,100);camera.up.set(0,0,1);frameCamera(camera,bounds,dir);camera.updateMatrixWorld(true);
   const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
   s.root.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;
    for(let i=0;i<p.count;i++)assert.ok(frustum.containsPoint(new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld)),`${name}/${o.name} outside frame`);
   });
  }
 }
});

function faceDigest(text){
 const attrs={v:[undefined],vt:[undefined],vn:[undefined]},hash=createHash('sha256');let faces=0;
 for(const line of text.split('\n')){const m=/^(v|vt|vn) (.*)$/.exec(line);if(m){attrs[m[1]].push(m[2]);continue;}
  if(line.startsWith('f ')){hash.update(JSON.stringify(line.slice(2).trim().split(/\s+/).map(t=>t.split('/').map((v,i)=>v?attrs[['v','vt','vn'][i]][Number(v)]:''))));faces++;}
  else hash.update(line+'\n');
 }return {digest:hash.digest('hex'),faces};
}
test('deterministic compact exports preserve exact per-corner positions, UVs, normals, materials and object order',()=>{
 const raw=uncompressedMeshFiles(definition().links),files=meshFiles(definition().links);assert.deepEqual(files,meshFiles(definition().links));
 for(const [name,text] of Object.entries(files)){
  assert.equal(fs.readFileSync(new URL('../'+name,import.meta.url),'utf8'),text,name);
  if(name.endsWith('.obj')){assert.deepEqual(faceDigest(text),faceDigest(raw[name]));assert.equal(compactObj(text),text);assert.ok(Buffer.byteLength(text)<8_000_000);}
 }
});


test('analytic flange FK and all three closed linkages agree across a 180-pose grid',()=>{
 const s=createScene();
 for(const q1 of [-Math.PI,.4,Math.PI])for(const q2d of [-44,0,35,79,100])for(const q3d of [-126,-90,-45,-26,0,10])for(const q4 of [-2,2]){
  const q2=q2d*d,q3=q3d*d;s.pose({J1:q1,J2:q2,J3:q3,J4:q4});
  const r=DIM.j2x+DIM.lower*Math.sin(q2)+DIM.upper*Math.cos(q3)+DIM.wristX;
  close(at(s,'flange'),[r*Math.cos(q1),r*Math.sin(q1),DIM.j2z+DIM.lower*Math.cos(q2)+DIM.upper*Math.sin(q3)+DIM.wristZ],1e-9);
  close(new THREE.Vector3(0,0,1).transformDirection(s.links.get('flange').matrixWorld),[0,0,-1],1e-9);
  const point=(link,xyz)=>new THREE.Vector3(...xyz).applyMatrix4(s.links.get(link).matrixWorld);
  close(point('rod_link',[0,0,DIM.lower]),point('J3_link',[-.51,-.40,.27]).toArray(),1e-9);
  close(point('level_lower_link',[0,0,DIM.lower]),point('elbow_link',[-.26,.21,.10]).toArray(),1e-9);
  close(point('level_upper_link',[DIM.upper,0,0]),point('wrist_link',[.485,0,.279]).toArray(),1e-9);
 }
});
