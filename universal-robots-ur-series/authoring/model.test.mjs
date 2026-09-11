import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import fs from 'node:fs';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {definition,dimensions} from './model.mjs';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';

for(const type of Object.keys(dimensions)) test(`${type}: separate joint links and ISO contact plane`,()=>{
  const d=definition(type), s=referenceScene(d);
  assert.equal(d.joints.filter(j=>j.type==='revolute').length,6);
  assert.equal(d.links.filter(l=>l.visual).length,7);
  for(const link of d.links.filter(l=>l.visual)) {
    const bounds=new THREE.Box3().setFromObject(link.visual),size=bounds.getSize(new THREE.Vector3());
    assert.ok(size.toArray().every(x=>Number.isFinite(x)&&x>0));
    assert.ok(link.collisions.length>0);
  }
  const face=d.links.find(l=>l.name==='wrist_3_link').visual.getObjectByName('tool_face');
  assert.ok(Math.abs(new THREE.Box3().setFromObject(face).max.z)<1e-8);
  const initial=s.links.get('tool0').getWorldPosition(new THREE.Vector3());
  s.pose({shoulder_lift_joint:-Math.PI/2,elbow_joint:Math.PI/2});
  assert.ok(initial.distanceTo(s.links.get('tool0').getWorldPosition(new THREE.Vector3()))>.3);
});

const bounds = mesh => new THREE.Box3().setFromObject(mesh);
const close = (actual,expected) => assert.ok(Math.abs(actual-expected)<2e-7,`${actual} != ${expected}`);
function ray(mesh,x,y) {
  mesh.updateMatrixWorld(true);
  return new THREE.Raycaster(new THREE.Vector3(x,y,.1),new THREE.Vector3(0,0,-1)).intersectObject(mesh,true);
}

for(const type of Object.keys(dimensions)) {
  test(`${type}: published base and tool dimensions, real flange openings`,()=>{
    const d=definition(type),large=['ur20','ur30'].includes(type);
    const base=d.links.find(l=>l.name==='base_link_inertia').visual.getObjectByName('base_mounting_plate');
    const diameter=large?.245:.204;
    close(bounds(base).getSize(new THREE.Vector3()).x,diameter);
    close(bounds(base).min.z,0);
    const tool=d.links.find(l=>l.name==='wrist_3_link').visual;
    const face=tool.getObjectByName('tool_face');
    close(bounds(face).getSize(new THREE.Vector3()).x,large?.100:.063);
    close(bounds(face).max.z,0);
    const count=large?6:4,pitch=large?.040:.025,phase=large?0:Math.PI/4;
    // Probe triangles, not the helper's hole list, including metal between holes.
    for(let i=0;i<count;i++) {
      const a=phase+i*2*Math.PI/count;
      assert.equal(ray(face,pitch*Math.cos(a),pitch*Math.sin(a)).length,0);
    }
    assert.equal(ray(face,0,pitch).length,0); // locating hole
    assert.equal(ray(face,0,0).length,0);
    assert.ok(ray(face,large?.031:.020,0).length>0);
    close(ray(tool,0,0)[0].point.z,-.0062); // blind register, not an open bore
  });

  test(`${type}: exported meshes retain transforms, normals and material assignments`,()=>{
    const d=definition(type);
    for(const {name,visual} of d.links.filter(l=>l.visual)) {
      const obj=fs.readFileSync(new URL(`../meshes/${type}/${name}.obj`,import.meta.url),'utf8');
      const mtl=fs.readFileSync(new URL(`../meshes/${type}/${name}.mtl`,import.meta.url),'utf8');
      const loaded=new OBJLoader().parse(obj);
      const expected=bounds(visual),actual=bounds(loaded);
      for(const key of ['min','max']) for(const axis of ['x','y','z']) close(actual[key][axis],expected[key][axis]);
      const sourceMaterials=new Set();visual.traverse(o=>{if(o.isMesh) sourceMaterials.add(o.material.name);});
      const loadedMaterials=new Set();
      loaded.traverse(o=>{
        if(!o.isMesh)return;
        for(const m of Array.isArray(o.material)?o.material:[o.material]) loadedMaterials.add(m.name);
        for(const attr of ['position','normal']) assert.ok(o.geometry.attributes[attr].array.every(Number.isFinite));
      });
      assert.deepEqual(loadedMaterials,sourceMaterials);
      for(const name of sourceMaterials) assert.ok(mtl.includes(`newmtl ${name}\n`));
      assert.match(mtl,/\nPm [\d.]+\nPr [\d.]+\n/);
    }
  });

  test(`${type}: visual changes retain the existing collision recipes`,()=>{
    const old=JSON.parse(fs.readFileSync(new URL(`../config/${type}-collisions.json`,import.meta.url)));
    const d=definition(type);
    assert.deepEqual(Object.fromEntries(d.links.filter(l=>l.visual).map(l=>[l.name,l.collisions])),old);
  });
}
