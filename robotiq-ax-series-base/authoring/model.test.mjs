import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {urdf,meshFiles as rawMeshes} from '../../authoring/reference-export.mjs';
import {meshFiles} from './compact-obj.mjs';
import {definition,D,E} from './model.mjs';
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const LEGACY='d01d8d818a02a9e458da0c1ed015921b4c124c56da7d66ace82c906ec1fe85ac';
function objects(g){g.updateMatrixWorld(true);const result=[];g.traverse(o=>{if(o.isMesh)result.push([o.name,new THREE.Box3().setFromObject(o)])});return result;}
function minSeparation(a,b){return Math.max(...['x','y','z'].map(k=>Math.max(b.min[k]-a.max[k],a.min[k]-b.max[k])));}
test('all legacy URDF bytes, frames, collision proxies and drive settings are unchanged',()=>{
 assert.equal(digest(urdf(definition())),LEGACY);
 assert.equal(digest(fs.readFileSync(new URL('../urdf/robotiq-ax-series-base.urdf',import.meta.url))),LEGACY);
});
test('legacy footprint and height, and 1,501 sampled lift poses keep mounting plane and frame',()=>{
 const d=definition(),s=referenceScene(d);s.pose({lift_joint:0});const b=new THREE.Box3().setFromObject(s.root);
 assert.ok(Math.abs(b.max.x-b.min.x-D.base[0])<1e-6);
 assert.ok(Math.abs(b.max.y-b.min.y-D.base[1])<1e-6);
 assert.ok(Math.abs(b.max.z-D.height)<1e-6);assert.ok(Math.abs(b.min.z)<1e-7);
 const plate=s.root.getObjectByName('robot_mount_plate');
 for(let i=0;i<=1500;i++){
  const q=i/1000;s.pose({lift_joint:q});const p=s.links.get('robot_mount').getWorldPosition(new THREE.Vector3());
  assert.ok(Math.abs(p.z-(D.plateZ0+q))<1e-10);assert.ok(Math.abs(p.x)<1e-10);assert.ok(Math.abs(p.y-.160)<1e-10);
  const pb=new THREE.Box3().setFromObject(plate);assert.ok(Math.abs(pb.max.z-p.z)<1e-7);
  const rotation=s.links.get('robot_mount').getWorldQuaternion(new THREE.Quaternion());assert.ok(rotation.angleTo(new THREE.Quaternion())<1e-9);
 }
});
test('complete linear stroke has conservative swept-AABB separation from every fixed visual solid',()=>{
 const d=definition();const statics=objects(d.links[0].visual);const moving=objects(d.links[1].visual);
 const origin=new THREE.Vector3(...d.joints[0].xyz);const collisions=[];
 for(const [name,local] of moving){
  const swept=local.clone().translate(origin);swept.max.z+=D.stroke;
  for(const [fixed,b] of statics)if(minSeparation(swept,b)<-1e-7)collisions.push([name,fixed]);
 }
 assert.deepEqual(collisions,[],'A conservative pair overlap needs review; it is not automatically a mesh collision');
});
test('guide support remains captured along full stroke with specified lateral running clearance',()=>{
 const d=definition(),fixed=new Map(objects(d.links[0].visual)),moving=new Map(objects(d.links[1].visual));
 const origin=new THREE.Vector3(...d.joints[0].xyz);
 for(const sign of [-1,1])for(const z of E.shoeCenters){
  const rail=fixed.get(`guide_rail_${sign}`);
  for(const t of [-1,1]){
   const shoe=moving.get(`guide_shoe_side_${sign}_${z}_${t}`).clone().translate(origin);
   assert.ok(shoe.min.z>=rail.min.z-1e-7);assert.ok(shoe.max.z+D.stroke<=rail.max.z+1e-7);
   const gap=t<0?rail.min.x-shoe.max.x:shoe.min.x-rail.max.x;
   assert.ok(Math.abs(gap-E.shoeSideGap)<1e-7);assert.ok(shoe.min.y<rail.max.y&&shoe.max.y>rail.min.y);
  }
 }
});
test('open base visual and asset boundary: no OEM robot controller, copied UI, or hidden mechanism',()=>{
 const d=definition(),base=new Map(objects(d.links[0].visual));
 assert.ok(!base.has('base_frame'));assert.ok(base.has('base_longitudinal_left'));
 for(const name of base.keys())assert.ok(!/pendant|robot_controller|lead_screw|ballscrew|drive_belt/.test(name));
 assert.equal([...base.keys()].filter(x=>x.startsWith('pallet_sensor_housing_')).length,4);
 assert.equal([...base.keys()].filter(x=>x.startsWith('status_light_diffuser_')).length,2);
});
test('fresh meshes are deterministic and reproduce committed compact OBJ/MTL bytes',()=>{
 const first=meshFiles(definition().links),second=meshFiles(definition().links);assert.deepEqual(first,second);
 for(const [name,value] of Object.entries(first))assert.equal(value,fs.readFileSync(new URL('../'+name,import.meta.url),'utf8'),name);
});
function expanded(text){const attrs={v:[],vt:[],vn:[]};let name='',mat='';const faces=[];for(const line of text.split('\n')){
 const [kind,...v]=line.split(' ');if(kind in attrs)attrs[kind].push(v.join(' '));else if(kind==='o')name=v.join(' ');else if(kind==='usemtl')mat=v.join(' ');else if(kind==='f')faces.push([name,mat,v.map(c=>c.split('/').map((n,i)=>n?attrs[['v','vt','vn'][i]][Number(n)-1]:'').join('|')).join(';')]);
}return faces;}
test('OBJ compaction retains each exact face corner, material and object boundary',()=>{
 const d=definition(),raw=rawMeshes(d.links),compact=meshFiles(d.links);
 for(const name of Object.keys(raw))if(name.endsWith('.obj'))assert.deepEqual(expanded(raw[name]),expanded(compact[name]));else assert.equal(raw[name],compact[name]);
});
test('guide backings bridge the mast, cabinet door is seated and rail caps avoid coincident exposed faces',()=>{
 const b=new Map(objects(definition().links[0].visual));
 const core=b.get('mast_core'),shell=b.get('axis_cabinet_shell'),door=b.get('axis_cabinet_door');
 assert.ok(Math.abs(door.max.y-shell.min.y)<1e-7);
 for(const s of [-1,1]){
  const support=b.get(`guide_backing_${s}`),rail=b.get(`guide_rail_${s}`);
  assert.ok(Math.abs(support.min.y-core.max.y)<1e-7);
  assert.ok(Math.abs(support.max.y-rail.min.y)<1e-7);
  const long=b.get(`base_longitudinal_${s<0?'left':'right'}`);
  for(const t of [-1,1]){
   const cap=b.get(`rail_end_cap_${s}_${t}`);
   assert.ok(Math.abs(t<0?cap.max.y-long.min.y:cap.min.y-long.max.y)<1e-7);
   assert.ok((t<0?long.min.y-cap.min.y:cap.max.y-long.max.y)>.0039);
  }
 }
});
