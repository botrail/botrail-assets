/** MiR EU Pallet Lift 1350: published envelope and stroke, own geometry.
 * Facts (MiR product page + distributor spec listings, 2026-09): module
 * 1371 x 853 x 154 mm, 125 kg, lifts EUR pallets (1200 x 800, EN 13698-1) by
 * 60 mm, 1250 kg on the MiR1350, 4 s up / 3.2 s down. The two lifting rails
 * (1200 x 162 x 87 mm each) are listed as the lift's contact members; their
 * lateral spacing (600 mm centres) and the 67 mm base frame under them are
 * estimates that keep the published 154 mm overall height. No vendor CAD.
 */
import * as THREE from 'three';
import {addMesh,namedMaterial,roundedBox} from '@botrail/authoring/geometry.mjs';

export const dimensions={length:1.371,width:0.853,height:0.154,stroke:0.060,
  frame:0.067,rail:[1.200,0.162,0.087],railSpacing:0.600,upSeconds:4.0};

const black=namedMaterial('frame_black','#1a1c1e',0.2,0.6);
const rail=namedMaterial('rail_black','#232628',0.3,0.5);
const pad=namedMaterial('contact_pad','#3a3d40',0.0,0.85);
const box=(size,xyz)=>({kind:'box',size,xyz});
const G=()=>new THREE.Group();

export function definition() {
  const d=dimensions, links=[], joints=[];
  const frame=G();
  addMesh(frame,'base_frame',roundedBox([d.length,d.width,d.frame],0.012,2),black,[0,0,d.frame/2]);
  // Two guide bumpers at the entry end: what centres the module under a pallet rack.
  for(const sy of [-1,1]) addMesh(frame,`entry_guide_${sy>0?'left':'right'}`,roundedBox([0.12,0.03,0.05],0.008,1),pad,
    [d.length/2-0.08,sy*(d.width/2-0.02),d.frame+0.025]);
  links.push({name:'mount'});
  links.push({name:'frame',visual:frame,collisions:[box([d.length,d.width,d.frame],[0,0,d.frame/2])]});
  joints.push({name:'frame_joint',type:'fixed',parent:'mount',child:'frame',xyz:[0,0,0]});

  const platform=G(), [rl,rw,rh]=d.rail;
  for(const sy of [-1,1]) {
    addMesh(platform,`rail_${sy>0?'left':'right'}`,roundedBox([rl,rw,rh],0.008,2),rail,[0,sy*d.railSpacing/2,rh/2]);
    addMesh(platform,`rail_pad_${sy>0?'left':'right'}`,roundedBox([rl-0.04,rw-0.03,0.004],0.0015,1),pad,[0,sy*d.railSpacing/2,rh+0.001]);
  }
  addMesh(platform,'cross_member',roundedBox([0.90,d.railSpacing-rw,0.030],0.006,1),black,[0,0,0.015]);
  links.push({name:'platform',visual:platform,collisions:[-1,1].map(sy=>box([rl,rw,rh],[0,sy*d.railSpacing/2,rh/2]))});
  joints.push({name:'lift',type:'prismatic',parent:'frame',child:'platform',xyz:[0,0,d.frame],axis:[0,0,1],
    limit:{lower:0,upper:d.stroke,velocity:Number((d.stroke/d.upSeconds).toPrecision(6)),effort:15000}});
  // The pallet seat: rail top, +Z up. Lowered it sits 154 mm over the mount plane.
  links.push({name:'pallet'});
  joints.push({name:'pallet_joint',type:'fixed',parent:'platform',child:'pallet',xyz:[0,0,rh]});
  return {name:'mir_eu_pallet_lift_1350_reference',links,joints};
}
