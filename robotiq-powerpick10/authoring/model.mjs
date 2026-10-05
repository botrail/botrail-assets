/** Robotiq PowerPick10 vacuum gripper, default configuration #1: 0 mm offset plate
 * (125 x 63 x 8.84, ISO 9409-1-50-4-M6, Fig. 5-8), 200 mm hollow offset link, small
 * suction cup brackets with four Ø77.5 bellows cups, no wrist extension. Instruction
 * manual 2024-02-12 Fig. 5-9 and Table 5-2: envelope 346.7 x 227.5 x 157.6 mm, cup
 * pairs 162.7 (X) / 227.5 (Y) outside-to-outside, TCP (200, 0, 140) from the flange,
 * hose elbows 17.6 mm above the mounting face outside the Ø75 wrist, 1.2 kg
 * (configuration 3 of the table; the default row carries no mass). The plate's long
 * side runs across the link (Y); the hoses are visual only.
 */
import {group,silver,dark,rubber,box,cylinder,lathe,addMesh,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
import {cylinderBetween,tubeGeometry} from '../../authoring/geometry.mjs';
export const D={plate:[.063,.125,.00884],offset:.200,cupR:.03875,cupPitch:[.1627-.0775,.2275-.0775],tcpZ:.140,length:.3467,width:.2275,height:.1576,elbow:[-.050,.035,.0176]};
export function definition(){
 const g=group(),links=[],joints=[];
 const zPlate=D.plate[2];
 box(g,'offset_plate_0mm',D.plate,[0,0,zPlate/2],silver);
 for(const [i,a] of [45,135,225,315].entries()) cylinder(g,`flange_bolt_${i}`,.0045,.004,[.025*Math.cos(a*Math.PI/180),.025*Math.sin(a*Math.PI/180),zPlate+.002],dark);
 box(g,'hollow_offset_link',[D.offset-.010,.060,.030],[D.offset/2+.005,0,zPlate+.015],dark);
 for(const sy of [-1,1]) box(g,'cup_bracket_'+(sy<0?'a':'b'),[.140,.040,.012],[D.offset,sy*D.cupPitch[1]/2,zPlate+.030+.006],dark);
 box(g,'bracket_bridge',[.060,.190,.012],[D.offset,0,zPlate+.030+.006],dark);
 // hose elbows beside the plate (outside the Ø75 wrist) and two visual hoses to the cups
 const [ex,ey,eh]=D.elbow;
 for(const sy of [-1,1]){
  box(g,'hose_elbow_'+(sy<0?'a':'b'),[.016,.016,eh],[ex,sy*ey,-eh/2],silver);
  const pts=[[ex,sy*ey,-eh/2],[-.059,sy*.070,-.004],[.020,sy*.105,.025],[.110,sy*.105,.040],[D.offset-D.cupPitch[0]/2,sy*D.cupPitch[1]/2,zPlate+.045]];
  addMesh(g,'vacuum_hose_'+(sy<0?'a':'b'),tubeGeometry(pts,.0045,{tubular:32,radial:10}),rubber);
 }
 links.push({name:'mount',visual:g,collisions:[cb(D.plate,[0,0,zPlate/2]),cb([D.offset-.010,.060,.030],[D.offset/2+.005,0,zPlate+.015]),cb([.140,.190,.012],[D.offset,0,zPlate+.036]),
   cb([.016,.016,eh],[ex,ey,-eh/2]),cb([.016,.016,eh],[ex,-ey,-eh/2])]});
 const z1=zPlate+.042, cupH=D.tcpZ-z1;   // stem + bellows from the bracket to the lip at 140 mm
 let i=0;
 for(const sx of [-1,1]) for(const sy of [-1,1]){
  const name=`cup_${++i}`, cup=group();
  cylinder(cup,'air_node',.011,.030,[0,0,.015],silver);
  cylinderBetween(cup,'hose_fitting',[0,0,.010],[0,.028,.010],.004,silver,{radial:12});
  lathe(cup,'bellows_cup',[[.030,.012],[.034,.022],[.046,.030],[.056,.024],[.068,.032],[.078,.026],[cupH-.006,D.cupR],[cupH,D.cupR],[cupH,.020]],rubber);   // [z, r]
  links.push({name,visual:cup,collisions:[cc(.011,.030,[0,0,.015]),cc(D.cupR,cupH-.030,[0,0,.030+(cupH-.030)/2])]});
  joints.push(fixed(name+'_joint','mount',name,[D.offset+sx*D.cupPitch[0]/2,sy*D.cupPitch[1]/2,z1]));
  links.push({name:name+'_contact'});joints.push(fixed(name+'_contact_joint',name,name+'_contact',[0,0,cupH]));
 }
 links.push({name:'tcp'});joints.push(fixed('tcp_joint','mount','tcp',[D.offset,0,D.tcpZ]));
 return{name:'robotiq_powerpick10_default',links,joints};
}
