import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {meshFiles} from '../reference-export.mjs';

test('OBJ round trip retains component translations, rotations, normals and material names',()=>{
  const visual=new THREE.Group();
  const material=Object.assign(new THREE.MeshStandardMaterial({color:'#78b5d5'}),{name:'blue_cap'});
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(.02,.04,.12),material);
  mesh.position.set(.2,-.3,.4);mesh.rotation.set(.1,.3,.7);visual.add(mesh);
  // Deliberately do not render or update matrices before exporting.
  const files=meshFiles([{name:'link',visual}]);
  const roundtrip=new OBJLoader().parse(files['meshes/link.obj']);
  const expected=new THREE.Box3().setFromObject(visual),actual=new THREE.Box3().setFromObject(roundtrip);
  assert.ok(expected.min.distanceTo(actual.min)<1e-7);
  assert.ok(expected.max.distanceTo(actual.max)<1e-7);
  const normals=roundtrip.children[0].geometry.getAttribute('normal');
  const wanted=new THREE.Vector3(1,0,0).applyQuaternion(mesh.quaternion);
  assert.ok(new THREE.Vector3().fromBufferAttribute(normals,0).distanceTo(wanted)<1e-7);
  assert.match(files['meshes/link.obj'],/mtllib link.mtl/);
  assert.match(files['meshes/link.obj'],/usemtl blue_cap/);
  assert.match(files['meshes/link.mtl'],/newmtl blue_cap/);
});
