/** Robotiq Palletizing Solution AX Series — base, column, linear axis and controller
 * (AX10 configuration with a UR10e). Instruction manual 2023-05-31: footprint 809 x
 * 1370 mm, 2334 mm high (6.1.1), 1500 mm linear axis stroke (3.1 scope of delivery),
 * base 45 kg + column 110 kg (6.2.1), controller 100-240 Vac (6.3.1), two pallet
 * sensor pairs and two status lights (1.1). The column cross section, carriage,
 * robot plate reach and the lowest plate height (550 mm) are placed from the figure,
 * not published numbers. One prismatic joint lifts the robot plate 1500 mm.
 */
import {THREE,group,silver,dark,blue,box,cylinder,namedMaterial,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
import {cylinderBetween} from '../../authoring/geometry.mjs';
const steel=namedMaterial('powder_coated_steel','#3a3f44',.3,.6);
const light=namedMaterial('status_light','#7cd8ff',.1,.3);
export const D={base:[.809,1.370,.060],column:[.220,.160],height:2.334,columnY:-.350,stroke:1.5,plateZ0:.550,plateReach:.420,plate:[.300,.300,.020],mass:155};
export function definition(){
 const g=group(),links=[],joints=[];
 box(g,'base_frame',[D.base[0],D.base[1],D.base[2]],[0,0,D.base[2]/2],steel);
 for(const sx of [-1,1]) for(const sy of [-1,1]) box(g,`anchor_foot_${sx<0?'l':'r'}${sy<0?'f':'b'}`,[.090,.060,.030],[sx*(D.base[0]/2-.050),sy*(D.base[1]/2-.040),D.base[2]+.015],silver);
 const colH=D.height-D.base[2]-.080;   // the two status lights make up the last 80 mm of the 2334 mm height
 box(g,'column',[D.column[0],D.column[1],colH],[0,D.columnY,D.base[2]+colH/2],steel);
 box(g,'axis_controller',[.420,.200,.400],[0,D.columnY-D.column[1]/2-.100,1.000],dark);
 box(g,'rail',[.060,.010,colH-.200],[0,D.columnY+D.column[1]/2+.005,D.base[2]+colH/2],silver);
 for(const sx of [-1,1]){
   cylinderBetween(g,`status_light_${sx<0?'l':'r'}`,[sx*.070,D.columnY,D.base[2]+colH],[sx*.070,D.columnY,D.height],.020,light,{radial:16});
   for(const sy of [-1,1]) box(g,`pallet_sensor_${sx<0?'l':'r'}${sy<0?'f':'b'}`,[.030,.030,.020],[sx*(D.base[0]/2-.015),sy*.300,D.base[2]+.030],blue);
 }
 links.push({name:'base_link',visual:g,collisions:[cb([D.base[0],D.base[1],D.base[2]],[0,0,D.base[2]/2]),cb([D.column[0],D.column[1],colH],[0,D.columnY,D.base[2]+colH/2]),cb([.420,.200,.400],[0,D.columnY-D.column[1]/2-.100,1.000])]});
 // carriage with the robot plate, sliding along the column front (+Y side)
 const c=group();
 box(c,'carriage',[.260,.080,.300],[0,.050,0],steel);
 box(c,'robot_arm_bracket',[.200,D.plateReach-.090,.060],[0,.090+(D.plateReach-.090)/2,.100],steel);
 box(c,'robot_plate',[D.plate[0],D.plate[1],D.plate[2]],[0,D.plateReach,.130+D.plate[2]/2],silver);
 links.push({name:'carriage',visual:c,collisions:[cb([.260,.080,.300],[0,.050,0]),cb([.200,D.plateReach-.090,.060],[0,.090+(D.plateReach-.090)/2,.100]),cb([D.plate[0],D.plate[1],D.plate[2]],[0,D.plateReach,.130+D.plate[2]/2])]});
 joints.push({name:'lift_joint',type:'prismatic',parent:'base_link',child:'carriage',xyz:[0,D.columnY+D.column[1]/2+.010,D.plateZ0-.150],axis:[0,0,1],limit:{lower:0,upper:D.stroke,velocity:.3,effort:3000}});
 links.push({name:'robot_mount'});joints.push(fixed('robot_mount_joint','carriage','robot_mount',[0,D.plateReach,.130+D.plate[2]]));
 return{name:'robotiq_ax_series_base',links,joints};
}
