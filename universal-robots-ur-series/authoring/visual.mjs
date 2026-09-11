/** Independently authored UR shell surfaces; metres, visual only.
 * Profiles and finishes are photo-based estimates, not manufacturing geometry.
 */
import * as THREE from 'three';
import {addMesh, namedMaterial} from '@botrail/authoring/geometry.mjs';

export const finishes = {
  aluminium: namedMaterial('satin_aluminium', '#bdc2c6', .82, .27),
  housing: namedMaterial('joint_housing', '#55585b', .55, .34),
  seal: namedMaterial('joint_graphite', '#24282b', .05, .57),
  blue: namedMaterial('actuator_blue', '#71b5de', .04, .36),
  steel: namedMaterial('flange_steel', '#c6cbd0', .88, .24),
  indicator: namedMaterial('status_ring_unlit', '#a5dce8', .0, .3),
};

// Revolved meridian: [radius, axial distance]. Local axis is +Z.
export function revolved(parent, name, points, material, at = [0,0,0], axis = [0,0,1]) {
  const geometry = new THREE.LatheGeometry(points.map(p => new THREE.Vector2(...p)), 64);
  geometry.rotateX(Math.PI/2);
  const mesh = addMesh(parent, name, geometry, material, at);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), new THREE.Vector3(...axis).normalize());
  return mesh;
}

export function barrel(parent, name, radius, length, at, material, bevel = .004, axis = [0,0,1]) {
  const b = Math.min(bevel, length/2, radius/2), h = length/2;
  const points = [[0,-h],[radius-b,-h]];
  for (let i=1; i<=5; i++) {
    const a = i*Math.PI/10;
    points.push([radius-b+b*Math.sin(a), -h+b-b*Math.cos(a)]);
  }
  points.push([radius,h-b]);
  for (let i=1; i<=5; i++) {
    const a = i*Math.PI/10;
    points.push([radius-b+b*Math.cos(a), h-b+b*Math.sin(a)]);
  }
  points.push([0,h]);
  return revolved(parent,name,points,material,at,axis);
}

export function cover(parent, name, radius, at, direction = 1, triangular = false) {
  if (triangular) {
    const vertices=Array.from({length:3},(_,i)=>new THREE.Vector2(
      radius*Math.cos(i*2*Math.PI/3),radius*Math.sin(i*2*Math.PI/3)));
    const shape=new THREE.Shape();
    for(let i=0;i<3;i++) {
      const c=vertices[i],start=c.clone().lerp(vertices[(i+2)%3],.32);
      const end=c.clone().lerp(vertices[(i+1)%3],.32);
      if(i===0) shape.moveTo(start.x,start.y); else shape.lineTo(start.x,start.y);
      shape.quadraticCurveTo(c.x,c.y,end.x,end.y);
    }
    shape.closePath();
    const cap=addMesh(parent,name,new THREE.ExtrudeGeometry(shape,
      {depth:.0025,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:4,curveSegments:12}),
    finishes.blue,at);
    if(direction<0) cap.rotation.y=Math.PI;
    return cap;
  }
  barrel(parent, `${name}_gasket`, radius*1.015, .004, at, finishes.seal, .001);
  // Shallow convex polymer cover, with a rounded perimeter instead of a flat puck.
  return revolved(parent,name,[[0,0],[radius*.96,0],[radius,.0015],
    [radius,.003],[radius*.98,.005],[radius*.90,.007],
    [radius*.65,.009],[radius*.3,.010],[0,.0105]],finishes.blue,at,[0,0,direction]);
}

export function armTube(parent, name, a, b, startRadius, endRadius) {
  const direction = new THREE.Vector3(...b).sub(new THREE.Vector3(...a));
  const length = direction.length(), points = [[0,0]];
  // Bell mouths blend into the long, slightly tapered middle of each tube.
  for (let i=0; i<=32; i++) {
    const t=i/32, flare=Math.exp(-t*18)+Math.exp(-(1-t)*18);
    points.push([(startRadius*(1-t)+endRadius*t)*(.79+.21*flare),length*t]);
  }
  points.push([0,length]);
  return revolved(parent,name,points,finishes.aluminium,a,direction.toArray());
}

/** Rounded motor housing with a perpendicular cast neck for the arm tube. */
export function armEnd(parent, name, radius, axialMin, axialMax, at, tubeZ, direction) {
  barrel(parent,`${name}_housing`,radius,axialMax-axialMin,
    [at,0,(axialMin+axialMax)/2],finishes.housing,radius*.2);
  barrel(parent,`${name}_neck`,radius*.96,radius*1.25,
    [at+direction*radius*.8,0,tubeZ],finishes.housing,radius*.13,[1,0,0]);
  barrel(parent,`${name}_tube_seal`,radius*.963,.014,
    [at+direction*radius*1.45,0,tubeZ],finishes.seal,.001,[1,0,0]);
}

/** Thin conical skirt with six rounded access arches. Shape/depth are estimates. */
export function baseSkirt(parent, radius, neck, height, bottom) {
  const positions=[], indices=[], n=192, thickness=.005;
  function vertex(r,a,z) { positions.push(r*Math.cos(a),r*Math.sin(a),z); }
  for (let i=0; i<=n; i++) {
    const a=i*2*Math.PI/n;
    const arch=Math.pow(Math.max(0,Math.cos(6*a)),3);
    const lo=bottom+(height-bottom)*.71*arch;
    const outer=radius+(neck-radius)*(lo-bottom)/(height-bottom);
    vertex(outer,a,lo); vertex(neck,a,height);
    vertex(outer-thickness,a,lo); vertex(neck-thickness,a,height);
  }
  for(let i=0;i<n;i++) {
    const a=i*4,b=a+4;
    indices.push(a,b,a+1,b,b+1,a+1, a+2,a+3,b+2,b+2,a+3,b+3,
      a,a+2,b,b,a+2,b+2, a+1,b+1,a+3,b+1,b+3,a+3);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return addMesh(parent,'base_access_skirt',geometry,finishes.aluminium);
}
