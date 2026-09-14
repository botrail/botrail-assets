import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {definition} from './model.mjs';

for(const kind of ['camera','radar']) test(`${kind}: open mounting holes, SI scale, separate collision`,()=>{
  const d=definition(kind); d.body.updateMatrixWorld(true);
  const ray=(x,y)=>new THREE.Raycaster(new THREE.Vector3(x/1000,y/1000,.02),new THREE.Vector3(0,0,-1))
    .intersectObject(d.body,true);
  assert.equal(ray(...(kind==='camera'?[17,25]:[5.6,26.4])).length,0,'mount hole must be open');
  if(kind==='camera') assert.equal(ray(-17,0).length,0,'camera fork must be open');
  assert.ok(ray(0,0).length>0,'plate web must exist');
  const bounds=new THREE.Box3().setFromObject(d.body);
  assert.ok(bounds.max.z<=d.frames.sensor_mount[2]+1e-8,'sensor seating face clears the plate');
  const extent=bounds.getSize(new THREE.Vector3());
  assert.ok(extent.x>.04 && extent.x<.09 && extent.y>.05 && extent.y<.09);
  assert.equal(d.inertial,undefined,'unknown inertial values must remain absent');
  const c=d.collisions[0],lo=c.at.map((x,i)=>x-c.size[i]/2),hi=c.at.map((x,i)=>x+c.size[i]/2);
  assert.ok(new THREE.Box3(new THREE.Vector3(...lo),new THREE.Vector3(...hi)).expandByScalar(1e-10).containsBox(bounds));
});
