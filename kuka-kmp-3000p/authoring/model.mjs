/** KUKA KMP 3000P: published envelope, lift and running gear, own geometry.
 * Facts (KUKA product page and KUKA news "KMP 3000P", 2026-10-30): 2200 x 1200
 * x 370 mm, up to 3 t, integrated electric lift 100 mm at 30 mm/s, 1.2 m/s
 * empty / 1.0 m/s loaded, turning radius on the spot 1.3 m, omnidirectional
 * drive — powered swivel castors in two drive units of two wheels each; two
 * laser scanners (front and rear), a 3D camera on each side, six emergency
 * stops, a bumper bar. Two platforms share loads up to 6 t, one as master
 * (KUKA partner Parmley Graham). Not published, estimated from KUKA's product
 * renders: the layer heights, the shell and lift plate insets, where the
 * drive units and the support castors stand, wheel sizes. No vendor CAD,
 * drawing, texture or logo.
 */
import * as THREE from 'three';
import {addMesh,cylinderZ,namedMaterial,roundedBox,roundedRectangle} from '@botrail/authoring/geometry.mjs';

export const dimensions={
  // Published.
  length:2.200,width:1.200,height:0.370,stroke:0.100,liftSpeed:0.030,speedEmpty:1.2,turningRadius:1.300,
  // Estimated: skirt, recessed band and white shell layers (z), the shell 40 mm inside the
  // bumper, the lift plate 30 mm inside the shell; the plate's top is the published height.
  skirt:[0.045,0.115],band:[0.115,0.160],shell:[0.160,0.350],plate:0.020,
  corner:0.100,shellInset:0.040,plateInset:0.070,
  // Estimated running gear: drive units on the long axis, support castors at the corners.
  driveX:0.700,driveTrack:0.180,driveWheel:[0.100,0.060],castorX:0.900,castorY:0.420,castor:[0.0625,0.050],
};

const white=namedMaterial('shell_white','#e8e9ea',0.0,0.45);
const skirtBlack=namedMaterial('skirt_black','#1b1c1e',0.1,0.6);
const bandGrey=namedMaterial('band_graphite','#2a2c2f',0.1,0.55);
const bumperLine=namedMaterial('bumper_silver','#9ba1a7',0.6,0.35);
const plateDark=namedMaterial('lift_plate_graphite','#2e3236',0.3,0.55);
const plateDetail=namedMaterial('lift_plate_detail','#41464b',0.4,0.45);
const columnDark=namedMaterial('lift_column_black','#161718',0.2,0.6);
const glass=namedMaterial('sensor_glass','#0d0e0f',0.2,0.15);
const estopRed=namedMaterial('estop_red','#c8102e',0.0,0.4);
const estopYellow=namedMaterial('estop_yellow','#f2c200',0.0,0.5);
const led=namedMaterial('status_led','#f3f6f9',0.0,0.2);
const vent=namedMaterial('vent_grille','#55595e',0.3,0.6);
const seam=namedMaterial('panel_seam','#b9bcbf',0.2,0.5);
const rubber=namedMaterial('tyre_polyurethane','#141516',0.0,0.8);
const hub=namedMaterial('wheel_hub','#7b8086',0.6,0.4);

const G=()=>new THREE.Group();
const box=(size,xyz)=>({kind:'box',size,xyz});
/** A plan-rounded slab from z0 to z1 (corner radius r in plan). */
function slab(g,name,width,depth,r,z0,z1,mat){
  const geometry=new THREE.ExtrudeGeometry(roundedRectangle(width,depth,r),{depth:z1-z0,bevelEnabled:false,curveSegments:10});
  return addMesh(g,name,geometry,mat,[0,0,z0]);
}
/** A disk on a face: axis along the face's outward normal ('x' or 'y', sign from the position). */
function disk(g,name,radius,depth,mat,at,normal){
  const m=addMesh(g,name,cylinderZ(radius,depth,{radial:32}),mat,at);
  if(normal==='x')m.rotateY(Math.PI/2);else m.rotateX(Math.PI/2);
  return m;
}

export function definition(){
  const d=dimensions,links=[],joints=[];
  const L=d.length,W=d.width;
  const sL=L-2*d.shellInset,sW=W-2*d.shellInset;           // shell 2120 x 1120
  const fx=sL/2,fy=sW/2;                                     // shell faces

  // --- chassis: skirt with its bumper line, recessed band, white shell, sensors ---
  const body=G();
  slab(body,'skirt',L-0.010,W-0.010,d.corner-0.005,d.skirt[0],d.skirt[1],skirtBlack);
  slab(body,'bumper_bar',L,W,d.corner,d.skirt[0]+0.022,d.skirt[0]+0.030,bumperLine);
  slab(body,'band',L-0.060,W-0.060,d.corner-0.030,d.band[0],d.band[1],bandGrey);
  slab(body,'shell',sL,sW,d.corner-d.shellInset,d.shell[0],d.shell[1],white);
  // Panel seams on the long sides and across the top rim.
  for(const sx of [-1,1])for(const sy of [-1,1])
    addMesh(body,`seam_${sx>0?'front':'rear'}_${sy>0?'left':'right'}`,new THREE.BoxGeometry(0.004,0.002,d.shell[1]-d.shell[0]-0.01),seam,[sx*0.55,sy*(fy+0.001),(d.shell[0]+d.shell[1])/2]);
  // Laser scanners, front-left and rear-right, in the band under the shell's corner.
  for(const [name,sx,sy] of [['front',1,1],['rear',-1,-1]])
    addMesh(body,`scanner_${name}`,cylinderZ(0.065,d.band[1]-d.band[0],{radial:40}),glass,[sx*(fx-0.035),sy*(fy-0.035),(d.band[0]+d.band[1])/2]);
  // Six emergency stops: both ends near each corner, the middle of each long side.
  const zStop=0.290;
  for(const sx of [-1,1])for(const sy of [-1,1]){
    const tag=`${sx>0?'front':'rear'}_${sy>0?'left':'right'}`;
    disk(body,`estop_collar_${tag}`,0.034,0.006,estopYellow,[sx*(fx+0.003),sy*0.40,zStop],'x');
    disk(body,`estop_${tag}`,0.026,0.022,estopRed,[sx*(fx+0.011),sy*0.40,zStop],'x');
  }
  for(const sy of [-1,1]){
    const tag=sy>0?'left':'right';
    disk(body,`estop_collar_${tag}`,0.034,0.006,estopYellow,[0,sy*(fy+0.003),zStop],'y');
    disk(body,`estop_${tag}`,0.026,0.022,estopRed,[0,sy*(fy+0.011),zStop],'y');
  }
  // A 3D camera window on each side, status LED strips, vent grilles.
  for(const sx of [-1,1]){
    addMesh(body,`camera_${sx>0?'front':'rear'}`,new THREE.BoxGeometry(0.006,0.110,0.090),glass,[sx*(fx+0.002),-0.25*sx,0.270]);
    addMesh(body,`led_${sx>0?'front':'rear'}`,new THREE.BoxGeometry(0.006,0.460,0.012),led,[sx*(fx+0.002),0.10*sx,0.185]);
  }
  for(const sy of [-1,1]){
    const tag=sy>0?'left':'right';
    addMesh(body,`camera_${tag}`,new THREE.BoxGeometry(0.080,0.006,0.022),glass,[0,sy*(fy+0.002),0.245]);
    addMesh(body,`led_${tag}`,new THREE.BoxGeometry(0.700,0.006,0.012),led,[0.25,sy*(fy+0.002),0.185]);
    for(const sx of [-1,1])addMesh(body,`vent_${sx>0?'front':'rear'}_${tag}`,roundedBox([0.120,0.006,0.100],0.002,1),vent,[sx*0.70,sy*(fy+0.002),0.275]);
  }
  links.push({name:'base_footprint'});
  links.push({name:'base_link',visual:body,
    // The machine as the aisle sees it: bumper footprint, skirt bottom to the shell's top
    // (2 mm short of the lift plate, which is its own link).
    collisions:[box([L,W,d.shell[1]-0.002-d.skirt[0]],[0,0,(d.skirt[0]+d.shell[1]-0.002)/2])]});
  joints.push({name:'base_joint',type:'fixed',parent:'base_footprint',child:'base_link',xyz:[0,0,0]});

  // --- lift: the dark top plate on its column, 100 mm up ---
  const plate=G(),pL=L-2*d.plateInset,pW=W-2*d.plateInset;   // 2060 x 1060
  // The plate's face sits 0.5 mm under the deck; its inlays (seams, centre disk, fixing
  // points) come up to it, so the deck is the top of everything.
  slab(plate,'plate',pL,pW,0.040,0,d.plate-0.0005,plateDark);
  for(const sx of [-1,1])addMesh(plate,`plate_joint_${sx>0?'front':'rear'}`,new THREE.BoxGeometry(0.004,pW-0.04,0.001),plateDetail,[sx*0.36,0,d.plate-0.0005]);
  addMesh(plate,'centre_disk',cylinderZ(0.110,0.001,{radial:48}),plateDetail,[0,0,d.plate-0.0005]);
  for(const [x,y] of [[0.70,0.30],[0.70,-0.30],[-0.70,0.30],[-0.70,-0.30],[0.45,0],[-0.45,0]])
    addMesh(plate,`fixing_${x>0?'f':'r'}${Math.round(Math.abs(x)*100)}_${y>0?'l':y<0?'r':'c'}`,cylinderZ(0.022,0.001,{radial:24}),columnDark,[x,y,d.plate-0.0005]);
  addMesh(plate,'column',new THREE.BoxGeometry(1.700,0.800,d.stroke),columnDark,[0,0,-d.stroke/2]);
  links.push({name:'lift_plate',visual:plate,collisions:[box([pL,pW,d.plate],[0,0,d.plate/2])]});
  joints.push({name:'lift',type:'prismatic',parent:'base_link',child:'lift_plate',xyz:[0,0,d.shell[1]],axis:[0,0,1],
    limit:{lower:0,upper:d.stroke,velocity:d.liftSpeed,effort:30000}});
  // The load seat: the plate's top, +Z up — 370 mm lowered, 470 mm raised.
  links.push({name:'deck'});
  joints.push({name:'deck_joint',type:'fixed',parent:'lift_plate',child:'deck',xyz:[0,0,d.plate]});

  // --- running gear: visual only (the aisle check rides the collision box) ---
  const wheelLimit=radius=>({effort:500,velocity:Number((d.speedEmpty/radius).toPrecision(6))});
  const tyre=(g,name,radius,width,y)=>{
    addMesh(g,`${name}_tyre`,cylinderZ(radius,width,{radial:36}),rubber,[0,y,0]).rotateX(Math.PI/2);
    addMesh(g,`${name}_hub`,cylinderZ(radius*0.55,width+0.004,{radial:24}),hub,[0,y,0]).rotateX(Math.PI/2);
  };
  // Two drive units on the long axis: a bogie swivelling about the vertical, two wheels on
  // one axle (botrail turns one wheel joint per unit, from the unit centre's travel).
  for(const [tag,sx] of [['front',1],['rear',-1]]){
    const [r,w]=d.driveWheel,bogie=G();
    addMesh(bogie,'bogie',roundedBox([0.240,0.300,0.070],0.010,2),columnDark,[0,0,r+0.045]);
    links.push({name:`drive_unit_${tag}`,visual:bogie});
    joints.push({name:`steer_${tag}`,type:'continuous',parent:'base_link',child:`drive_unit_${tag}`,xyz:[sx*d.driveX,0,r],axis:[0,0,1],limit:{effort:500,velocity:2.0}});
    const pair=G();
    for(const sy of [-1,1])tyre(pair,sy>0?'left':'right',r,w,sy*d.driveTrack/2);
    links.push({name:`drive_wheel_${tag}`,visual:pair});
    joints.push({name:`drive_wheel_${tag}`,type:'continuous',parent:`drive_unit_${tag}`,child:`drive_wheel_${tag}`,xyz:[0,0,0],axis:[0,1,0],limit:wheelLimit(r)});
  }
  // Four support castors at the corners, each a fork swivelling over its wheel.
  for(const sx of [-1,1])for(const sy of [-1,1]){
    const tag=`${sx>0?'f':'r'}${sy>0?'l':'r'}`,[r,w]=d.castor,fork=G();
    addMesh(fork,'fork_top',roundedBox([0.090,0.090,0.020],0.004,1),hub,[0,0,r+0.035]);
    for(const s of [-1,1])addMesh(fork,`fork_cheek_${s>0?'l':'r'}`,new THREE.BoxGeometry(0.050,0.008,r+0.030),hub,[0,s*(w/2+0.008),(r+0.030)/2+0.008]);
    links.push({name:`castor_${tag}_fork`,visual:fork});
    joints.push({name:`castor_${tag}_swivel`,type:'continuous',parent:'base_link',child:`castor_${tag}_fork`,xyz:[sx*d.castorX,sy*d.castorY,r],axis:[0,0,1],limit:{effort:50,velocity:6.0}});
    const wheel=G();tyre(wheel,'castor',r,w,0);
    links.push({name:`castor_${tag}`,visual:wheel});
    joints.push({name:`castor_${tag}`,type:'continuous',parent:`castor_${tag}_fork`,child:`castor_${tag}`,xyz:[0,0,0],axis:[0,1,0],limit:wheelLimit(r)});
  }

  // --- frames: the two navigation scanners, looking out across their corners ---
  links.push({name:'scanner_front_frame'},{name:'scanner_rear_frame'});
  const zScan=(d.band[0]+d.band[1])/2;
  joints.push({name:'scanner_front_joint',type:'fixed',parent:'base_link',child:'scanner_front_frame',xyz:[fx-0.035,fy-0.035,zScan],rpy:[0,0,Math.PI/4]});
  joints.push({name:'scanner_rear_joint',type:'fixed',parent:'base_link',child:'scanner_rear_frame',xyz:[-(fx-0.035),-(fy-0.035),zScan],rpy:[0,0,-3*Math.PI/4]});
  // No invented mass, CoG or inertia.
  return {name:'kuka_kmp_3000p_reference',links,joints};
}
