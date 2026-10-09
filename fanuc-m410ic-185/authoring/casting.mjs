/** Original product-local casting construction. Metres; no sampled vendor mesh.
 * Sections describe authored envelopes, not measured manufacturing geometry.
 */
import * as THREE from 'three';
import {addMesh} from '@botrail/authoring/geometry.mjs';

/** Closed rounded-rectangle loft. Sections are [t,u,v,halfU,halfV,power].
 * power=2 gives an ellipse, larger powers give a broad, flatter casting face.
 * In axis z, u/v are x/y. In axis x, u/v are y/z.
 */
export function loftGeometry(sections, axis='z', segments=48) {
  if (!['x','z'].includes(axis) || sections.length<2) throw new Error('Invalid loft');
  const positions=[],indices=[];
  const xyz=(t,u,v)=>axis==='z'?[u,v,t]:[t,u,v];
  for(const [t,u,v,ru,rv,power=3] of sections) {
    if(![t,u,v,ru,rv,power].every(Number.isFinite)||ru<=0||rv<=0||power<2)
      throw new Error('Invalid casting section');
    for(let k=0;k<segments;k++) {
      const a=k*2*Math.PI/segments,c=Math.cos(a),s=Math.sin(a);
      positions.push(...xyz(t,u+ru*Math.sign(c)*Math.abs(c)**(2/power),
        v+rv*Math.sign(s)*Math.abs(s)**(2/power)));
    }
  }
  for(let j=0;j<sections.length-1;j++) for(let k=0;k<segments;k++) {
    const a=j*segments+k,b=j*segments+(k+1)%segments,c=b+segments,d=a+segments;
    indices.push(a,b,c,a,c,d);
  }
  // Separate cap vertices retain a crisp mating plane while the walls are smooth.
  for(const j of [0,sections.length-1]) {
    const offset=positions.length/3;
    for(let k=0;k<segments;k++) positions.push(...positions.slice((j*segments+k)*3,(j*segments+k)*3+3));
    positions.push(...xyz(...sections[j].slice(0,3)));const center=positions.length/3-1;
    for(let k=0;k<segments;k++) {
      const a=offset+k,b=offset+(k+1)%segments;
      if(j===0) indices.push(center,b,a); else indices.push(center,a,b);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);
  g.computeVertexNormals();g.computeBoundingBox();return g;
}

export function casting(group,name,sections,material,axis='z') {
  return addMesh(group,name,loftGeometry(sections,axis),material);
}

/** Bevelled side profile in the X/Z plane, extruded along Y. */
export function profile(group,name,shape,depth,y,material,bevel=0.012) {
  const g=new THREE.ExtrudeGeometry(shape,{depth:depth-2*bevel,bevelEnabled:true,
    bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,steps:1,curveSegments:24});
  // Shape +Y becomes world +Z; extrusion +Z becomes world -Y.
  g.rotateX(Math.PI/2);return addMesh(group,name,g,material,[0,y+depth/2-bevel,0]);
}
