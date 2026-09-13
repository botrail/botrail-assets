/** Mobile Industrial Robots MiR1350: published overall dimensions, own geometry.
 * Facts (MiR1350 specifications page, 2026-09): 1350 x 910 x 322 mm, 244 kg,
 * 1350 kg payload, 1.2 m/s, ground clearance 25-27 mm, load surface 1304 x 864 mm,
 * drive wheels 200 mm, casters 100 mm, two SICK microScan3 at diagonal corners.
 * The top-module interface height (`deck`, 192 mm) is not published: it is set so
 * a pallet lift on it stays under the 348 mm pallet support of the Nord EU pallet
 * rack MiR lists as compatible. Wheel track, caster stations and the light strips
 * are photo-based estimates. No vendor CAD, mesh or drawing is read.
 */
import * as THREE from 'three';
import {addMesh,namedMaterial,roundedBox,cylinderZ} from '@botrail/authoring/geometry.mjs';

export const dimensions={length:1.350,width:0.910,height:0.322,clearance:0.027,deck:0.192,
  loadSurface:[1.304,0.864],driveWheelRadius:0.100,casterRadius:0.050,
  driveTrack:0.360,casterX:0.520,casterY:0.330};

const white=namedMaterial('painted_shell','#e4e5e3',0.05,0.55);
const graphite=namedMaterial('chassis_graphite','#33373a',0.15,0.6);
const bumper=namedMaterial('bumper_black','#141516',0.0,0.85);
const rubber=namedMaterial('tyre_rubber','#1b1c1d',0.0,0.9);
const hub=namedMaterial('wheel_hub','#8b8f93',0.7,0.4);
const blue=namedMaterial('signal_light','#2d7fe0',0.1,0.3);
const sensor=namedMaterial('scanner_yellow','#f0b400',0.1,0.45);
const lens=namedMaterial('camera_lens','#0e1114',0.2,0.2);
const plate=namedMaterial('interface_plate','#4d5256',0.5,0.5);

const box=(size,xyz)=>({kind:'box',size,xyz});
const fixed=(name,parent,child,xyz=[0,0,0])=>({name,type:'fixed',parent,child,xyz});
const G=()=>new THREE.Group();

export function definition() {
  const d=dimensions, links=[], joints=[];
  const L=d.length, W=d.width;

  // --- chassis: the part that stays when a top module replaces the cover ---
  const chassis=G();
  // The white shell runs from the skirt to the top-module interface; the
  // graphite band under it is the bumper line the real machine shows.
  const skirt=0.048, shellH=d.deck-d.clearance-skirt;
  addMesh(chassis,'chassis_skirt',roundedBox([L,W,skirt],0.012,2),graphite,[0,0,d.clearance+skirt/2]);
  addMesh(chassis,'chassis_shell',roundedBox([L,W,shellH],0.02,3),white,[0,0,d.clearance+skirt+shellH/2]);
  addMesh(chassis,'bumper_strip',roundedBox([L+0.006,W+0.006,0.024],0.010,2),bumper,[0,0,d.clearance+0.014]);
  addMesh(chassis,'interface_plate',roundedBox([d.loadSurface[0],d.loadSurface[1],0.004],0.002,1),plate,[0,0,d.deck-0.002]);
  for(const [sx,sy] of [[1,1],[-1,-1]]) {
    // microScan3 stations: front-left and rear-right corners, 4 mm proud so they read
    addMesh(chassis,`scanner_${sx>0?'front':'back'}`,roundedBox([0.112,0.112,0.095],0.006,2),bumper,
      [sx*(L/2-0.052),sy*(W/2-0.052),0.145]);
    addMesh(chassis,`scanner_${sx>0?'front':'back'}_window`,roundedBox([0.116,0.116,0.030],0.006,2),sensor,
      [sx*(L/2-0.052),sy*(W/2-0.052),0.160]);
  }
  for(const sy of [-1,1]) addMesh(chassis,`camera_${sy>0?'left':'right'}`,roundedBox([0.012,0.090,0.025],0.004,1),lens,
    [L/2+0.001,sy*0.28,0.12]);
  links.push({name:'base_footprint'});
  links.push({name:'base_link',visual:chassis,collisions:[box([L,W,d.deck-d.clearance],[0,0,(d.deck+d.clearance)/2])]});
  joints.push(fixed('base_link_joint','base_footprint','base_link'));

  // --- top cover: removed when a top module is fitted (its own link) ---
  const cover=G(), shell=d.height-d.deck-0.004;
  addMesh(cover,'cover_shell',roundedBox([L,W,shell],0.02,3),white,[0,0,shell/2]);
  addMesh(cover,'load_surface',roundedBox([d.loadSurface[0],d.loadSurface[1],0.004],0.002,1),white,[0,0,shell+0.002]);
  for(const sy of [-1,1]) addMesh(cover,`light_strip_${sy>0?'left':'right'}`,roundedBox([L-0.30,0.004,0.014],0.0015,1),blue,[0,sy*(W/2+0.001),0.05]);
  for(const sx of [-1,1]) addMesh(cover,`light_strip_${sx>0?'front':'back'}`,roundedBox([0.004,W-0.30,0.014],0.0015,1),blue,[sx*(L/2+0.001),0,0.05]);
  links.push({name:'top_cover',visual:cover,collisions:[box([L,W,d.height-d.deck],[0,0,(d.height-d.deck)/2])]});
  joints.push(fixed('top_cover_joint','base_link','top_cover',[0,0,d.deck]));

  // --- wheels: visual only (the vehicle rides on its chassis box; wheels are scenery) ---
  const wheel=(name,parent,radius,width,xyz)=>{
    const g=G();
    const tyre=cylinderZ(radius,width,{radial:48}); tyre.rotateX(Math.PI/2);   // axle along Y
    addMesh(g,`${name}_tyre`,tyre,rubber);
    const cap=cylinderZ(radius*0.55,width+0.004,{radial:32}); cap.rotateX(Math.PI/2);
    addMesh(g,`${name}_hub`,cap,hub);
    links.push({name,visual:g});
    joints.push({name:`${name}_joint`,type:'continuous',parent,child:name,xyz,axis:[0,1,0],limit:{effort:100,velocity:12}});
  };
  wheel('left_wheel_link','base_link',d.driveWheelRadius,0.060,[0,d.driveTrack,d.driveWheelRadius]);
  wheel('right_wheel_link','base_link',d.driveWheelRadius,0.060,[0,-d.driveTrack,d.driveWheelRadius]);
  for(const [tag,sx,sy] of [['fl',1,1],['fr',1,-1],['bl',-1,1],['br',-1,-1]])
    wheel(`${tag}_caster_wheel_link`,'base_link',d.casterRadius,0.040,[sx*d.casterX,sy*d.casterY,d.casterRadius]);

  // --- frames: top-module interface and the cover top ---
  links.push({name:'deck'},{name:'cover_top'});
  joints.push(fixed('deck_joint','base_link','deck',[0,0,d.deck]));
  joints.push(fixed('cover_top_joint','base_link','cover_top',[0,0,d.height]));
  // No invented mass/CoG/inertia. The recipe carries the 244 kg catalog mass.
  return {name:'mir1350_reference',links,joints};
}
