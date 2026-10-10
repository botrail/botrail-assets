/** RG2/RG6 interface contract and independently checked motion/topology.
 * Run: node --test authoring/test/onrobot-contract.test.mjs
 * The SHA-256 hashes are the complete URDF bytes of the 2026-10-11 contract: the original
 * joint graph, mimic multipliers and mesh filenames, with pivots, links, carriers and pads
 * sized from the official STEP measurements, joint 0 at the datasheet bare-finger stroke,
 * the upper limit where the fitted pads meet, the TCP at their centre there and box/cylinder
 * collisions around each link's visual.
 * Exact sampled solid intersections are measured by audits/onrobot-motion.py.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {referenceScene} from '../reference-model.mjs';
import {urdf} from '../reference-export.mjs';
import {meshFiles as rg2Meshes} from '../../onrobot-rg2/authoring/compact-obj.mjs';
import {meshFiles as rg6Meshes} from '../../onrobot-rg6/authoring/compact-obj.mjs';
import {definition as rg2Definition,motion as rg2Motion} from '../../onrobot-rg2/authoring/model.mjs';
import {definition as rg6Definition,motion as rg6Motion} from '../../onrobot-rg6/authoring/model.mjs';

// stroke = travel between the fitted pads; the datasheet stroke is between the bare fingers.
const cases = [
  {id:'rg2', build:rg2Definition, meshFiles:rg2Meshes, stroke:rg2Motion.padTravel/1000, tcp:rg2Motion.tcp/1000, upper:rg2Motion.upper,
    hash:'e3b627fc28e69cb6bd85d31bf342ab3b4e3eb6133bcef6e5f0cdf67036d809f7'},
  {id:'rg6', build:rg6Definition, meshFiles:rg6Meshes, stroke:rg6Motion.padTravel/1000, tcp:rg6Motion.tcp/1000, upper:rg6Motion.upper,
    hash:'9ba23a7334ad9fce61bc89399f9ffd6c6e492eb752feb4c668d1bdabe2497bd3'},
];
const hash = data => createHash('sha256').update(data).digest('hex');
const vector = values => new THREE.Vector3(...values);
const close = (a,b,tolerance,why) => assert.ok(Math.abs(a-b)<=tolerance, `${why}: ${a} != ${b}`);

function collisionCorners(link) {
  assert.equal(link.collisions.length,1,'The pad contact box is a single box');
  const shape=link.collisions[0];
  assert.equal(shape.kind,'box');
  const matrix=new THREE.Matrix4().compose(vector(shape.xyz),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...(shape.rpy??[0,0,0]),'ZYX')),new THREE.Vector3(1,1,1));
  return [-1,1].flatMap(x=>[-1,1].flatMap(y=>[-1,1].map(z=>
    new THREE.Vector3(x*shape.size[0]/2,y*shape.size[1]/2,z*shape.size[2]/2).applyMatrix4(matrix))));
}

function bounds(points,matrix) {
  return new THREE.Box3().setFromPoints(points.map(p=>p.clone().applyMatrix4(matrix)));
}

function visualVertices(link) {
  const points=[];
  link.visual.updateMatrixWorld(true);
  link.visual.traverse(object=>{
    if (!object.isMesh) return;
    const position=object.geometry.getAttribute('position');
    for(let i=0;i<position.count;i++) points.push(new THREE.Vector3().fromBufferAttribute(position,i).applyMatrix4(object.matrixWorld));
  });
  return points;
}

function objObjects(text) {
  const vertices=[], objects=new Map();
  let object='default';
  for(const line of text.split('\n')) {
    const [kind,...parts]=line.trim().split(/\s+/);
    if(kind==='v') {
      const p=parts.slice(0,3).map(Number);
      assert.ok(p.length===3&&p.every(Number.isFinite),'OBJ positions must be finite');
      vertices.push(p);
    }
    if(kind==='vn') assert.ok(parts.map(Number).every(Number.isFinite),'OBJ normals must be finite');
    if(kind==='o') object=parts.join(' ');
    if(kind==='f') {
      const face=parts.map(p=>Number(p.split('/')[0])).map(n=>n<0?vertices.length+n:n-1);
      assert.ok(face.every(n=>Number.isInteger(n)&&n>=0&&n<vertices.length),'OBJ indices must resolve');
      if(!objects.has(object)) objects.set(object,[]);
      for(let i=1;i<face.length-1;i++) objects.get(object).push([face[0],face[i],face[i+1]]);
    }
  }
  return {vertices,objects};
}

function checkClosedObject(vertices,faces,label) {
  // Ignore intentional normal/UV seams; quantization is 1e-8 m (0.00001 mm).
  const ids=new Map(), points=[], edges=new Map();
  const welded=index=>{
    const point=vertices[index], key=point.map(v=>Math.round(v/1e-8)).join(',');
    if(!ids.has(key)) {ids.set(key,points.length);points.push(vector(point));}
    return ids.get(key);
  };
  let signedVolume=0;
  for(const indices of faces) {
    const face=indices.map(welded);
    assert.equal(new Set(face).size,3,`${label}: degenerate welded triangle`);
    const [a,b,c]=face.map(i=>points[i]);
    const area=new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a)).length();
    assert.ok(area>1e-20,`${label}: degenerate triangle area`);
    signedVolume+=a.dot(new THREE.Vector3().crossVectors(b,c))/6;
    for(let i=0;i<3;i++) {
      const a=face[i],b=face[(i+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(':');
      const edge=edges.get(key)??{count:0,balance:0};
      edge.count++;edge.balance+=a<b?1:-1;edges.set(key,edge);
    }
  }
  for(const edge of edges.values()) {
    assert.equal(edge.count,2,`${label}: boundary/nonmanifold edge`);
    assert.equal(edge.balance,0,`${label}: inconsistent winding`);
  }
  assert.ok(signedVolume>1e-18,`${label}: solid must have outward, positive volume`);
}

for(const entry of cases) {
  const prefix=`${entry.id}_v2_gripper`, directory=new URL(`../../onrobot-${entry.id}/`,import.meta.url);
  test(`${entry.id}: complete URDF bytes and generated export preserve the frozen public contract`,()=>{
    const definition=entry.build();
    const tracked=fs.readFileSync(new URL(`urdf/onrobot-${entry.id}.urdf`,directory));
    assert.equal(hash(tracked),entry.hash,'Committed URDF differs from the published contract');
    assert.equal(hash(urdf(definition)),entry.hash,'Authoring definition differs from the published contract');
    const generated=entry.meshFiles(definition.links);
    const filenames=Object.keys(generated).filter(p=>p.endsWith('.obj')).map(p=>p.split('/').at(-1)).sort();
    const expected=[`${prefix}_body.obj`,`${prefix}_bracket.obj`,
      ...[1,2].flatMap(side=>['moment_arm','truss_arm','finger_tip','flex_finger'].map(part=>`${prefix}_finger_${side}_${part}.obj`))].sort();
    assert.deepEqual(filenames,expected,'Consumer mesh paths must remain stable');
    for(const [path,text] of Object.entries(generated)) {
      assert.equal(hash(fs.readFileSync(new URL(path,directory))),hash(text),`Stale generated artifact: ${path}`);
    }
  });

  test(`${entry.id}: exact pad monotonicity, 1001-pose closure, parallelism, symmetry, pivot closure and TCP`,()=>{
    const definition=entry.build(), scene=referenceScene(definition);
    const master=definition.joints.filter(j=>j.type!=='fixed'&&!j.mimic);
    assert.equal(master.length,1);assert.equal(master[0].name,`${prefix}_joint`);
    close(master[0].limit.upper,entry.upper,0,'master upper limit');
    const trussJoint=definition.joints.find(j=>j.child===`${prefix}_finger_1_truss_arm`);
    const tipJoint=definition.joints.find(j=>j.child===`${prefix}_finger_1_finger_tip`);
    const momentJoint=definition.joints.find(j=>j.child===`${prefix}_finger_1_moment_arm`);
    const tip=vector(tipJoint.xyz),baseDelta=vector(momentJoint.xyz).sub(vector(trussJoint.xyz));
    // x(q)=x0+vx*cos(offset+q)+vz*sin(offset+q). Its derivative's
    // global minimum over this interval occurs at an endpoint or stationary point.
    const lower=trussJoint.rpy[1]+master[0].limit.lower, upper=trussJoint.rpy[1]+master[0].limit.upper;
    const candidates=[lower,upper],stationary=Math.atan2(-tip.x,tip.z);
    for(let k=-3;k<=3;k++) {const a=stationary+k*Math.PI;if(a>lower&&a<upper)candidates.push(a);}
    const minimumDx=Math.min(...candidates.map(a=>-tip.x*Math.sin(a)+tip.z*Math.cos(a)));
    assert.ok(minimumDx>0,'Analytic pad gap must strictly decrease over the entire continuous interval');
    const pads=[1,2].map(side=>definition.links.find(l=>l.name===`${prefix}_finger_${side}_flex_finger`));
    const collision=pads.map(collisionCorners),visual=pads.map(visualVertices);
    assert.ok(visual.every(points=>points.length>0));
    const collisionGaps=[],visualGaps=[];
    for(let step=0;step<=1000;step++) {
      const q=entry.upper*step/1000;scene.pose({[master[0].name]:q});
      const cb=pads.map((pad,i)=>bounds(collision[i],scene.links.get(pad.name).matrixWorld));
      const vb=pads.map((pad,i)=>bounds(visual[i],scene.links.get(pad.name).matrixWorld));
      const cg=cb[1].min.x-cb[0].max.x,vg=vb[1].min.x-vb[0].max.x;
      collisionGaps.push(cg);visualGaps.push(vg);
      assert.ok(cg>=-1e-10,`Contact boxes overlap at q=${q}`);
      assert.ok(vg>=-1e-8,`Visible opposing pads overlap at q=${q}`);
      close(vg,cg,2e-8,`Contact boxes must share the visible contact planes at q=${q}`);
      close(cb[0].min.x,-cb[1].max.x,1e-10,'Mirror x extent');
      close(cb[0].min.z,cb[1].min.z,1e-10,'Mirror z extent');
      for(const pad of pads) {
        const normal=new THREE.Vector3(1,0,0).transformDirection(scene.links.get(pad.name).matrixWorld);
        assert.ok(Math.hypot(normal.y,normal.z)<1e-12,'Pad contact normal must remain on the x axis');
      }
      for(const side of [1,2]) {
        const moment=scene.links.get(`${prefix}_finger_${side}_moment_arm`);
        const carrier=scene.links.get(`${prefix}_finger_${side}_finger_tip`);
        const endpoint=tip.clone().applyMatrix4(moment.matrixWorld);
        const carrierEndpoint=baseDelta.clone().applyMatrix4(carrier.matrixWorld);
        assert.ok(endpoint.distanceTo(carrierEndpoint)<1e-12,`Parallelogram fails to close at q=${q}`);
      }
      const tcp=scene.links.get('tcp').getWorldPosition(new THREE.Vector3());
      assert.ok(tcp.distanceTo(new THREE.Vector3(0,0,entry.tcp))<1e-12,'TCP compatibility');
    }
    for(const [label,gaps] of [['collision',collisionGaps],['visual',visualGaps]]) {
      close(gaps[0],entry.stroke,1e-6,`${label} open stroke`);
      close(gaps.at(-1),0,1e-8,`${label} closed contact`);
      assert.ok(gaps.every((gap,i)=>i===0||gap<gaps[i-1]),`${label} sampled gap is strictly decreasing`);
    }
  });

  test(`${entry.id}: collision shapes enclose each link's visual`,()=>{
    // Every link is enclosed to 1 µm (float32 vertices on a box face).
    for(const link of entry.build().links) {
      if(!link.visual) continue;
      const frames=link.collisions.map(shape=>{
        assert.ok(shape.kind==='box'||shape.kind==='cylinder',shape.kind);
        return new THREE.Matrix4().compose(vector(shape.xyz),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(...(shape.rpy??[0,0,0]),'ZYX')),new THREE.Vector3(1,1,1)).invert();
      });
      const outside=(shape,local)=>shape.kind==='box'
        ? Math.hypot(...['x','y','z'].map((axis,k)=>Math.max(Math.abs(local[axis])-shape.size[k]/2,0)))
        : Math.hypot(Math.max(Math.hypot(local.x,local.y)-shape.radius,0),Math.max(Math.abs(local.z)-shape.length/2,0));
      let worst=0;
      for(const point of visualVertices(link)) {
        worst=Math.max(worst,Math.min(...link.collisions.map((shape,i)=>outside(shape,point.clone().applyMatrix4(frames[i])))));
      }
      assert.ok(worst<=1e-6,`${link.name}: visual stands ${(worst*1000).toFixed(2)} mm outside its collision shapes`);
    }
  });

  test(`${entry.id}: TCP is the closed-pose centre of the visible boots`,()=>{
    const definition=entry.build(), scene=referenceScene(definition);
    scene.pose({[`${prefix}_joint`]:entry.upper});
    const centre=new THREE.Vector3();
    for(const side of [1,2]) centre.add(new THREE.Box3().setFromObject(scene.links.get(`${prefix}_finger_${side}_flex_finger`)).getCenter(new THREE.Vector3()));
    centre.multiplyScalar(.5);
    const tcp=scene.links.get('tcp').getWorldPosition(new THREE.Vector3());
    assert.ok(tcp.distanceTo(centre)<1e-9,`TCP ${tcp.toArray()} vs boot centre ${centre.toArray()}`);
  });

  test(`${entry.id}: all generated visual objects have welded closed, manifold, outward topology`,()=>{
    const generated=entry.meshFiles(entry.build().links);
    for(const [filename,text] of Object.entries(generated)) {
      if(!filename.endsWith('.obj')) continue;
      const {vertices,objects}=objObjects(text);
      assert.ok(objects.size>0,`${filename}: no objects`);
      for(const [name,faces] of objects) checkClosedObject(vertices,faces,`${filename}/${name}`);
    }
  });
}
