/** MiR250 CC0 geometry from public dimensions; see ../README.md for assumptions. */
import * as THREE from 'three';
import {addMesh,namedMaterial,roundedBox,cylinderZ} from '@botrail/authoring/geometry.mjs';
export const dimensions={length:0.800,width:0.580,height:0.300,clearance:0.025,
  driveRadius:0.100,driveHalfTrack:0.2015,casterRadius:0.0625,casterTrail:0.0382};
const gray=namedMaterial('iron_gray','#666c70',0.12,0.58);
const deck=namedMaterial('top_plate','#85888a',0.15,0.55);
const black=namedMaterial('rubber_and_seals','#171b1e',0.0,0.85);
const dark=namedMaterial('scanner_window','#141c23',0.20,0.23);
const hub=namedMaterial('wheel_hub','#b5b8b9',0.65,0.4);
const blue=namedMaterial('drive_tyre','#3c4978',0.0,0.8);
const light=namedMaterial('status_light','#c7edf3',0.0,0.3);
const G=()=>new THREE.Group();
const fixed=(name,parent,child,xyz=[0,0,0])=>({name,type:'fixed',parent,child,xyz});
const box=(size,xyz)=>({kind:'box',size,xyz});
function shell(g,name,size,at,mat=gray,r=0.01) {return addMesh(g,name,roundedBox(size,r,3),mat,at);}

export function definition() {
  const d=dimensions,g=G(),links=[{name:'base_footprint'}],joints=[];
  // Narrow lower chassis leaves the four caster wheel wells visible.
  shell(g,'lower_chassis',[0.75,0.32,0.11],[0,0,0.080],gray,0.018);
  for(const sy of [-1,1]) shell(g,`side_skirt_${sy>0?'l':'r'}`,[0.38,0.044,0.15],
    [0,sy*0.266,0.103],gray,0.012);
  shell(g,'lower_bumper',[0.798,0.578,0.058],[0,0,0.159],gray,0.018);
  shell(g,'recessed_sensor_band',[0.69,0.47,0.042],[0,0,0.203],black,0.015);
  shell(g,'upper_body',[0.796,0.576,0.061],[0,0,0.2545],gray,0.015);
  shell(g,'deck_seal',[0.800,0.580,0.014],[0,0,0.285],black,0.006);
  shell(g,'load_surface',[0.790,0.570,0.008],[0,0,0.296],deck,0.0035);
  // Two diagonal scanner windows, two front cameras, eight status lights.
  for(const [sx,sy] of [[1,1],[-1,-1]]) {
    addMesh(g,`scanner_${sx>0?'front':'rear'}`,cylinderZ(0.037,0.035,{radial:48}),dark,
      [sx*0.327,sy*0.215,0.205]);
  }
  for(const sy of [-1,1]) {
    shell(g,`camera_${sy>0?'l':'r'}`,[0.006,0.028,0.067],[0.397,sy*0.15,0.142],dark,0.002);
    for(const z of [0.122,0.145,0.164]) {
      const lens=cylinderZ(0.006,0.007,{radial:20});lens.rotateY(Math.PI/2);
      addMesh(g,`lens_${sy}_${z}`.replaceAll('-','n').replaceAll('.','_'),lens,hub,[0.396,sy*0.15,z]);
    }
  }
  for(const sx of [-1,1]) for(const sy of [-1,1]) {
    const tag=`${sx>0?'f':'b'}${sy>0?'l':'r'}`;
    shell(g,`signal_end_${tag}`,[0.003,0.029,0.014],[sx*0.3985,sy*0.222,0.248],light,0.001);
    shell(g,`signal_side_${tag}`,[0.029,0.003,0.014],[sx*0.332,sy*0.2885,0.248],light,0.001);
  }
  links.push({name:'base_link',visual:g,
    collisions:[box([d.length,d.width,d.height-d.clearance],[0,0,(d.height+d.clearance)/2])]});
  joints.push(fixed('base_joint','base_footprint','base_link'));
  const wheel=(name,joint,parent,radius,width,xyz,tyre)=>{
    const w=G(),shape=cylinderZ(radius,width,{radial:48});shape.rotateX(Math.PI/2);
    addMesh(w,`${name}_tyre`,shape,tyre);
    const cap=cylinderZ(radius*0.73,width+0.003,{radial:40});cap.rotateX(Math.PI/2);
    addMesh(w,`${name}_hub`,cap,hub);
    const axle=cylinderZ(radius*0.25,width+0.004,{radial:24});axle.rotateX(Math.PI/2);
    addMesh(w,`${name}_axle`,axle,black);
    // A visible spoke also makes the wheel rotation observable in previews.
    shell(w,`${name}_spoke`,[radius*1.2,width+0.005,0.012],[0,0,0],gray,0.004);
    links.push({name,visual:w});
    joints.push({name:joint,type:'continuous',parent,child:name,xyz,axis:[0,1,0],limit:{velocity:2/radius}});
  };
  for(const [tag,sy] of [['left',1],['right',-1]])
    wheel(`${tag}_wheel_link`,`${tag}_wheel_joint`,'base_link',d.driveRadius,0.060,[0,sy*d.driveHalfTrack,d.driveRadius],blue);
  // Authored stations: 4.2–5.5 mm inward from r1, keeping every swivel pose inside 800 mm.
  for(const [tag,x,y] of [['fl',0.295,0.188],['fr',0.295,-0.188],['bl',-0.295,0.188],['br',-0.295,-0.188]]) {
    const fork=G();
    for(const sy of [-1,1]) shell(fork,`fork_${sy>0?'l':'r'}`,[0.062,0.009,0.075],[-0.022,sy*0.026,-0.063],gray,0.004);
    links.push({name:`${tag}_caster_rotation_link`,visual:fork});
    joints.push({name:`${tag}_caster_rotation_joint`,type:'continuous',parent:'base_link',child:`${tag}_caster_rotation_link`,xyz:[x,y,0.1565],axis:[0,0,1],limit:{}});
    wheel(`${tag}_caster_wheel_link`,`${tag}_caster_wheel_joint`,`${tag}_caster_rotation_link`,d.casterRadius,0.039,[-d.casterTrail,0,-0.094],black);
  }
  links.push({name:'deck'},{name:'surface'});
  joints.push(fixed('deck_joint','base_link','deck',[0,0,d.height]),fixed('surface_joint','base_link','surface',[0,0,d.height]));
  // Unknown sensor calibrations and top-module bolt patterns are not declared.
  return {name:'mir250_reference',links,joints};
}
