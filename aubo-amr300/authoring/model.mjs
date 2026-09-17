/** AUBO-AMR300 (Haina series AMR): published overall dimensions, own geometry.
 * Facts (AUBO product page "AMR海纳系列 AUBO-AMR300", 2026-09): 1000 x 700 x 600 mm
 * without the arm (±2 mm), load surface 650 x 620 mm, 250 kg, 300 kg maximum load
 * including the arm and its tooling, two-wheel differential drive, two laser
 * scanners, 1.3 m/s, ground clearance 25 mm, rotation radius 550 mm.
 * Everything below the deck line is a photo-based estimate (product photo and the
 * side view on the developer site): the graphite skirt height, the wheel diameters
 * and stations, the scanner corners, the red safety edges, the E-stops on the deck
 * corners and the arm base offset toward the front. No vendor CAD, mesh or drawing
 * is read; the composite-robot manual (reproduction clause) is not a dimension source.
 */
import * as THREE from 'three';
import {addMesh,namedMaterial,roundedBox,cylinderZ} from '@botrail/authoring/geometry.mjs';

export const dimensions={length:1.000,width:0.700,height:0.600,clearance:0.025,skirtTop:0.215,skirtInset:0.030,
  loadSurface:[0.650,0.620],loadSurfaceX:0.100,armMountX:0.180,
  driveWheelRadius:0.080,driveTrack:0.290,casterRadius:0.050,casterX:0.380,casterY:0.250};

const orange=namedMaterial('shell_orange','#f28a1e',0.05,0.5);
const graphite=namedMaterial('chassis_graphite','#2b2e30',0.15,0.6);
const bumper=namedMaterial('safety_edge_red','#c8102e',0.0,0.7);
const rubber=namedMaterial('tyre_rubber','#1b1c1d',0.0,0.9);
const hub=namedMaterial('wheel_hub','#8b8f93',0.7,0.4);
const sensor=namedMaterial('scanner_window','#f0b400',0.1,0.45);
const housing=namedMaterial('scanner_housing','#141516',0.0,0.85);
const lens=namedMaterial('front_window','#0e1114',0.2,0.2);
const plate=namedMaterial('load_plate','#4d5256',0.5,0.5);
const estop=namedMaterial('estop_red','#d40000',0.05,0.4);
const collar=namedMaterial('estop_collar_yellow','#f5d000',0.05,0.5);
const light=namedMaterial('signal_light','#2d7fe0',0.1,0.3);

const box=(size,xyz)=>({kind:'box',size,xyz});
const fixed=(name,parent,child,xyz=[0,0,0])=>({name,type:'fixed',parent,child,xyz});
const G=()=>new THREE.Group();

export function definition() {
  const d=dimensions, links=[], joints=[];
  const L=d.length, W=d.width;

  // --- chassis: graphite skirt (inset), red safety edges, scanners at diagonal corners ---
  const chassis=G();
  const sl=L-2*d.skirtInset, sw=W-2*d.skirtInset, skirtH=d.skirtTop-d.clearance;
  addMesh(chassis,'chassis_skirt',roundedBox([sl,sw,skirtH],0.012,2),graphite,[0,0,d.clearance+skirtH/2]);
  const edgeZ=d.clearance+0.016, edgeH=0.028, edgeT=0.010;
  addMesh(chassis,'safety_edge_front',roundedBox([edgeT,sw+0.004,edgeH],0.003,1),bumper,[sl/2+edgeT/2-0.001,0,edgeZ]);
  addMesh(chassis,'safety_edge_rear',roundedBox([edgeT,sw+0.004,edgeH],0.003,1),bumper,[-(sl/2+edgeT/2-0.001),0,edgeZ]);
  addMesh(chassis,'safety_edge_left',roundedBox([sl+0.004,edgeT,edgeH],0.003,1),bumper,[0,sw/2+edgeT/2-0.001,edgeZ]);
  addMesh(chassis,'safety_edge_right',roundedBox([sl+0.004,edgeT,edgeH],0.003,1),bumper,[0,-(sw/2+edgeT/2-0.001),edgeZ]);
  for(const [tag,sx,sy] of [['front_left',1,1],['rear_right',-1,-1]]) {
    // Two laser scanners (published count) at diagonal corners of the skirt band, 4 mm proud so they read.
    const cx=sx*(sl/2-0.046), cy=sy*(sw/2-0.046);
    addMesh(chassis,`scanner_${tag}`,roundedBox([0.100,0.100,0.090],0.006,2),housing,[cx,cy,0.125]);
    addMesh(chassis,`scanner_${tag}_window`,roundedBox([0.104,0.104,0.028],0.006,2),sensor,[cx,cy,0.140]);
  }

  // --- orange shell: the full 1000 x 700 footprint, overhanging the skirt; its top is the deck ---
  const shellH=d.height-d.skirtTop-0.002;
  addMesh(chassis,'shell',roundedBox([L,W,shellH],0.030,3),orange,[0,0,d.skirtTop+shellH/2]);
  // The published 650 x 620 mm load surface as a plate whose top is the published 600 mm height.
  addMesh(chassis,'load_plate',roundedBox([d.loadSurface[0],d.loadSurface[1],0.004],0.002,1),plate,[d.loadSurfaceX,0,d.height-0.002]);
  addMesh(chassis,'front_window',roundedBox([0.006,0.320,0.070],0.003,1),lens,[L/2+0.001,0,0.470]);
  for(const sy of [-1,1]) addMesh(chassis,`light_strip_${sy>0?'left':'right'}`,roundedBox([L-0.24,0.004,0.010],0.0015,1),light,[0,sy*(W/2+0.001),d.skirtTop+0.014]);
  for(const [tag,sx,sy] of [['front_right',1,-1],['rear_left',-1,1]]) {
    // E-stops on diagonal deck corners: a 6 mm collar and a 12 mm button (the only parts above the deck).
    const cx=sx*(L/2-0.060), cy=sy*(W/2-0.060);
    addMesh(chassis,`estop_${tag}_collar`,cylinderZ(0.030,0.006,{radial:40}),collar,[cx,cy,d.height+0.003]);
    addMesh(chassis,`estop_${tag}`,cylinderZ(0.020,0.012,{radial:40}),estop,[cx,cy,d.height+0.012]);
  }
  links.push({name:'base_footprint'});
  links.push({name:'base_link',visual:chassis,collisions:[
    box([sl,sw,skirtH],[0,0,d.clearance+skirtH/2]),
    box([L,W,d.height-d.skirtTop],[0,0,(d.height+d.skirtTop)/2])]});
  joints.push(fixed('base_link_joint','base_footprint','base_link'));

  // --- wheels: visual only (the vehicle rides on its chassis boxes; wheels are scenery) ---
  const wheel=(name,parent,radius,width,xyz)=>{
    const g=G();
    const tyre=cylinderZ(radius,width,{radial:48}); tyre.rotateX(Math.PI/2);   // axle along Y
    addMesh(g,`${name}_tyre`,tyre,rubber);
    const cap=cylinderZ(radius*0.55,width+0.004,{radial:32}); cap.rotateX(Math.PI/2);
    addMesh(g,`${name}_hub`,cap,hub);
    links.push({name,visual:g});
    joints.push({name:`${name}_joint`,type:'continuous',parent,child:name,xyz,axis:[0,1,0],limit:{effort:100,velocity:12}});
  };
  wheel('left_wheel_link','base_link',d.driveWheelRadius,0.050,[0,d.driveTrack,d.driveWheelRadius]);
  wheel('right_wheel_link','base_link',d.driveWheelRadius,0.050,[0,-d.driveTrack,d.driveWheelRadius]);
  for(const [tag,sx,sy] of [['fl',1,1],['fr',1,-1],['bl',-1,1],['br',-1,-1]])
    wheel(`${tag}_caster_wheel_link`,'base_link',d.casterRadius,0.032,[sx*d.casterX,sy*d.casterY,d.casterRadius]);

  // --- frames: deck centre, load-surface centre and the arm base ---
  links.push({name:'deck'},{name:'load_surface'},{name:'arm_mount'});
  joints.push(fixed('deck_joint','base_link','deck',[0,0,d.height]));
  joints.push(fixed('load_surface_joint','base_link','load_surface',[d.loadSurfaceX,0,d.height]));
  joints.push(fixed('arm_mount_joint','base_link','arm_mount',[d.armMountX,0,d.height]));
  // No invented mass/CoG/inertia. The recipe carries the 250 kg catalog mass.
  return {name:'aubo_amr300_reference',links,joints};
}
