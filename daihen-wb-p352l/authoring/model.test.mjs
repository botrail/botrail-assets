import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {meshFiles as uncompressedMeshFiles,urdf} from '../../authoring/reference-export.mjs';
import {compactObj,meshFiles} from './compact-obj.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition,D,panels} from './model.mjs';
const root=()=>{const g=definition().links[0].visual;g.updateMatrixWorld(true);return g;};
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const bounds=o=>new THREE.Box3().setFromObject(o);
const ray=(g,origin,direction)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(g,true);

test('URDF matches the 2026-10-10 contract and the committed file',()=>{
 const xml=urdf(definition());
 assert.equal(createHash('sha256').update(xml).digest('hex'),'9d480de5054daa3e0a7699ee345a2e6d58ff57d004e565b3272faacea486f079');
 assert.equal(fs.readFileSync(new URL('../urdf/daihen-wb-p352l.urdf',import.meta.url),'utf8'),xml);
});

test('base and mounting frames retain floor coordinates; torch outlet sits on the torch-side terminal',()=>{
 const s=referenceScene(definition());
 assert.deepEqual(s.links.get('mount').getWorldPosition(new THREE.Vector3()).toArray(),[0,0,0]);
 const lip=bounds(root().getObjectByName('output_1_brass_lip')),at=s.links.get('torch_outlet').getWorldPosition(new THREE.Vector3());
 near(at.x,(lip.min.x+lip.max.x)/2);near(at.y,lip.min.y);near(at.z,(lip.min.z+lip.max.z)/2);
 const d=definition();assert.equal(d.links.length,3);assert.equal(d.joints.length,2);
 assert.ok(d.joints.every(j=>j.type==='fixed'));assert.ok(d.links.every(l=>!l.inertial));
 assert.ok(d.links[0].collisions.every(c=>c.kind==='box'));
});

test('collision boxes enclose the whole visual, lifting eyes included',()=>{
 const g=root(),boxes=definition().links[0].collisions.map(c=>new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(...c.xyz),new THREE.Vector3(...c.size)));
 const p=new THREE.Vector3();let worst=0;
 g.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);worst=Math.max(worst,Math.min(...boxes.map(b=>b.distanceToPoint(p))));}});
 assert.ok(worst<1e-6,`visual stands ${worst*1000} mm outside the collision boxes`);
});

test('published external envelope is 395 x 710 x 640 mm excluding lifting eyes',()=>{
 const g=root(),b=new THREE.Box3();
 g.traverse(o=>{if(o.isMesh&&!o.name.startsWith('lifting_eye_'))b.union(bounds(o));});
 const size=b.getSize(new THREE.Vector3());near(size.x,.395);near(size.y,.710);near(size.z,.640);
 near(b.min.z,0);near(b.max.y,.355);near(b.min.y,-.355);
});

test('four fixed 50 mm casters touch the ground at the inherited 320 x 460 mm axle layout',()=>{
 const g=root();
 const names=['fl','fr','rl','rr'];const positions=names.map(n=>g.getObjectByName(`caster_${n}_tyre`).getWorldPosition(new THREE.Vector3()));
 near(positions[1].x-positions[0].x,.320);near(positions[2].y-positions[0].y,.460);near(.355-positions[2].y,.100);
 for(const n of names){const b=bounds(g.getObjectByName(`caster_${n}_tyre`));near(b.min.z,0);near(b.max.z,.050);near(b.getSize(new THREE.Vector3()).x,.026);}
});

test('two diagonal lifting eyes have true apertures and seated stems',()=>{
 const g=root(),eyes=g.children.filter(o=>/^lifting_eye_.*_ring$/.test(o.name));assert.equal(eyes.length,2);
 assert.ok(eyes[0].position.x*eyes[1].position.x<0 && eyes[0].position.y*eyes[1].position.y<0);
 for(const eye of eyes){const p=eye.position;assert.equal(ray(eye,[p.x,p.y-.08,p.z],[0,1,0]).length,0);assert.ok(ray(eye,[p.x+.0125,p.y-.08,p.z],[0,1,0]).length>0);}
 assert.equal(g.getObjectByName('left_panel_handle'),undefined);assert.ok(g.getObjectByName('usb_port_cover'));
});

test('upper fascia leans rearward and is physically separate from the vertical lower moulding',()=>{
 const g=root(),upper=g.getObjectByName('upper_sculpted_front_fascia'),lower=g.getObjectByName('lower_sculpted_front_fascia');
 assert.ok(bounds(upper).max.y>bounds(lower).max.y+.040);
 const hits=ray(g,[0,-.5,.628],[0,1,0]);assert.ok(hits.length);assert.ok(hits[0].point.y>-.31);
 const low=ray(g,[-.190,-.5,.130],[0,1,0]);assert.ok(low.length);near(low[0].point.y,-.337,1e-5);
});

test('two front louver banks have eleven rounded slots and physical vanes each and deep open spaces',()=>{
 const g=root();
 for(const [name,p] of [['upper_left_louver',panels.upperLouver],['lower_left_louver',panels.lowerLouver]]){
  assert.equal(g.children.filter(o=>o.name.startsWith(name+'_vane_')).length,11);
  const z=p.z+.001;
  const hits=ray(g,[p.x,-.5,z],[0,1,0]);assert.ok(hits.length);
  assert.equal(hits[0].object.name,name+'_interior','slot is open to its deep cavity');
  assert.ok(hits[0].point.y>-.320);
 }
});

test('side louvers have four geometric columns with actual through apertures',()=>{
 const g=root(),wall=g.getObjectByName('left_side_vented_skin');
 assert.equal(g.children.filter(o=>o.name.startsWith('left_side_pressed_louver_')).length,68);
 for(let col=0;col<4;col++){
  assert.equal(ray(wall,[-.25,-.175+col*.110,.125],[1,0,0]).length,0);
  const hit=ray(g,[-.25,-.175+col*.110,.127],[1,0,0]);assert.ok(hit.length);assert.ok(hit[0].point.x>-.190);
 }
});

test('rear service panel has true ventilation holes and separate covered electrical features',()=>{
 const g=root(),rear=g.getObjectByName('rear_service_sheet');
 assert.equal(ray(rear,[-.036,.45,.294],[0,-1,0]).length,0);
 assert.ok(ray(rear,[.12,.45,.26],[0,-1,0]).length>0);
 assert.equal(g.children.filter(o=>o.name.startsWith('rear_grommet_')).length,4);
 assert.ok(g.getObjectByName('rear_input_terminal_cover'));assert.ok(g.getObjectByName('rear_cable_clamp'));
});

test('output posts have recessed bores and sit in the photo-corroborated lower-right bay',()=>{
 const g=root();for(let i=0;i<2;i++){
  const ring=g.getObjectByName(`output_${i}_brass_lip`),b=bounds(ring),p=b.getCenter(new THREE.Vector3());
  assert.ok(p.x>0 && p.z<.25);near(p.z,.195);
  const hole=ray(g,[p.x,-.5,p.z],[0,1,0]);const lip=ray(g,[p.x+.011,-.5,p.z],[0,1,0]);
  assert.ok(hole.length && lip.length);assert.ok(hole[0].point.y-lip[0].point.y>.012);
 }
});

test('every visual component is finite, non-degenerate, watertight after welding, and outward wound',()=>{
 const g=root();let count=0,triangles=0;
 g.traverse(o=>{if(!o.isMesh)return;count++;
  const geometry=o.geometry,p=geometry.attributes.position,index=geometry.index?.array??Array.from({length:p.count},(_,i)=>i);
  assert.ok([...p.array,...geometry.attributes.normal.array].every(Number.isFinite),o.name);
  const vertices=Array.from({length:p.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(p,i));
  const keys=vertices.map(v=>v.toArray().map(x=>Math.round(x*1e8)).join(',')),edges=new Map();let volume=0;
  for(let i=0;i<index.length;i+=3){triangles++;const ids=[index[i],index[i+1],index[i+2]],[a,b,c]=ids.map(j=>vertices[j]);
   assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).length()>1e-14,`${o.name}: zero-area triangle ${i/3}`);
   volume+=a.dot(b.clone().cross(c))/6;
   for(let k=0;k<3;k++){const edge=[keys[ids[k]],keys[ids[(k+1)%3]]].sort().join('|');edges.set(edge,(edges.get(edge)??0)+1);}
  }
  assert.ok([...edges.values()].every(n=>n===2),`${o.name}: open/nonmanifold edge`);assert.ok(volume>0,`${o.name}: inward winding`);
 });
 assert.ok(count>200 && count<300);assert.ok(triangles<60000);
});

test('fresh definitions and all checked-in output files regenerate deterministically',()=>{
 const files=meshFiles(definition().links);assert.deepEqual(files,meshFiles(definition().links));
 for(const [name,text] of Object.entries(files))assert.equal(fs.readFileSync(new URL('../'+name,import.meta.url),'utf8'),text,name);
});


test('rear service details and labels are first-visible surfaces, not buried under their backing sheet',()=>{
 const g=root();
 for(const [name,x,z] of [['rear_io_cover',.01,.53],['rear_input_terminal_cover',-.124,.382],['rear_cable_clamp',-.087,.318],['rear_blank_warning_plate_0',-.087,.527],['rear_blank_warning_plate_1',.081,.432],['rear_blank_warning_plate_2',-.084,.181],['rear_input_cover_blank_label',-.087,.387],['rear_ground_terminal',-.074,.269]]){
  const hits=ray(g,[-x,.45,z],[0,-1,0]);assert.ok(hits.length);assert.equal(hits[0].object.name,name);
 }
 const sense=ray(g,[.09,-.5,.225],[0,1,0]);assert.ok(sense.length);assert.equal(sense[0].object.name,'output_voltage_sense_cap');
});


test('rear photograph handedness and molded side closures are preserved',()=>{
 const g=root();assert.ok(bounds(g.getObjectByName('rear_input_terminal_cover')).getCenter(new THREE.Vector3()).x>0);
 for(const o of g.children.filter(o=>o.name.startsWith('rear_grommet_')||o.name.startsWith('rear_pressed_louver_')||o.name==='rear_louver_interior'))assert.ok(bounds(o).getCenter(new THREE.Vector3()).x<0);
 for(const o of g.children.filter(o=>['rear_input_terminal_cover','rear_cable_clamp','rear_ground_terminal'].includes(o.name)||o.name.startsWith('rear_unused_coolant_blank_')))assert.ok(bounds(o).getCenter(new THREE.Vector3()).x>0);
 for(const [origin,z,name] of [[[-.25,-.265,.626],.626,'crown_side_cheek_l'],[[-.25,-.299,.2475],.2475,'tier_seam_side_return_l']]){
  const hits=ray(g,origin,[1,0,0]);assert.ok(hits.length);assert.equal(hits[0].object.name,name);
 }
});


function faceAttributeDigest(text){
 const values={v:[undefined],vt:[undefined],vn:[undefined]},hash=createHash('sha256');let faces=0;
 for(const line of text.split('\n')){
  const match=/^(v|vt|vn) (.*)$/.exec(line);
  if(match){values[match[1]].push(match[2]);continue;}
  if(line.startsWith('f ')){
   const corners=line.slice(2).trim().split(/\s+/).map(t=>t.split('/').map((v,i)=>v?values[['v','vt','vn'][i]][Number(v)]:''));
   hash.update(JSON.stringify(corners));faces++;
  }else hash.update(line+'\n');
 }
 return {sha256:hash.digest('hex'),faces};
}

test('OBJ compaction preserves exact per-corner positions, normals, UVs, materials and object order',()=>{
 const raw=uncompressedMeshFiles(definition().links)['meshes/base_link.obj'],compact=compactObj(raw);
 assert.deepEqual(faceAttributeDigest(compact),faceAttributeDigest(raw));
 assert.equal(faceAttributeDigest(compact).faces,44640);
 assert.ok(Buffer.byteLength(compact)<8_000_000,'publication-safe OBJ size');
 assert.equal(compactObj(compact),compact,'idempotent compaction');
 const rawObjects=raw.split('\n').filter(x=>x.startsWith('o '));
 assert.deepEqual(compact.split('\n').filter(x=>x.startsWith('o ')),rawObjects);
 assert.equal(rawObjects.length,251);
});

test('lossless compactor retains split corner attributes and never reuses new attribute records between objects',()=>{
 const fixture='o a\nv 0 0 0\nv 1 0 0\nv 0 1 0\nv 0 0 0\nvt 0 0\nvt 1 0\nvn 0 0 1\nvn 0 0 -1\ng group_a\ns off\nusemtl mat_a\nf 1/1/1 2/1/1 3/1/1\nf 4/2/2 3/1/2 2/1/2\ns 1\ng group_b\nf 1 2 3\nf 1/1 2/1 3/1\no b\nv 0 0 0\nv 1 0 0\nv 0 1 0\nusemtl mat_b\nf 5//1 6//1 7//1\n';
 const compact=compactObj(fixture);assert.deepEqual(faceAttributeDigest(compact),faceAttributeDigest(fixture));
 assert.equal(compact.split('\n').filter(x=>x.startsWith('v ')).length,6);
 assert.throws(()=>compactObj('v 0 0 0\nf -1 -1 -1\n'),/Unsupported OBJ index/);
 assert.throws(()=>compactObj('v 0 0 0\nl 1 1\n'),/Unsupported OBJ record/);
 assert.throws(()=>compactObj('v 0 0 0\nf /1/1 1 1\n'),/Missing vertex index/);
});
