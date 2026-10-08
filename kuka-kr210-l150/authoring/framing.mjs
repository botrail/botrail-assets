/** Product-local fixed view envelope: all presets and their A2 slider sweep.
 * A sampling margin is added; this is presentation framing, not a collision hull.
 */
import * as THREE from 'three';
import {poses,poseValues} from './scene.mjs';
export function framingBounds(scene) {
  const bounds=new THREE.Box3();
  for(const name of Object.keys(poses)) for(let a2=-45;a2<=85;a2+=5) {
    scene.pose({...poseValues(name),joint_a2:a2*Math.PI/180});
    bounds.union(new THREE.Box3().setFromObject(scene.root));
  }
  scene.pose();return bounds.expandByScalar(.025);
}
