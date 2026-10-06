import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition,D} from './model.mjs';
const near=(a,b,t=1e-3)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`);
test('AK-R-FKS05 keeps the 600 x 700 frame, the 800 mm plate height and the 100 mm column offset',()=>{
  const d=definition(),s=referenceScene(d),part=n=>new THREE.Box3().setFromObject(s.root.getObjectByName(n));
  const all=new THREE.Box3().setFromObject(s.root),size=all.getSize(new THREE.Vector3());
  near(size.y,D.d);near(all.min.z,0,1e-6);near(all.max.z,.800,1e-6);
  near(part('cross_beam_near').getSize(new THREE.Vector3()).x,D.w,1e-6);
  assert.ok(size.x>=D.w&&size.x<=D.w+.020,`the knobs overhang the 600 mm beams by a few mm: ${size.x}`);
  const column=part('column');
  near(column.getCenter(new THREE.Vector3()).y,-.100,1e-6);near(column.getCenter(new THREE.Vector3()).x,0,1e-6);
  near(column.getSize(new THREE.Vector3()).x,.120,1e-6);near(column.max.z,.780,1e-6);
  near(part('cross_beam_far').min.z,.132,1e-6);
  // 390 mm from the far end of the depth to the column, as dimensioned in the plan view
  near(D.d/2-column.max.y,.390,1e-6);
  const mount=s.links.get('robot_mount').getWorldPosition(new THREE.Vector3());
  near(mount.x,0,1e-9);near(mount.y,-.100,1e-9);near(mount.z,.800,1e-9);
  assert.ok(d.joints.every(j=>j.type==='fixed'));assert.ok(d.links.every(l=>!l.inertial));
});
