import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {urdf,meshFiles as originalMeshFiles} from '../../authoring/reference-export.mjs';
import {definition,V} from './model.mjs';
import {meshFiles,compactObj} from './compact-obj.mjs';
const def=definition(),g=def.links[0].visual;
g.updateMatrixWorld(true);
const object=n=>{const o=g.getObjectByName(n);assert.ok(o,n);return o;};
const bounds=o=>new THREE.Box3().setFromObject(o,true);
const close=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('URDF matches the 2026-10-10 contract and the committed file',()=>{
 const text=urdf(def);assert.equal(createHash('sha256').update(text).digest('hex'),'da38c2cb3fade78ddf118374c7c436dfb5aeb7a7280d772e263110d1a34123d2');
 assert.equal(text,fs.readFileSync(new URL('../urdf/daihen-cm-7403.urdf',import.meta.url),'utf8'));
});
test('collision boxes enclose the whole visual inside the published envelope',()=>{
 const boxes=def.links[0].collisions.map(c=>{assert.equal(c.kind,'box');return new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(...c.xyz),new THREE.Vector3(...c.size));});
 const published=new THREE.Box3(new THREE.Vector3(-.127,V.rear,0),new THREE.Vector3(.127,V.front,.393)).expandByScalar(1e-9);
 for(const b of boxes)assert.ok(published.containsBox(b),'collision stays inside 254 x 611 x 393 mm');
 const p=new THREE.Vector3();let worst=0;
 g.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);worst=Math.max(worst,Math.min(...boxes.map(b=>b.distanceToPoint(p))));}});
 assert.ok(worst<1e-6,`visual stands ${worst*1000} mm outside the collision boxes`);
});
test('torch outlet frame sits on the visible connector face, +Z forward',()=>{
 const j=def.joints.find(j=>j.child==='torch_outlet_frame');
 const face=bounds(object('torch_center'));close(j.xyz[0],(face.min.x+face.max.x)/2);close(j.xyz[1],face.max.y);close(j.xyz[2],(face.min.z+face.max.z)/2);
 const z=new THREE.Vector3(0,0,1).applyEuler(new THREE.Euler(...j.rpy,'ZYX'));close(z.y,1,1e-12);
});
test('published complete visual envelope is 254 x 611 x 393 mm',()=>{
 const b=bounds(g),s=b.getSize(new THREE.Vector3());close(s.x,.254);close(s.y,.611);close(s.z,.393);close(b.min.z,0);
});
test('photo-inspired components exist with unique names and finite geometry',()=>{
 const names=new Set();let meshes=0;g.traverse(o=>{if(!o.isMesh)return;meshes++;assert.ok(!names.has(o.name));names.add(o.name);for(const attr of ['position','normal'])for(const v of o.geometry.attributes[attr].array)assert.ok(Number.isFinite(v));});assert.ok(meshes>100);
 for(const name of ['side_arch','opposite_side_cover','upper_cover','sloping_control_panel','spool_flange_-0.0515','spool_flange_0.0475','handle_grip','torch_brass_ring'])object(name);
});
test('spool flanges surround copper winding with clearance and three open hub windows',()=>{
 close(V.spoolRadius-V.wireRadius,.027);assert.ok(V.spoolWidth>.088+2*.004);
 const spokes=g.children.filter(o=>o.name.startsWith('spool_spoke_'));assert.equal(spokes.length,6);
 assert.equal(g.children.filter(o=>o.name.startsWith('wire_turn_')).length,58);
});
test('handle spans across width and clears upper cover',()=>{
 const b=bounds(object('handle_grip'));assert.ok(b.max.x-b.min.x>.11);assert.ok(b.min.z>.369);assert.ok(b.min.z>V.coverTop+.020);
});
test('no logo or reference textures are included',()=>g.traverse(o=>{if(o.isMesh){assert.equal(o.material.map,null);assert.ok(!/logo|label|decal/i.test(o.name));}}));
test('all regenerated OBJ and MTL files match without writing',()=>{for(const [p,text] of Object.entries(meshFiles(def.links)))assert.equal(text,fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));});
function corners(text){const attrs={v:[],vt:[],vn:[]};let object='',material='';const out=[];for(const line of text.split('\n')){const m=/^(v|vt|vn) (.*)$/.exec(line);if(m)attrs[m[1]].push(m[2]);else if(line.startsWith('o '))object=line;else if(line.startsWith('usemtl '))material=line;else if(line.startsWith('f '))out.push([object,material,...line.slice(2).split(' ').map(s=>s.split('/').map((v,i)=>v?attrs[['v','vt','vn'][i]][Number(v)-1]:'').join('|'))].join(';'));}return out;}
test('OBJ compaction preserves every face corner and boundary exactly',()=>{const raw=originalMeshFiles(def.links)['meshes/base_link.obj'];assert.deepEqual(corners(raw),corners(compactObj(raw)));});

test('visible feed mechanism has connected supports',()=>{
 const overlaps=(a,b)=>assert.ok(bounds(object(a)).intersectsBox(bounds(object(b))),`${a} floats from ${b}`);
 overlaps('pressure_adjuster','roller_pressure_arm');
 for(const y of [.074,.150]){overlaps('roller_pressure_arm','roller_arm_support_'+y);overlaps('feed_roller_bed','roller_arm_support_'+y);}
 for(const y of [.087,.142]){overlaps('feed_roller_'+y,'feed_bearing_'+y);overlaps('feed_roller_bed','feed_bearing_'+y);}
 overlaps('side_latch','side_latch_mount');overlaps('side_latch_mount','side_arch');
});

test('rear feed bridge clears spool sweep by at least 4 mm',()=>{const b=bounds(object('rear_feed_bridge'));assert.ok(b.min.y-(V.spoolCenter[1]+V.spoolRadius)>.00399);});
