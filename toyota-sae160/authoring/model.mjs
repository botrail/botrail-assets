/** Toyota Autopilot SAE160 (BT Staxio): published VDI 2198 figures, own geometry.
 * Facts (Toyota Material Handling data sheet 746908-040 v17, 2024-01-15; large
 * battery compartment, 1250 mm forks, automode figures): rated load 1600 kg
 * (1470 in automode at 650 mm load centre), forks 70/180/1250, width over
 * forks 570, distance between support arms 262, overall width 930, fork
 * height lowered 87.5, wheelbase 1452, load distance (support arm wheel
 * centre to fork face) 640 TX / 657 DX, length to fork face 1078 / 1061,
 * overall length 2327 / 2311, turning radius 1767, mast lowered 2162 / 1737,
 * free lift 1592 / none, lift 4613 / 2263, lift height 4700 / 2350, mast
 * extended 5316 / 2892, scanner eye 2950 / 2362, height with scanner
 * 2969 / 2381, drive wheel Ø230 × 70, support arm wheels Ø85 × 95, castors
 * Ø125 × 50, track front 585, track rear 390, ground clearance 17 under the
 * mast (laden) and 24.5 at the wheelbase centre, lift 0.17 / 0.34 m/s,
 * travel 8.0 km/h drive wheel first and 1.1 km/h fork first, autocharging
 * plate centre 359 over the floor and 1104 / 1121 behind the fork wheel
 * centre, tiller head 1150–1385. No vendor CAD, mesh or drawing is read; the
 * sheet's side and top views were used only to see which part carries which
 * figure. Everything not in that list is an authored estimate (README).
 *
 * Frame: the origin is the support arm wheel axle's midpoint on the floor —
 * the point the truck pivots about with its drive wheel steered across; the
 * published turning radius is the rear corner's distance from it — +X along
 * the forks, +Z up. Forks first is forward for botrail's `Vehicle`.
 */
import * as THREE from 'three';
import {addMesh,namedMaterial,roundedBox,cylinderZ,cylinderBetween} from '@botrail/authoring/geometry.mjs';

export const dimensions=Object.freeze({
  width:0.930, forks:[0.070,0.180,1.250], forkSpread:0.570, armGap:0.262, forkLowered:0.0875,
  wheelbase:1.452, driveWheel:[0.115,0.070], supportWheel:[0.0425,0.095], castor:[0.0625,0.050],
  trackFront:0.585, trackRear:0.390, clearanceMast:0.017, clearance:0.0245, liftSpeed:0.34,
  tillerHead:1.385, chargePlateHeight:0.359,
  // Authored, not published: the drive unit's height and setback from the
  // fork face, the support arm section, how far past their wheels the arms
  // run, the mast channel sections and stations, the carriage plate.
  compartmentHeight:1.10, chassisSetback:0.24, armSection:[0.154,0.068], armReach:0.12,
  mastSetback:0.16, mastY:[0.265,0.205,0.150], mastChannel:[0.10,0.11], stageChannel:[0.08,0.09],
  innerChannel:[0.07,0.07], carriage:[0.040,0.620,0.300], steerRange:Math.PI/2,
});

/** The two masts of the sheet: what differs between them. `backrest` — what
 * stands over the fork top — is read off h4 − h23 of each. */
export const variants=Object.freeze({
  tx:{name:'TX Hi-Lo', loadDistance:0.640, lengthToForkFace:1.078, overallLength:2.327, turningRadius:1.767,
      mastLowered:2.162, freeLift:1.592, lift:4.613, liftHeight:4.700, mastExtended:5.316,
      scannerEye:2.950, scannerTop:2.969, chargePlateX:1.104, mass:1697},
  dx:{name:'DX Tele', loadDistance:0.657, lengthToForkFace:1.061, overallLength:2.311, turningRadius:1.767,
      mastLowered:1.737, freeLift:0, lift:2.263, liftHeight:2.350, mastExtended:2.892,
      scannerEye:2.362, scannerTop:2.381, chargePlateX:1.121, mass:1513},
});
/** The lift joints a mast has, in the order they are used from the floor. */
export const liftJoints=Object.freeze({tx:['free_lift','mast_lift'], dx:['mast_lift']});

const orange=namedMaterial('toyota_orange','#e2611b',0.05,0.5);
const graphite=namedMaterial('chassis_graphite','#2f3335',0.15,0.6);
const black=namedMaterial('mast_black','#1b1d1f',0.35,0.55);
const steel=namedMaterial('fork_steel','#3d4145',0.6,0.45);
const rubber=namedMaterial('tyre_rubber','#1c1c1c',0.0,0.9);
const vulkollan=namedMaterial('drive_wheel_vulkollan','#b58b4b',0.0,0.7);
const polyurethane=namedMaterial('castor_polyurethane','#d8cfb9',0.0,0.6);
const hub=namedMaterial('wheel_hub','#8b8f93',0.7,0.4);
const sensor=namedMaterial('scanner_black','#141516',0.2,0.5);
const window_=namedMaterial('scanner_window','#1e3a5f',0.3,0.25);
const light=namedMaterial('signal_light','#2d7fe0',0.1,0.3);
const plate=namedMaterial('charging_plate','#a8862f',0.8,0.35);
const screen=namedMaterial('display_screen','#0e1114',0.2,0.2);

const box=(size,xyz)=>({kind:'box',size,xyz});
const fixed=(name,parent,child,xyz=[0,0,0])=>({name,type:'fixed',parent,child,xyz});
const G=()=>new THREE.Group();

export function definition(mast='tx') {
  const d=dimensions, v=variants[mast];
  if(!v) throw new Error(`unknown mast ${mast}; one of ${Object.keys(variants)}`);
  const links=[], joints=[];
  const [s,e,l]=d.forks;
  const xf=-v.loadDistance;                       // the fork face
  const xr=xf-v.lengthToForkFace;                 // the rear end
  const xd=-d.wheelbase;                          // the drive wheel axle
  const forkY=d.forkSpread/2-e/2;                 // 0.195 — the support wheels' track too
  const armY=d.armGap/2+d.armSection[0]/2;        // arms run from b4 out to the fork's outer face
  const mastX=xf-d.mastSetback;
  const backrest=v.mastExtended-v.liftHeight;     // what stands over the fork top

  links.push({name:'base_footprint'});

  // --- base_link: drive unit and battery compartment, support arms, tiller ---
  const body=G();
  const xc0=xr, xc1=xf-d.chassisSetback, lc=xc1-xc0, xc=(xc0+xc1)/2;
  const skirt=0.10, shellH=d.compartmentHeight-d.clearance-skirt;
  addMesh(body,'skirt',roundedBox([lc,d.width,skirt],0.012,2),graphite,[xc,0,d.clearance+skirt/2]);
  addMesh(body,'compartment',roundedBox([lc-0.02,d.width-0.02,shellH],0.05,3),orange,[xc,0,d.clearance+skirt+shellH/2]);
  addMesh(body,'lid',roundedBox([lc-0.12,d.width-0.12,0.02],0.006,2),graphite,[xc,0,d.compartmentHeight+0.005]);
  // Personal protection scanner in the drive direction: low in the rear face.
  addMesh(body,'rear_scanner',roundedBox([0.10,0.14,0.12],0.008,2),sensor,[xr+0.05,0,0.22]);
  addMesh(body,'rear_scanner_window',roundedBox([0.012,0.12,0.04],0.004,1),window_,[xr-0.002,0,0.24]);
  // Side protection scanners at the compartment's front corners.
  for(const sy of [-1,1]) {
    addMesh(body,`side_scanner_${sy>0?'left':'right'}`,roundedBox([0.12,0.10,0.12],0.008,2),sensor,[xc1-0.06,sy*(d.width/2-0.05),0.20]);
    addMesh(body,`side_scanner_${sy>0?'left':'right'}_window`,roundedBox([0.10,0.012,0.04],0.004,1),window_,[xc1-0.06,sy*(d.width/2+0.004),0.22]);
  }
  // Autocharging plate on the right flank: the sheet gives its height and its
  // distance behind the fork wheel; which flank is an assumption.
  addMesh(body,'charging_plate',roundedBox([0.20,0.02,0.12],0.004,1),plate,[-v.chargePlateX,-(d.width/2+0.008),d.chargePlateHeight]);
  // Support arms: from under the mast out past their wheels, b4 apart inside,
  // flush with the forks outside; the forks nest over them when lowered.
  const armX0=xf-0.05, armLen=d.armReach-armX0, armZ=d.clearanceMast+d.armSection[1]/2;
  for(const sy of [-1,1]) addMesh(body,`support_arm_${sy>0?'left':'right'}`,
    roundedBox([armLen,d.armSection[0],d.armSection[1]],0.008,2),black,[armX0+armLen/2,sy*armY,armZ]);
  // The tiller, folded upright beside the mast for automatic running; its
  // head tops out at the sheet's h14 maximum.
  const tillerX=xc1-0.16, tillerY=0.18;
  cylinderBetween(body,'tiller_arm',[tillerX,tillerY,d.compartmentHeight],[tillerX,tillerY,d.tillerHead-0.12],0.025,graphite);
  addMesh(body,'tiller_head',roundedBox([0.34,0.20,0.14],0.03,3),graphite,[tillerX,tillerY,d.tillerHead-0.07]);
  addMesh(body,'tiller_stop',roundedBox([0.06,0.06,0.03],0.008,1),namedMaterial('stop_red','#c8241b',0.05,0.5),[tillerX+0.10,tillerY,d.tillerHead+0.015]);
  links.push({name:'base_link',visual:body,collisions:[
    box([lc,d.width,d.compartmentHeight-d.clearance],[xc,0,(d.compartmentHeight+d.clearance)/2]),
    ...[-1,1].map(sy=>box([armLen,d.armSection[0],d.armSection[1]],[armX0+armLen/2,sy*armY,armZ])),
    box([0.34,0.20,0.17],[tillerX,tillerY,d.tillerHead-0.055]),
  ]});
  joints.push(fixed('base_link_joint','base_footprint','base_link'));

  // --- mast_outer (fixed): two channels, cross members, the navigation scanner on its post ---
  const outer=G(), H0=v.mastLowered-0.06;
  for(const sy of [-1,1]) addMesh(outer,`outer_channel_${sy>0?'left':'right'}`,
    roundedBox([d.mastChannel[0],d.mastChannel[1],H0],0.008,2),black,[mastX,sy*d.mastY[0],0.06+H0/2]);
  addMesh(outer,'outer_foot',roundedBox([d.mastChannel[0],2*d.mastY[0]+d.mastChannel[1],0.08],0.008,2),black,[mastX,0,0.10]);
  addMesh(outer,'outer_head',roundedBox([d.mastChannel[0],2*d.mastY[0]+d.mastChannel[1],0.08],0.008,2),black,[mastX,0,v.mastLowered-0.04]);
  cylinderBetween(outer,'scanner_post',[mastX,0,v.mastLowered],[mastX,0,v.scannerEye-0.06],0.03,graphite);
  const head=cylinderZ(0.055,0.08,{radial:48});
  addMesh(outer,'nav_scanner',head,sensor,[mastX,0,v.scannerEye-0.021]);
  addMesh(outer,'nav_scanner_window',cylinderZ(0.056,0.012,{radial:48}),window_,[mastX,0,v.scannerEye]);
  addMesh(outer,'beacon',roundedBox([0.05,0.05,0.03],0.008,1),light,[mastX-0.09,0,v.mastLowered+0.015]);
  addMesh(outer,'display',roundedBox([0.10,0.03,0.12],0.006,1),screen,[mastX,-(d.mastY[0]+d.mastChannel[1]/2+0.02),1.45]);
  links.push({name:'mast_outer',visual:outer,collisions:[
    ...[-1,1].map(sy=>box([d.mastChannel[0],d.mastChannel[1],H0],[mastX,sy*d.mastY[0],0.06+H0/2])),
    box([d.mastChannel[0],2*d.mastY[0]+d.mastChannel[1],0.08],[mastX,0,0.10]),
    box([d.mastChannel[0],2*d.mastY[0]+d.mastChannel[1],0.08],[mastX,0,v.mastLowered-0.04]),
    box([0.11,0.11,v.scannerTop-v.mastLowered],[mastX,0,(v.mastLowered+v.scannerTop)/2]),
  ]});
  joints.push(fixed('mast_outer_joint','base_link','mast_outer'));

  // --- the telescoping stages: TX has a middle stage and an inner mast that
  // rises the full mast lift (the middle stage half of it); DX has one inner
  // mast rising half of the carriage travel. Both stages hang from the outer
  // mast, so `mast_lift` reads as fork travel on either.
  const channels=(g,tag,[cx,cy],y,z0,h,material=black)=>{
    for(const sy of [-1,1]) addMesh(g,`${tag}_channel_${sy>0?'left':'right'}`,roundedBox([cx,cy,h],0.006,2),material,[mastX,sy*y,z0+h/2]);
    addMesh(g,`${tag}_head`,roundedBox([cx,2*y+cy,0.06],0.006,2),material,[mastX,0,z0+h-0.03]);
    return [...[-1,1].map(sy=>box([cx,cy,h],[mastX,sy*y,z0+h/2])),box([cx,2*y+cy,0.06],[mastX,0,z0+h-0.03])];
  };
  const prismaticZ=(name,parent,child,upper,velocity,mimic)=>({name,type:'prismatic',parent,child,xyz:[0,0,0],axis:[0,0,1],
    limit:{lower:0,upper:Number(upper.toPrecision(12)),velocity,effort:20000},...(mimic?{mimic}:{})});
  const mastLift=v.lift-v.freeLift;
  if(mast==='tx') {
    const stage=G(), H1=v.mastLowered-0.14;
    links.push({name:'mast_stage1',visual:stage,collisions:channels(stage,'stage',d.stageChannel,d.mastY[1],0.10,H1)});
    joints.push(prismaticZ('mast_stage','mast_outer','mast_stage1',mastLift/2,d.liftSpeed/2,{joint:'mast_lift',multiplier:0.5,offset:0}));
  }
  const inner=G(), H2=v.mastLowered-0.22;
  links.push({name:'mast_inner',visual:inner,collisions:channels(inner,'inner',d.innerChannel,d.mastY[2],0.14,H2)});
  if(mast==='tx') joints.push(prismaticZ('mast_lift','mast_outer','mast_inner',mastLift,d.liftSpeed));
  else joints.push(prismaticZ('mast_stage','mast_outer','mast_inner',v.lift/2,d.liftSpeed/2,{joint:'mast_lift',multiplier:0.5,offset:0}));

  // --- carriage: its origin is the `forks` frame — the fork top surface at
  // the heel, centred between the forks, +X along them — 87.5 mm over the
  // floor when lowered. Plate, load backrest, two L-forks.
  const car=G(), [cx,cy,cz]=d.carriage;
  addMesh(car,'carriage_plate',roundedBox([cx,cy,cz],0.008,2),steel,[-0.08,0,cz/2-s]);
  for(const sy of [-1,1]) addMesh(car,`backrest_upright_${sy>0?'left':'right'}`,roundedBox([0.035,0.045,backrest-(cz-s)],0.006,2),steel,[-0.08,sy*(cy/2-0.03),(cz-s+backrest)/2]);
  for(let k=0;k<3;k++) addMesh(car,`backrest_bar_${k}`,roundedBox([0.035,cy,0.030],0.006,2),steel,[-0.08,0,cz-s+(k+1)*(backrest-(cz-s))/3-0.02]);
  for(const sy of [-1,1]) {
    const side=sy>0?'left':'right';
    addMesh(car,`fork_${side}`,roundedBox([l,e,s],0.006,2),steel,[l/2,sy*forkY,-s/2]);
    addMesh(car,`fork_shank_${side}`,roundedBox([0.06,e,cz],0.006,2),steel,[-0.03,sy*forkY,cz/2-s]);
  }
  links.push({name:'carriage',visual:car,collisions:[
    box([cx,cy,cz],[-0.08,0,cz/2-s]),
    box([0.035,cy,backrest-(cz-s)],[-0.08,0,(cz-s+backrest)/2]),
    ...[-1,1].flatMap(sy=>[box([l,e,s],[l/2,sy*forkY,-s/2]),box([0.06,e,cz],[-0.03,sy*forkY,cz/2-s])]),
  ]});
  const seat=[xf,0,d.forkLowered];
  if(mast==='tx') joints.push({...prismaticZ('free_lift','mast_inner','carriage',v.freeLift,d.liftSpeed),xyz:seat});
  else joints.push({...prismaticZ('mast_lift','mast_outer','carriage',v.lift,d.liftSpeed),xyz:seat});

  // --- running gear: visual only (the vehicle rides on its collision boxes) ---
  const wheel=(name,parent,radius,width,xyz,tyre=rubber)=>{
    const g=G();
    addMesh(g,`${name}_tyre`,cylinderZ(radius,width,{radial:36}),tyre).rotateX(Math.PI/2);   // axle along Y
    addMesh(g,`${name}_hub`,cylinderZ(radius*0.5,width+0.004,{radial:24}),hub).rotateX(Math.PI/2);
    links.push({name,visual:g});
    joints.push({name,type:'continuous',parent,child:name,xyz,axis:[0,1,0],limit:{effort:200,velocity:Number((8.0/3.6/radius).toPrecision(6))}});
  };
  // The steered drive wheel: a yoke turning about the vertical, the wheel in it.
  const yoke=G();
  addMesh(yoke,'steer_yoke',roundedBox([0.16,0.16,0.06],0.01,2),graphite,[0,0,2*d.driveWheel[0]+0.03]);
  for(const sy of [-1,1]) addMesh(yoke,`steer_cheek_${sy>0?'left':'right'}`,roundedBox([0.12,0.02,0.20],0.006,2),graphite,[0,sy*(d.driveWheel[1]/2+0.012),d.driveWheel[0]+0.04]);
  links.push({name:'steer_link',visual:yoke});
  joints.push({name:'steer',type:'revolute',parent:'base_link',child:'steer_link',xyz:[xd,0,0],axis:[0,0,1],
    limit:{lower:-d.steerRange,upper:d.steerRange,velocity:1.5,effort:500}});
  wheel('drive_wheel','steer_link',d.driveWheel[0],d.driveWheel[1],[0,0,d.driveWheel[0]],vulkollan);
  for(const sy of [-1,1]) wheel(`castor_${sy>0?'left':'right'}`,'base_link',d.castor[0],d.castor[1],[xd,sy*d.trackFront/2,d.castor[0]],polyurethane);
  for(const sy of [-1,1]) wheel(`support_wheel_${sy>0?'left':'right'}`,'base_link',d.supportWheel[0],d.supportWheel[1],[0,sy*forkY,d.supportWheel[0]]);

  // --- frames ---
  links.push({name:'forks'},{name:'fork_tips'},{name:'nav_scanner'},{name:'charge_plate'});
  joints.push(fixed('forks_joint','carriage','forks'));
  joints.push(fixed('fork_tips_joint','carriage','fork_tips',[l,0,0]));
  joints.push(fixed('nav_scanner_joint','mast_outer','nav_scanner',[mastX,0,v.scannerEye]));
  joints.push({...fixed('charge_plate_joint','base_link','charge_plate',[-v.chargePlateX,-d.width/2,d.chargePlateHeight]),rpy:[0,0,-Math.PI/2]});
  // No invented mass, CoG or inertia: the recipe carries the sheet's service weight.
  return {name:`toyota_sae160_${mast}_reference`,links,joints};
}
