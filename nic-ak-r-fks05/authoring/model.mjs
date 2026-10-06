/** NIC Autotec AK-R-FKS05 — stand-type aluminium frame for collaborative robots of
 * 5 kg payload or less (UR3e / UR5e with the FKS05-UR robot base sets).
 * Maker's product page and specification drawing: 600 x 700 x 780 mm, 35 kg, basic
 * frame AFSR-606030-6, a 120 mm square column, 132 mm from the floor to the underside
 * of the base frame and 800 mm to the top of the 20 mm robot base plate. In the plan
 * view the column sits 390 + 120 mm from one end of the 700 mm depth, i.e. 100 mm off
 * its centre, and is centred in the 600 mm width (210 + 180 + 210).
 * The robot base plate (dia. 200, t 20, A5052) is a separate article; it is its own
 * link here so the mounting height matches the drawing.
 * Beam depth (90 mm), knob / caster positions, wheel size and the handles are read
 * from the drawing's proportions — they are not dimensioned.
 */
import {THREE,group,namedMaterial,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
import {cylinderBetween} from '../../authoring/geometry.mjs';
import {profile,caster,knobAdjuster,uHandle} from '../../authoring/stand-shapes.mjs';
const plateMat=namedMaterial('robot_base_plate','#c9ced3',.55,.4);
export const D={w:.600,d:.700,frameTop:.780,under:.132,beam:[.090,.060],spine:.180,column:.120,columnY:-.100,
  plate:[.100,.020],knob:[.278,.030],caster:[.170,.0375],mass:35};
export function definition(){
 const g=group(),links=[],joints=[];
 const z0=D.under,z1=z0+D.beam[1],zb=(z0+z1)/2,yb=D.d/2-D.beam[0]/2;
 // H-shaped base: a cross beam at each end of the depth, tied by the spine the column stands on
 for(const [tag,s] of [['near',-1],['far',1]]) profile(g,`cross_beam_${tag}`,'x',D.w,D.beam,[0,s*yb,zb],{slots:[3,2]});
 profile(g,'spine','y',D.d-2*D.beam[0],[D.spine,D.beam[1]],[0,0,zb],{slots:[6,2]});
 profile(g,'column','z',D.frameTop-z1,[D.column,D.column],[0,D.columnY,(z1+D.frameTop)/2],{slots:[4,4]});
 for(const sx of [-1,1]){
   uHandle(g,`handle_${sx<0?'l':'r'}`,[sx*D.column/2,D.columnY,.640],[sx*D.column/2,D.columnY,.760],[sx,0,0],.045);
   for(const [tag,sy] of [['near',-1],['far',1]]){
     knobAdjuster(g,`adjuster_${sx<0?'l':'r'}_${tag}`,[sx*D.knob[0],sy*yb],z1,{knob:D.knob[1]});
     caster(g,`caster_${sx<0?'l':'r'}_${tag}`,[sx*D.caster[0],sy*yb,z0],D.caster[1]);
   }
 }
 const collisions=[cb([D.spine,D.d-2*D.beam[0],D.beam[1]],[0,0,zb]),cb([D.column,D.column,D.frameTop-z1],[0,D.columnY,(z1+D.frameTop)/2])];
 for(const sy of [-1,1]){
   collisions.push(cb([D.w,D.beam[0],z1],[0,sy*yb,z1/2]));   // beam with the casters and adjuster feet under it
   for(const sx of [-1,1]) collisions.push(cb([2*D.knob[1],2*D.knob[1],.030],[sx*D.knob[0],sy*yb,z1+.015]));
 }
 for(const sx of [-1,1]) collisions.push(cb([.053,.016,.136],[sx*(D.column/2+.0265),D.columnY,.700]));
 links.push({name:'base_link',visual:g,collisions});
 // the separately sold robot base plate, on top of the column
 const p=group();
 cylinderBetween(p,'robot_base_plate',[0,0,0],[0,0,D.plate[1]],D.plate[0],plateMat,{radial:64});
 links.push({name:'robot_base_plate',visual:p,collisions:[cc(D.plate[0],D.plate[1],[0,0,D.plate[1]/2])]});
 joints.push(fixed('robot_base_plate_joint','base_link','robot_base_plate',[0,D.columnY,D.frameTop]));
 links.push({name:'mount'});joints.push(fixed('mount_joint','base_link','mount',[0,0,0]));
 links.push({name:'robot_mount'});joints.push(fixed('robot_mount_joint','robot_base_plate','robot_mount',[0,0,D.plate[1]]));
 return{name:'nic_ak_r_fks05',links,joints};
}
