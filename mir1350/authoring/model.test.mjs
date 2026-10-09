import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {definition,dimensions} from './model.mjs';

test('MiR1350 keeps its published envelope and the interface frames',()=>{
  const d=definition(),s=referenceScene(d);
  const z=name=>s.links.get(name).getWorldPosition(new THREE.Vector3()).z;
  assert.ok(Math.abs(z('deck')-0.192)<1e-12);
  assert.ok(Math.abs(z('cover_top')-dimensions.height)<1e-12);
  assert.equal(dimensions.height,0.322);
  const body=d.links.find(l=>l.name==='base_link'), cover=d.links.find(l=>l.name==='top_cover');
  assert.deepEqual(body.collisions[0].size.slice(0,2),[1.350,0.910]);
  // Chassis box + cover box stack exactly from the ground clearance to the published height.
  const top=cover.collisions[0].xyz[2]+cover.collisions[0].size[2]/2+dimensions.deck;
  assert.ok(Math.abs(top-dimensions.height)<1e-12);
  assert.ok(Math.abs(body.collisions[0].xyz[2]-body.collisions[0].size[2]/2-dimensions.clearance)<1e-12);
  assert.equal(d.joints.filter(j=>j.type==='continuous').length,6);
  assert.ok(d.links.filter(l=>l.name.endsWith('wheel_link')).every(l=>!l.collisions),'wheels are visual only');
  assert.ok(d.links.every(l=>!l.inertial),'unverified inertias must remain absent');
});

import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {urdf,meshFiles as rawMeshFiles} from '../../authoring/reference-export.mjs';
import {compactObj,meshFiles} from './compact-obj.mjs';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
const near=(a,b,t=2e-7)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const scene=()=>referenceScene(definition()).root;
const bbox=o=>new THREE.Box3().setFromObject(o);
const ray=(g,origin,direction)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction).normalize()).intersectObject(g,true);

test('complete inherited URDF including all collisions and wheel/API contracts is byte-identical',()=>{
 const xml=urdf(definition());assert.equal(createHash('sha256').update(xml).digest('hex'),'f7742d0540266224e6ab055f1e5d2a5bd77bacd5752721a31bc5b67736a5aae0');
 assert.equal(fs.readFileSync(new URL('../urdf/mir1350.urdf',import.meta.url),'utf8'),xml);
});

test('visual envelope matches 1350 x 910 x 322 mm with grounded wheels',()=>{
 const g=scene(),b=bbox(g),size=b.getSize(new THREE.Vector3());
 near(size.x,1.350);near(size.y,.910);near(size.z,.322);near(b.min.z,0);
 const deck=bbox(g.getObjectByName('load_surface'));near(deck.max.z,.321);
 near(deck.getSize(new THREE.Vector3()).x,1.304);near(deck.getSize(new THREE.Vector3()).y,.864);
 const base=bbox(g.getObjectByName('recessed_chassis_core'));near(base.min.z,.027);
});

test('black product appearance contains eight corner signals, four status lights and two diagonal scanners',()=>{
 const g=scene(),names=[];g.traverse(o=>{if(o.isMesh)names.push(o.name);});
 assert.equal(names.filter(n=>/^signal_.*_(side|end)$/.test(n)).length,8);
 assert.equal(names.filter(n=>/^status_light_(side|end)_/.test(n)).length,4);
 assert.equal(names.filter(n=>/^scanner_\d_window$/.test(n)).length,2);
 assert.equal(names.filter(n=>/^deck_grip_/.test(n)).length,8);
 assert.equal(names.filter(n=>/^deck_access_lid_/.test(n)).length,2);
 const shell=g.getObjectByName('lower_side_panel_1');assert.equal(shell.material.name,'jet_black_shell');
 assert.ok(shell.material.color.getHex(THREE.SRGBColorSpace)<0x303030);
 const p0=bbox(g.getObjectByName('scanner_0_window')).getCenter(new THREE.Vector3());
 const p1=bbox(g.getObjectByName('scanner_1_window')).getCenter(new THREE.Vector3());
 assert.ok(p0.x*p1.x<0&&p0.y*p1.y<0);near(p0.z,.1835);
});

test('camera optics, corner signals and scanner windows are exposed rather than buried in panels',()=>{
 const g=scene();
 for(const sy of [-1,1]){
  const cam=ray(g,[1,sy*.044,.119],[-1,0,0]);assert.ok(cam.length);assert.equal(cam[0].object.name,`front_camera_${sy}_lens_2`);
  const light=ray(g,[0,sy,.203],[0,-sy,0]);assert.ok(light.length);assert.equal(light[0].object.name,`status_light_side_${sy}`);
 }
 const scanner=ray(g,[.808,.588,.1835],[-1,-1,0]);assert.ok(scanner.length);assert.equal(scanner[0].object.name,'scanner_0_window');
 const signal=ray(g,[.548,1,.265],[0,-1,0]);assert.ok(signal.length);assert.equal(signal[0].object.name,'signal_fl_side');
});

test('upper reveal and removable cover remain separate from the lower chassis skin',()=>{
 const g=scene();
 const reveal=ray(g,[.25,1,.185],[0,-1,0]);assert.ok(reveal.length);
 assert.equal(reveal[0].object.name,'recess_inner_side_wall_1');assert.ok(reveal[0].point.y<.420,'reveal is recessed at least 35 mm behind the exterior skin');
 const lo=bbox(g.getObjectByName('lower_side_panel_1')),up=bbox(g.getObjectByName('upper_side_panel_1'));
 assert.ok(up.min.z-lo.max.z>.055);assert.ok(up.max.y<lo.max.y-.010);
 const cover=definition().links.find(l=>l.name==='top_cover');assert.ok(cover.visual);
});

test('every authored visual is finite, non-degenerate, closed and outward wound',()=>{
 let count=0,triangles=0;
 for(const link of definition().links)link.visual?.traverse(o=>{if(!o.isMesh)return;count++;
  const geo=o.geometry,p=geo.attributes.position,index=geo.index?.array??Array.from({length:p.count},(_,i)=>i);
  assert.ok([...p.array,...geo.attributes.normal.array].every(Number.isFinite),o.name);
  const v=Array.from({length:p.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(p,i));
  const keys=v.map(p=>p.toArray().map(c=>Math.round(c*1e8)).join(',')),edges=new Map();let volume=0;
  for(let i=0;i<index.length;i+=3){triangles++;const ids=[index[i],index[i+1],index[i+2]],[a,b,c]=ids.map(k=>v[k]);
   assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).length()>1e-14,`${o.name} zero triangle`);volume+=a.dot(b.clone().cross(c))/6;
   for(let j=0;j<3;j++){const edge=[keys[ids[j]],keys[ids[(j+1)%3]]].sort().join('|');edges.set(edge,(edges.get(edge)??0)+1);}
  }
  assert.ok([...edges.values()].every(n=>n===2),`${o.name} nonmanifold`);assert.ok(volume>0,`${o.name} inverted`);
 });assert.ok(count>130);assert.ok(triangles<40000);
});

function semanticDigest(text){
 const values={v:[null],vt:[null],vn:[null]},hash=createHash('sha256');
 for(const line of text.split('\n')){
  const m=/^(v|vt|vn) (.*)$/.exec(line);if(m){values[m[1]].push(m[2]);continue;}
  if(line.startsWith('f '))hash.update(JSON.stringify(line.slice(2).split(' ').map(t=>t.split('/').map((v,i)=>v?values[['v','vt','vn'][i]][+v]:''))));
  else hash.update(line+'\n');
 }return hash.digest('hex');
}
test('lossless OBJ compaction preserves exact corners, materials, names and Three.js loader results',()=>{
 const raw=rawMeshFiles(definition().links),loader=new OBJLoader();
 for(const [name,content] of Object.entries(raw))if(name.endsWith('.obj')){
  const compact=compactObj(content);assert.equal(semanticDigest(compact),semanticDigest(content));assert.equal(compactObj(compact),compact);
  assert.ok(Buffer.byteLength(compact)<8_000_000);const a=loader.parse(content),b=loader.parse(compact);
  assert.equal(a.children.length,b.children.length);
  for(let i=0;i<a.children.length;i++){
   assert.equal(a.children[i].name,b.children[i].name);
   for(const attr of ['position','normal','uv'])assert.deepEqual(a.children[i].geometry.attributes[attr]?.array,b.children[i].geometry.attributes[attr]?.array);
  }
 }
});
test('all generated OBJ/MTL files are deterministic and match checked-in artifacts',()=>{
 const a=meshFiles(definition().links);assert.deepEqual(a,meshFiles(definition().links));
 for(const [name,text] of Object.entries(a))assert.equal(fs.readFileSync(new URL('../'+name,import.meta.url),'utf8'),text,name);
});
