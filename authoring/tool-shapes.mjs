/** Small construction helpers for SI-unit, independently authored EOAT references. */
import * as THREE from 'three';
import {addMesh, namedMaterial, roundedBox, cylinderBetween} from './geometry.mjs';
export {THREE, addMesh, namedMaterial};
export const group = () => new THREE.Group();
export const silver = namedMaterial('anodized_aluminium', '#bec6cc', .6, .38);
export const dark = namedMaterial('graphite_housing', '#363d43', .08, .6);
export const rubber = namedMaterial('elastomer', '#24282b', 0, .9);
export const blue = namedMaterial('blue_polymer', '#328ac3', 0, .52);
export const box = (g,n,size,at,mat=silver) => addMesh(g,n,roundedBox(size,Math.min(...size)*.14,3),mat,at);
export const cylinder = (g,n,r,h,at,mat=silver) => cylinderBetween(g,n,[at[0],at[1],at[2]-h/2],[at[0],at[1],at[2]+h/2],r,mat,{radial:48});
export const collisionBox = (size,xyz) => ({kind:'box',size,xyz});
export const collisionCylinder = (radius,length,xyz) => ({kind:'cylinder',radius,length,xyz});
export const fixed = (name,parent,child,xyz=[0,0,0],rpy=[0,0,0]) => ({name,type:'fixed',parent,child,xyz,rpy});
export function lathe(g,name,points,mat=dark) {
  const mesh=addMesh(g,name,new THREE.LatheGeometry(points.map(([z,r])=>new THREE.Vector2(r,z)),64),mat);
  mesh.rotation.x=Math.PI/2;
  return mesh;
}
export function plate(g,name,r,h,holes=[],mat=silver) {
  const shape=new THREE.Shape();shape.absarc(0,0,r,0,Math.PI*2,false);
  for(const [x,y,hr] of holes) {const hole=new THREE.Path();hole.absarc(x,y,hr,0,Math.PI*2,true);shape.holes.push(hole);}
  return addMesh(g,name,new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,curveSegments:48}),mat);
}
