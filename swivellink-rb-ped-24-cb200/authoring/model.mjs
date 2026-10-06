/** Swivellink RB-PED-24-CB200 — 24 in welded steel cobot pedestal (CB200 series).
 * Published: height 24 in measured "base to base" (floor to the robot mounting face),
 * shipping dimensions 11.875 x 11.875 x 24 in, shipping weight 45 lb, anchor holes
 * 1/2 in, levelling thread 1/2-13 UNC, a thru-hole for routing cables, welded
 * construction, RAL 7010 powder coat; the top plate is machined for UR3 - UR16e,
 * Omron TM5 / TM12 / TM14 and FANUC CRX-3iA - CRX-20iA/L.
 * No drawing is published (CAD is for registered members). **Everything but the
 * height is an envelope estimate**: the base plate is taken as the 11.875 in square
 * of the shipping dimensions, and the tube (6 in), the top plate (8 in) and the
 * cable bore are scaled from the maker's product render against it; 3/8 in plates
 * make the steel weigh about what the shipping weight allows. The robot bolt
 * patterns, the anchor / levelling holes and the base cable cut-out are not modelled.
 */
import {THREE,group,addMesh,namedMaterial,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
import {cylinderBetween,ringGeometry} from '../../authoring/geometry.mjs';
import {bx} from '../../authoring/stand-shapes.mjs';
const IN=.0254;
const coat=namedMaterial('ral7010_powder_coat','#4c514a',.15,.6);
export const D={height:24*IN,base:11.875*IN,tube:6*IN,top:8*IN,plate:.375*IN,bore:.035,shippingWeightLb:45};
export function definition(){
 const g=group(),links=[],joints=[];
 bx(g,'base_plate',[D.base,D.base,D.plate],[0,0,D.plate/2],coat);
 cylinderBetween(g,'tube',[0,0,D.plate],[0,0,D.height-D.plate],D.tube/2,coat,{radial:64});
 addMesh(g,'top_plate',ringGeometry(D.top/2,D.bore,D.plate),coat,[0,0,D.height-D.plate]);
 links.push({name:'base_link',visual:g,collisions:[cb([D.base,D.base,D.plate],[0,0,D.plate/2]),
   cc(D.tube/2,D.height-2*D.plate,[0,0,D.height/2]),cc(D.top/2,D.plate,[0,0,D.height-D.plate/2])]});
 links.push({name:'mount'});joints.push(fixed('mount_joint','base_link','mount',[0,0,0]));
 links.push({name:'robot_mount'});joints.push(fixed('robot_mount_joint','base_link','robot_mount',[0,0,D.height]));
 return{name:'swivellink_rb_ped_24_cb200',links,joints};
}
