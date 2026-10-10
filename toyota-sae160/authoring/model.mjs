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
 * centre, tiller driving-position range 1150–1385. No vendor CAD, mesh or drawing is read; the
 * sheet's side and top views only identify dimension anchors. Official exact-
 * model product photos were independently inspected for the exterior. Scanner
 * height assignment to masts, h14 pose, C sections and all cosmetic sizes are
 * authored/configuration estimates; see provenance.json and README.
 *
 * Frame: the origin is the support arm wheel axle's midpoint on the floor —
 * the point the truck pivots about with its drive wheel steered across; the
 * published turning radius is the rear corner's distance from it — +X along
 * the forks, +Z up. Forks first is forward for botrail's `Vehicle`.
 */
import * as THREE from 'three';
import {addMesh,namedMaterial,roundedBox,roundedRectangle,cylinderZ,cylinderBetween} from '@botrail/authoring/geometry.mjs';

import {channelGeometry,forkGeometry,loopGeometry,loft,prism,armGeometry,forkWallGeometry} from './visual-geometry.mjs';

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

/** The two masts of the sheet. h4-h23 constrains an above-fork envelope,
 * not an OEM lattice backrest. Scanner height/mast assignment is inherited. */
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

const amber=namedMaterial('signal_amber','#db8b21',0.05,0.30);
const red=namedMaterial('stop_red','#c8241b',0.05,0.5);
const zinc=namedMaterial('roller_zinc','#9a9b96',0.65,0.36);
const seam=namedMaterial('panel_recess','#151819',0.06,0.68);
const rb=(g,n,size,r,mat,at)=>addMesh(g,n,roundedBox(size,Math.min(r,Math.min(...size)*.48),2),mat,at);
function disk(g,n,r,h,mat,at,axis='z'){const geo=cylinderZ(r,h,{radial:32});if(axis==='x')geo.rotateY(Math.PI/2);if(axis==='y')geo.rotateX(Math.PI/2);return addMesh(g,n,geo,mat,at);}
const box=(size,xyz,rpy)=>({kind:'box',size,xyz,...(rpy?{rpy}:{})});
/** Axis-aligned collision box around the meshes of `g` whose names pass `keep`, rounded outward to 0.1 mm. */
function around(g,keep){
  const b=new THREE.Box3();g.updateMatrixWorld(true);
  for(const o of g.children)if(keep(o.name))b.expandByObject(o);
  const lo=b.min.toArray().map(v=>Math.floor(v*1e4)/1e4), hi=b.max.toArray().map(v=>Math.ceil(v*1e4)/1e4);
  return box(hi.map((h,i)=>Number((h-lo[i]).toFixed(4))),hi.map((h,i)=>Number(((h+lo[i])/2).toFixed(5))));
}
/** Oriented collision box around a round bar of radius r from a to b; the bar keeps one y (pitch only). */
function bar(a,b,r){
  const d=b.map((v,i)=>v-a[i]);
  return box([2*r,2*r,Math.hypot(...d)],a.map((v,i)=>(v+b[i])/2),[0,Math.atan2(d[0],d[2]),0]);
}
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
  // The public SAE160 tall-scanner configuration: a narrow battery bay ahead
  // of the sculpted rear drive cover. Every skin dimension here is estimated.
  rb(body,'chassis_core',[lc-.035,.690,.120],.025,graphite,[xc,0,.0945]);
  rb(body,'battery_bay',[.285,.685,.82],.010,graphite,[xc1-.152,0,.54]);
  rb(body,'battery_lid',[.32,.727,.035],.012,orange,[xc1-.16,0,.969]);
  for(const sy of [-1,1]){
    rb(body,`battery_edge_${sy}`,[.024,.036,.87],.004,black,[xc1-.025,sy*.358,.548]);
    rb(body,`battery_side_panel_${sy}`,[.25,.008,.69],.002,seam,[xc1-.160,sy*.349,.52]);
    rb(body,`battery_panel_inset_${sy}`,[.229,.010,.667],.003,graphite,[xc1-.160,sy*.352,.52]);
  }
  const rearC=xr+.255;
  addMesh(body,'drive_cover',loft([
    [.195,rearC+.026,0,.400,.630,.080],[.27,rearC+.015,0,.440,.695,.100],
    [.82,rearC+.015,0,.425,.750,.125],[.963,rearC+.043,0,.382,.727,.130],
    [1.032,rearC+.066,0,.322,.662,.110],
  ]),orange);
  // Separate front-to-rear skin seams and dark side guards describe the shell.
  for(const sy of [-1,1]){
    const guard=prism([[-.15,.17],[.00,.16],[.014,.98],[-.026,1.02],[-.12,1.045]],.030);
    guard.rotateX(Math.PI/2);addMesh(body,`drive_side_guard_${sy}`,guard,graphite,[xr+.444,sy*.389+(.030*(sy>0?1:0)),0]);
    for(let k=0;k<6;k++)rb(body,`side_vent_${sy}_${k}`,[.082,.003,.004],.001,seam,[xr+.390,sy*.405,.398+k*.012]);
    rb(body,`cover_split_seam_${sy}`,[.009,.008,.56],.002,seam,[xr+.069,sy*.279,.545]);
  }
  addMesh(body,'sculpted_operator_console',loft([
    [.965,rearC+.025,0,.411,.660,.110],[1.025,rearC+.054,0,.376,.632,.108],
    [1.070,rearC+.079,0,.312,.598,.090],[1.094,rearC+.083,0,.260,.510,.075],
  ]),graphite);
  rb(body,'console_recess',[.107,.275,.018],.007,seam,[rearC+.076,0,1.096]);
  rb(body,'console_storage_tray',[.075,.236,.014],.006,black,[rearC+.07,0,1.099]);
  // Two low rear scanner pods, visible around the tapered drive unit.
  for(const sy of [-1,1]){
    rb(body,`rear_scanner_bumper_${sy}`,[.26,.240,.035],.025,graphite,[xr+.13,sy*.345,.053]);
    rb(body,`rear_scanner_foot_${sy}`,[.196,.163,.039],.025,black,[xr+.11,sy*.348,.093]);
    disk(body,`rear_scanner_${sy}_window`,.072,.036,window_,[xr+.10,sy*.349,.131]);
    rb(body,`rear_scanner_hood_${sy}`,[.191,.176,.061],.032,graphite,[xr+.10,sy*.349,.181]);
    rb(body,`rear_scanner_status_${sy}`,[.003,.024,.011],.001,light,[xr+.003,sy*.349,.177]);
  }
  rb(body,'rear_lower_crossmember',[.110,.504,.065],.010,graphite,[xr+.060,0,.128]);
  // The inherited right-side charging frame is retained. Individual contacts
  // are independent estimates, not an electrical connector specification.
  rb(body,'charging_panel_mount',[.265,.022,.378],.008,black,[-v.chargePlateX,-.371,d.chargePlateHeight]);
  rb(body,'charging_panel',[.244,.018,.355],.007,graphite,[-v.chargePlateX,-.388,d.chargePlateHeight]);
  for(let k=0;k<5;k++){
    const width=k===0||k===4?.181:.081;
    rb(body,`charging_contact_${k}`,[width,.006,.031],.008,plate,[-v.chargePlateX,-.401,d.chargePlateHeight+.12-k*.060]);
  }
  // Support arms retain their original contact boxes. The visual tips are
  // rounded and a little narrower, leaving the fork load-wheel apertures open.
  const armX0=xf-0.05, armLen=d.armReach-armX0, armZ=d.clearanceMast+d.armSection[1]/2;
  for(const sy of [-1,1]) addMesh(body,`support_arm_${sy>0?'left':'right'}`,
    armGeometry(armLen,.128,.053,-(armX0+armLen/2),0),black,[armX0+armLen/2,sy*forkY,d.clearanceMast]);
  // Fixed low yokes join the chassis, mast foot and hollow-fork support arms.
  for(const sy of [-1,1])rb(body,`support_root_yoke_${sy}`,[armX0-xc1+.075,.128,.032],.005,black,[(xc1-.040+armX0+.035)/2,sy*forkY,.051]);
  // Configured tiller pose remains below the inherited h14 endpoint; h14 is
  // a driving-position range, not a manufacturer-specified upright pose.
  const tx=rearC+.02;
  disk(body,'tiller_base',.082,.044,graphite,[tx,0,1.116]);
  cylinderBetween(body,'tiller_stem',[tx,0,1.125],[tx+.035,0,1.291],.041,graphite,{radial:32});
  disk(body,'tiller_pivot',.052,.082,black,[tx+.035,0,1.257],'y');
  rb(body,'tiller_head_spine',[.103,.094,.132],.025,graphite,[tx+.034,0,1.319]);
  for(const sy of [-1,1]){
    const grip=loopGeometry(.169,.110,.020,.033);grip.rotateX(Math.PI/2);grip.rotateZ(Math.PI/2);
    addMesh(body,`tiller_open_grip_${sy}`,grip,graphite,[tx+.017,sy*.096,1.325]);
    rb(body,`tiller_thumb_control_${sy}`,[.025,.051,.025],.008,black,[tx-.013,sy*.069,1.365]);
  }
  rb(body,'tiller_reverse_button',[.032,.080,.030],.007,red,[tx-.039,0,1.369]);
  rb(body,'console_emergency_stop',[.031,.036,.015],.005,red,[tx+.102,-.208,1.087]);
  // Collision: the drive-unit box, the support arms' contact boxes and a box around the centred
  // tiller and its head, which stand above the drive unit.
  links.push({name:'base_link',visual:body,collisions:[
    box([lc,d.width,d.compartmentHeight-d.clearance],[xc,0,(d.compartmentHeight+d.clearance)/2]),
    ...[-1,1].map(sy=>box([armLen,d.armSection[0],d.armSection[1]],[armX0+armLen/2,sy*armY,armZ])),
    around(body,n=>n.startsWith('tiller_')),around(body,n=>n.startsWith('console_')),
  ]});
  joints.push(fixed('base_link_joint','base_footprint','base_link'));

  // --- mast_outer (fixed): two channels, cross members, the navigation scanner on its post ---
  const outer=G(), H0=v.mastLowered-0.06;
  for(const sy of [-1,1]) addMesh(outer,`outer_channel_${sy>0?'left':'right'}`,
    channelGeometry(d.mastChannel[0],d.mastChannel[1],H0,.008,sy),black,[mastX,sy*d.mastY[0],0.06]);
  addMesh(outer,'outer_foot',roundedBox([.014,2*d.mastY[0]+d.mastChannel[1],0.08],0.006,2),black,[mastX-.055,0,0.10]);
  addMesh(outer,'outer_head',roundedBox([.014,2*d.mastY[0]+d.mastChannel[1],0.08],0.006,2),black,[mastX-.055,0,v.mastLowered-0.04]);
  for(const sy of [-1,1]){
    rb(outer,`mast_top_shroud_web_${sy}`,[.137,.016,.235],.006,graphite,[mastX,sy*.328,v.mastLowered-.118]);
    for(const sx of [-1,1])rb(outer,`mast_top_shroud_flange_${sy}_${sx}`,[.010,.135,.235],.004,graphite,[mastX+sx*.061,sy*.270,v.mastLowered-.118]);
  }
  cylinderBetween(outer,'scanner_post',[mastX,0,v.mastLowered],[mastX,0,v.scannerEye-0.06],0.03,graphite);
  const head=cylinderZ(0.055,0.08,{radial:48});
  addMesh(outer,'nav_scanner',head,sensor,[mastX,0,v.scannerEye-0.021]);
  addMesh(outer,'nav_scanner_window',cylinderZ(0.056,0.012,{radial:48}),window_,[mastX,0,v.scannerEye]);
  addMesh(outer,'beacon',roundedBox([0.05,0.05,0.03],0.008,1),light,[mastX-0.09,0,v.mastLowered+0.015]);
  // Wide fixed HMI crossbar and angled stays seen on exact SAE160 photos.
  const hmiX=mastX-.205,hmiZ=1.463;
  for(const sy of [-1,1]){
    cylinderBetween(outer,`hmi_stay_${sy}`,[mastX-.025,sy*.267,1.01],[hmiX,sy*.267,hmiZ-.065],.018,black);
    disk(outer,`mast_foot_pin_${sy}`,.041,.017,hub,[mastX,sy*.328,1.025],'y');
  }
  rb(outer,'hmi_crossbar',[.136,.672,.146],.016,black,[hmiX,0,hmiZ]);
  rb(outer,'hmi_display_bezel',[.009,.162,.074],.006,hub,[hmiX-.070,0,hmiZ]);
  rb(outer,'hmi_display',[.011,.132,.045],.003,screen,[hmiX-.076,0,hmiZ+.006]);
  for(const sy of [-1,1]){
    disk(outer,`hmi_amber_${sy}`,.022,.009,amber,[hmiX-.074,sy*.268,hmiZ],'x');
    disk(outer,`hmi_stop_${sy}_base`,.028,.004,plate,[hmiX,sy*.340,hmiZ],'y');
    disk(outer,`hmi_stop_${sy}`, .020,.014,red,[hmiX,sy*.348,hmiZ],'y');
  }
  // A translucent guard is omitted: OBJ/MTL in this pipeline is opaque only.
  // Keep the tall navigation post; optional rear-reaching RS camera bracket
  // belongs to another photographed configuration and is intentionally absent.
  disk(outer,'scanner_post_foot',.063,.017,black,[mastX,0,v.mastLowered+.007]);
  disk(outer,'scanner_post_collar',.044,.020,hub,[mastX,0,v.scannerEye-.13]);
  links.push({name:'mast_outer',visual:outer,collisions:[
    ...[-1,1].map(sy=>box([d.mastChannel[0],d.mastChannel[1],H0],[mastX,sy*d.mastY[0],0.06+H0/2])),
    box([d.mastChannel[0],2*d.mastY[0]+d.mastChannel[1],0.08],[mastX,0,0.10]),
    box([d.mastChannel[0],2*d.mastY[0]+d.mastChannel[1],0.08],[mastX,0,v.mastLowered-0.04]),
    box([0.11,0.11,v.scannerTop-v.mastLowered],[mastX,0,(v.mastLowered+v.scannerTop)/2]),
    // The HMI crossbar with its lights and stops, and the two stays that carry it.
    around(outer,n=>n.startsWith('hmi_')&&!n.startsWith('hmi_stay_')),
    ...[-1,1].map(sy=>bar([mastX-.025,sy*.267,1.01],[hmiX,sy*.267,hmiZ-.065],.018)),
    // Beacon, foot pins and the top shrouds; the shrouds stop 1 mm short of the carriage block.
    around(outer,n=>n==='beacon'),
    ...[-1,1].map(sy=>around(outer,n=>n===`mast_foot_pin_${sy}`)),
    ...[-1,1].map(sy=>box([.1275,.135,.235],[mastX-.00475,sy*.270,v.mastLowered-.118])),
  ]});
  joints.push(fixed('mast_outer_joint','base_link','mast_outer'));

  // --- the telescoping stages: TX has a middle stage and an inner mast that
  // rises the full mast lift (the middle stage half of it); DX has one inner
  // mast rising half of the carriage travel. Lower rail crossmembers retain an unobstructed upper mast sweep.
  // Their stations/ears are estimates, not a claim about the OEM weldment.
  // Both stages hang from the outer
  // mast, so `mast_lift` reads as fork travel on either.
  const channels=(g,tag,[cx,cy],y,z0,h,material=black)=>{
    for(const sy of [-1,1]) addMesh(g,`${tag}_channel_${sy>0?'left':'right'}`,channelGeometry(cx,cy,h,.004,sy),material,[mastX,sy*y,z0]);
    const headX=tag==='stage'?.092:.072,earY=tag==='stage'?.199:.130;
    const bridgeZ=z0+(tag==='stage'?.025:.035);
    addMesh(g,`${tag}_crossmember`,roundedBox([.010,2*y+cy,.030],.004,2),material,[mastX+headX,0,bridgeZ]);
    for(const sy of [-1,1])rb(g,`${tag}_crossmember_ear_${sy}`,[Math.abs(headX)+.010-cx/2,.018,.020],.003,material,[mastX+(headX+cx/2)/2,sy*earY,bridgeZ]);
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
  // floor when lowered. Opening plate, carriage shanks and two windowed forks.
  const car=G(), [cx,cy,cz]=d.carriage;
  // Real opening in the lower carriage plate, no invented lattice backrest.
  const cs=new THREE.Shape();cs.moveTo(-cy/2,.012);cs.lineTo(cy/2,.012);cs.lineTo(cy/2,cz-s);cs.lineTo(-cy/2,cz-s);cs.closePath();
  const ch=new THREE.Path();ch.moveTo(-.032,.055);ch.lineTo(-.032,.145);ch.lineTo(.032,.145);ch.lineTo(.032,.055);ch.closePath();cs.holes.push(ch);
  const cg=new THREE.ExtrudeGeometry(cs,{depth:cx,bevelEnabled:false});cg.rotateY(Math.PI/2);cg.rotateX(Math.PI/2);
  addMesh(car,'carriage_window_plate',cg,steel,[-.050,0,0]);
  // h4-h23 is retained as the shank/carriage envelope, not a documented backrest.
  rb(car,'carriage_upper_tie',[.050,.490,.040],.005,steel,[-.025,0,backrest-.025]);
  rb(car,'carriage_lower_tie',[.050,.270,.045],.005,steel,[-.025,0,.175]);
  for(const sy of [-1,1]){
    const side=sy>0?'left':'right';
    const fork=G();fork.name=`fork_${side}`;fork.position.y=sy*forkY;car.add(fork);
    addMesh(fork,`fork_${side}_deck`,forkGeometry(l,e,s,v.loadDistance),steel);
    addMesh(fork,`fork_${side}_sidewalls`,forkWallGeometry(l,e,s),steel);
    rb(car,`fork_shank_${side}`,[.055,.100,backrest+.003],.005,steel,[-.0175,sy*forkY,(backrest-.003)/2]);
    rb(car,`carriage_stile_${side}`,[.050,.055,backrest+.010],.004,steel,[-.025,sy*.105,(backrest-.010)/2]);
    for(const [k,z] of [.15,.30].entries()){
      disk(car,`carriage_roller_${side}_${k}`,.030,.020,zinc,[-d.mastSetback,sy*d.mastY[2],z],'y');
      disk(car,`carriage_axle_${side}_${k}`,.008,.066,hub,[-d.mastSetback,sy*.130,z],'y');
      rb(car,`carriage_roller_mount_${side}_${k}`,[.150,.012,.040],.003,steel,[-.090,sy*.105,z]);
    }
  }
  // Collision: plate, ties, stiles and fork shanks as one block from the plate's back to the fork
  // face, up to the shank tops (h4 - h23), and the two tines. The guide rollers run inside the mast.
  links.push({name:'carriage',visual:car,collisions:[
    box([0.10,cy,backrest+s],[-0.05,0,(backrest-s)/2]),
    ...[-1,1].map(sy=>box([l,e,s],[l/2,sy*forkY,-s/2])),
  ]});
  const seat=[xf,0,d.forkLowered];
  if(mast==='tx') joints.push({...prismaticZ('free_lift','mast_inner','carriage',v.freeLift,d.liftSpeed),xyz:seat});
  else joints.push({...prismaticZ('mast_lift','mast_outer','carriage',v.lift,d.liftSpeed),xyz:seat});

  // --- running gear: visual only (the vehicle rides on its collision boxes) ---
  const wheel=(name,parent,radius,width,xyz,tyre=rubber)=>{
    const g=G();
    addMesh(g,`${name}_tyre`,cylinderZ(radius,width,{radial:36}),tyre).rotateX(Math.PI/2);   // axle along Y
    addMesh(g,`${name}_hub`,cylinderZ(radius*0.5,width+0.004,{radial:24}),hub).rotateX(Math.PI/2);
    for(const sy of [-1,1])disk(g,`${name}_axle_${sy}`,radius*.21,.007,black,[0,sy*(width/2+.005),0],'y');
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
  for(const sy of [-1,1]) wheel(`support_wheel_${sy>0?'left':'right'}`,'base_link',d.supportWheel[0],d.supportWheel[1],[0,sy*forkY,d.supportWheel[0]],vulkollan);

  // --- frames ---
  links.push({name:'forks'},{name:'fork_tips'},{name:'nav_scanner'},{name:'charge_plate'});
  joints.push(fixed('forks_joint','carriage','forks'));
  joints.push(fixed('fork_tips_joint','carriage','fork_tips',[l,0,0]));
  joints.push(fixed('nav_scanner_joint','mast_outer','nav_scanner',[mastX,0,v.scannerEye]));
  joints.push({...fixed('charge_plate_joint','base_link','charge_plate',[-v.chargePlateX,-d.width/2,d.chargePlateHeight]),rpy:[0,0,-Math.PI/2]});
  // No invented mass, CoG or inertia: the recipe carries the sheet's service weight.
  return {name:`toyota_sae160_${mast}_reference`,links,joints};
}
