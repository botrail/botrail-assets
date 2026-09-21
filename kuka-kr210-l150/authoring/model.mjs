/** CC0 authored shells. Numeric ROS-I joint coordinates only; no imported CAD. */
import * as THREE from 'three';
import {addMesh, namedMaterial, roundedBox, cylinderZ}
  from '@botrail/authoring/geometry.mjs';

// ROS-I kr210l150_macro.xacro @ 54444a29c50fee342efd4f76c00265fa02c4155a.
// Preserve r1's planning convention; these are not calibrated controller data.
export const origins = [
  [-0.00262,0.00097586,0.33099], [0.35277,-0.037476,0.4192],
  [-0.000098483,-0.1475,1.2499], [0.95795,0.184,-0.055059],
  [0.542,0,0], [0.1925,0,0],
];
export const limitsDeg = [[-185,185],[-45,85],[-210,65],[-350,350],[-125,125],[-350,350]];
export const speedsDeg = [123,115,112,179,172,219]; // community planning limits, not rated-load speeds
const orange=namedMaterial('kuka_orange','#ed6b21',0.12,0.48);
const dark=namedMaterial('motor_graphite','#292b2d',0.25,0.55);
const steel=namedMaterial('flange_steel','#b1b4b7',0.75,0.32);
const black=namedMaterial('joint_seal','#121416',0.0,0.8);
const box=(size,xyz)=>({kind:'box',size,xyz});
const cyl=(radius,length,xyz,rpy=[0,0,0])=>({kind:'cylinder',radius,length,xyz,rpy});
const G=()=>new THREE.Group();
const fixed=(name,parent,child,xyz=[0,0,0],rpy=[0,0,0])=>({name,type:'fixed',parent,child,xyz,rpy});

function housing(g,name,at,radius,width,material=orange,axis='y') {
  const shape=cylinderZ(radius,width,{radial:48});
  if(axis==='y') shape.rotateX(Math.PI/2);
  if(axis==='x') shape.rotateY(Math.PI/2);
  return addMesh(g,name,shape,material,at);
}
function shell(g,name,size,at,material=orange,radius=0.04) {
  return addMesh(g,name,roundedBox(size,radius,3),material,at);
}
function tapered(g,name,a,b,r1,r2,material=orange) {
  const start=new THREE.Vector3(...a), end=new THREE.Vector3(...b), delta=end.clone().sub(start);
  const mesh=addMesh(g,name,new THREE.CylinderGeometry(r2,r1,delta.length(),8),material,
    start.clone().add(end).multiplyScalar(0.5).toArray());
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
}

export function definition() {
  const base=G();
  shell(base,'foot',[0.79,0.71,0.085],[0,0,0.0425],dark,0.025);
  housing(base,'pedestal',[0,0,0.18],0.32,0.27,orange,'z');
  housing(base,'a1_seal',[0,0,0.32],0.29,0.020,black,'z');
  for(const x of [-0.32,0.32]) for(const y of [-0.27,0.27])
    housing(base,`foot_boss_${x}_${y}`.replaceAll('-','n').replaceAll('.','_'),[x,y,0.075],0.038,0.026,steel,'z');

  const column=G();
  shell(column,'rotating_column',[0.47,0.45,0.39],[0.10,0,0.195]);
  shell(column,'a1_rear_motor',[0.27,0.32,0.24],[-0.20,0,0.18],dark);
  tapered(column,'shoulder_support',[0.07,0,0.13],[0.35277,-0.037476,0.4192],0.22,0.20);
  housing(column,'a2_bearing',origins[1],0.22,0.42);
  housing(column,'a2_motor',[0.35277,0.25,0.4192],0.16,0.18,dark);

  const upper=G();
  housing(upper,'a2_hub',[0,-0.08,0],0.207,0.27);
  tapered(upper,'link_arm',[0,-0.085,0.05],[0,-0.1475,1.2499],0.185,0.145);
  shell(upper,'link_arm_rib',[0.13,0.29,0.84],[-0.12,-0.12,0.64],orange,0.025);
  housing(upper,'a3_bearing',origins[2],0.19,0.30);
  housing(upper,'a3_motor',[0,-0.36,1.2499],0.13,0.20,dark);

  const elbow=G();
  housing(elbow,'elbow_joint',[0,0.03,0],0.18,0.28);
  // Elbow housing reaches A4 without copying a tessellated casting.
  tapered(elbow,'forearm_casting',[0.08,0.15,-0.025],[0.94,0.184,-0.055059],0.18,0.115);
  shell(elbow,'wrist_motor',[0.35,0.20,0.23],[0.14,0.30,0.13],dark,0.03);
  housing(elbow,'a4_seal',origins[3],0.12,0.035,black,'x');

  const forearm=G();
  tapered(forearm,'arm_extension',[0,0,0],[0.47,0,0],0.112,0.09);
  housing(forearm,'wrist_bearing',[0.542,0,0],0.115,0.19);
  housing(forearm,'wrist_side_cap',[0.542,-0.11,0],0.082,0.025,dark);

  const wrist=G();
  housing(wrist,'a5_housing',[0,0,0],0.10,0.15);
  tapered(wrist,'wrist_nose',[0.03,0,0],[0.18,0,0],0.09,0.095);
  housing(wrist,'a6_seal',[0.18,0,0],0.102,0.015,black,'x');
  const flange=G();
  housing(flange,'output_face',[0.01875,0,-0.00023924],0.10,0.0375,steel,'x');
  // No invented bolt pattern, pilot fit, link inertias, efforts or cable dynamics.
  const links=[
    {name:'base_link',visual:base,collisions:[box([0.79,0.71,0.085],[0,0,0.0425]),cyl(0.32,0.23,[0,0,0.20])]},
    {name:'link_1',visual:column,collisions:[box([0.50,0.46,0.34],[0.10,0,0.19]),cyl(0.20,0.42,origins[1],[Math.PI/2,0,0])]},
    {name:'link_2',visual:upper,collisions:[box([0.34,0.30,1.10],[0,-0.12,0.625])]},
    {name:'link_3',visual:elbow,collisions:[box([0.82,0.31,0.30],[0.46,0.15,-0.03])]},
    {name:'link_4',visual:forearm,collisions:[cyl(0.115,0.49,[0.25,0,0],[0,Math.PI/2,0])]},
    {name:'link_5',visual:wrist,collisions:[cyl(0.10,0.16,[0.08,0,0],[0,Math.PI/2,0])]},
    {name:'link_6',visual:flange,collisions:[cyl(0.10,0.0375,[0.01875,0,-0.00023924],[0,Math.PI/2,0])]},
    {name:'tool0'},{name:'flange'},{name:'Link1'},
  ];
  const axes=[[0,0,1],[0,1,0],[0,1,0],[1,0,0],[0,1,0],[1,0,0]];
  const joints=origins.map((xyz,i)=>({name:`joint_a${i+1}`,type:'revolute',
    parent:i===0?'base_link':`link_${i}`,child:`link_${i+1}`,xyz,axis:axes[i],
    limit:{lower:limitsDeg[i][0]*Math.PI/180,upper:limitsDeg[i][1]*Math.PI/180,velocity:speedsDeg[i]*Math.PI/180}}));
  joints.push(fixed('link_6_tool0','link_6','tool0',[0.0375,0,-0.00023924]),
    fixed('flange_joint','tool0','flange',[0,0,0],[0,Math.PI/2,0]),fixed('Link1_link_1','link_1','Link1'));
  return {name:'kuka_kr210_l150_reference',links,joints};
}
