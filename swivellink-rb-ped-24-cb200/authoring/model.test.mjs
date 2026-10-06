import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition,D} from './model.mjs';
const near=(a,b,t=1e-4)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`);
test('RB-PED-24-CB200 is 24 in from the floor to the mounting face, inside the shipping footprint',()=>{
  const d=definition(),s=referenceScene(d),part=n=>new THREE.Box3().setFromObject(s.root.getObjectByName(n));
  const all=new THREE.Box3().setFromObject(s.root),size=all.getSize(new THREE.Vector3());
  near(size.z,.6096);near(all.min.z,0,1e-6);near(size.x,.301625);near(size.y,.301625);
  near(s.links.get('robot_mount').getWorldPosition(new THREE.Vector3()).z,.6096,1e-9);
  const tube=part('tube').getSize(new THREE.Vector3()),top=part('top_plate').getSize(new THREE.Vector3());
  near(tube.x,.1524);near(top.x,.2032);assert.ok(tube.x<top.x&&top.x<size.x,'tube < top plate < base plate');
  near(part('top_plate').max.z,.6096,1e-6);near(part('tube').max.z,part('top_plate').min.z,1e-6);
  // 3/8 in plates and a 3/16 in wall weigh about what the 45 lb shipping weight allows
  const steel=7850,wall=.1875*.0254,r=D.tube/2;
  const kg=steel*(D.base**2*D.plate+Math.PI*(D.top/2)**2*D.plate+Math.PI*(r**2-(r-wall)**2)*(D.height-2*D.plate));
  assert.ok(kg>17&&kg<20.5,`steel estimate ${kg} kg against 45 lb = 20.4 kg shipped`);
  assert.ok(d.joints.every(j=>j.type==='fixed'));assert.ok(d.links.every(l=>!l.inertial));
});
