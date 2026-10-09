/** One stable frame includes every named pose and all linkage visuals. */
import * as THREE from 'three';
import {poses,poseValues} from './scene.mjs';
export function framingBounds(scene){
 const bounds=new THREE.Box3();
 for(const name of Object.keys(poses)){scene.pose(poseValues(name));bounds.union(new THREE.Box3().setFromObject(scene.root));}
 scene.pose();return bounds.expandByScalar(.06);
}
