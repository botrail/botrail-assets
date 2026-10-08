/** Product-local visual counterbalance. It is deliberately not exported to the
 * six-axis URDF: URDF mimic cannot express its nonlinear closed-loop motion.
 * The two anchor positions and spring dimensions are visual estimates.
 */
import * as THREE from 'three';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {addMesh,namedMaterial,cylinderZ} from '@botrail/authoring/geometry.mjs';
import {definition,balancerAnchors} from './model.mjs';
const dark=namedMaterial('balancer_graphite','#27292b',.20,.42);
const rodMaterial=namedMaterial('balancer_rod_steel','#aab0b6',.80,.25);
const vector=a=>new THREE.Vector3(...a);
export const poses={zero:[0,0,0,0,0,0],reach:[25,35,-35,25,-25,10],folded:[-30,-35,60,-30,-60,20]};
export const poseValues=name=>Object.fromEntries(poses[name].map((x,i)=>[`joint_a${i+1}`,x*Math.PI/180]));
export function balancerState(scene) {
  scene.root.updateMatrixWorld(true);
  const a=scene.links.get('link_1').localToWorld(vector(balancerAnchors.rear));
  const b=scene.links.get('link_2').localToWorld(vector(balancerAnchors.moving));
  const delta=b.clone().sub(a),length=delta.length();
  return {rear:a,moving:b,length,axis:delta.divideScalar(length),
    exposedRod:length-balancerAnchors.barrelLength};
}
export function createScene({balancer=true}={}) {
  const scene=referenceScene(definition()),basePose=scene.pose;
  if(!balancer)return scene;
  const visual=new THREE.Group();visual.name='viewer_only_counterbalance';scene.root.add(visual);
  const {barrelLength:L,barrelRadius:R}=balancerAnchors;
  addMesh(visual,'counterbalance_barrel',cylinderZ(R,L,{radial:64}),dark,[0,0,L/2]);
  for(const [name,z] of [['rear',.015],['front',L-.015]])
    addMesh(visual,`counterbalance_${name}_cap`,cylinderZ(R*1.06,.028,{radial:64}),dark,[0,0,z]);
  // Tie rods stay rigid on the barrel, rather than stretching with the piston.
  for(let i=0;i<4;i++) {
    const t=Math.PI/4+i*Math.PI/2;
    addMesh(visual,`counterbalance_tie_rod_${i}`,cylinderZ(.007,L,{radial:12}),dark,
      [R*Math.cos(t),R*Math.sin(t),L/2]);
  }
  const rod=addMesh(visual,'counterbalance_piston_rod',cylinderZ(.023,1,{radial:32}),rodMaterial);
  const eye=addMesh(visual,'counterbalance_moving_eye',cylinderZ(.039,.077,{radial:32}),dark);
  eye.geometry.rotateX(Math.PI/2);
  scene.pose=(values={})=>{
    basePose(values);const state=balancerState(scene);
    if(state.exposedRod<=0)throw new RangeError('Counterbalance estimated barrel exceeds anchor separation');
    // root has no transform in the authoring scene; both points are world metres.
    const y=new THREE.Vector3(0,1,0).transformDirection(scene.links.get('link_1').matrixWorld);
    const x=y.clone().cross(state.axis).normalize();
    const hingeY=state.axis.clone().cross(x).normalize();
    visual.position.copy(state.rear);
    visual.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,hingeY,state.axis));
    rod.position.z=L+state.exposedRod/2;rod.scale.z=state.exposedRod;
    eye.position.z=state.length;
    // Barrel local Y is the A2 hinge axis, so the cross-pin stays aligned.
    eye.quaternion.identity();
    scene.root.updateMatrixWorld(true);return state;
  };
  scene.balancer=visual;scene.pose();return scene;
}
