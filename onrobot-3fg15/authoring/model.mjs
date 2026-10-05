/** OnRobot 3FG15 (item 103666) three-finger centric gripper with the integral
 * tool-side Quick Changer, delivered 49 mm fingers and Ø13.5 silicone fingertips.
 * Datasheet v2.1 p.2/p.12/p.13: external grip diameter 4-152 mm, 101.5 mm from the
 * QC face to the finger platforms, 156.5 mm overall, Ø110 platform circle, Ø180.5
 * finger sweep, 1.15 kg, 5.3 Nm motor torque per platform. Each finger platform
 * rotates about its own axis (r = 55 mm) and swings the finger on a 46.25 mm arm —
 * solved from the 4 / 152 mm grip diameters, not a published linkage.
 */
import {THREE,group,silver,dark,rubber,blue,box,cylinder,addMesh,namedMaterial,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
import {cylinderBetween} from '../../authoring/geometry.mjs';
export const D={qc:.012,bodyR:.050,bodyTop:.082,platformR:.055,platform:.0195,arm:.04625,finger:.049,tipR:.00675,tipLen:.0205,overall:.1565,closedDiameter:.004,openDiameter:.152};
export const open=Math.acos((D.platformR**2+D.arm**2-(D.openDiameter/2+D.tipR)**2)/(2*D.platformR*D.arm));
export function definition(){
 const body=group(),links=[],joints=[];
 cylinder(body,'integral_tool_side_qc',.0355,D.qc,[0,0,D.qc/2],silver);
 cylinder(body,'housing',D.bodyR,D.bodyTop-D.qc,[0,0,(D.qc+D.bodyTop)/2],dark);
 box(body,'logo_window',[.030,.001,.012],[0,-D.bodyR-.0005,.045],blue);
 links.push({name:'mount',visual:body,collisions:[cc(.0355,D.qc,[0,0,D.qc/2]),cc(D.bodyR,D.bodyTop-D.qc,[0,0,(D.qc+D.bodyTop)/2])]});
 for(let i=0;i<3;i++){
  const a=i*2*Math.PI/3+Math.PI/2, name=`finger_${i+1}`;
  links.push({name:name+'_origin'});
  // origin on the platform axis; local +X points at the gripper axis (arm inward at q = 0)
  joints.push(fixed(name+'_origin_joint','mount',name+'_origin',[D.platformR*Math.cos(a),D.platformR*Math.sin(a),D.bodyTop],[0,0,a+Math.PI]));
  const p=group();
  cylinder(p,'finger_platform',.024,D.platform,[0,0,D.platform/2],dark);
  box(p,'finger_arm',[D.arm,.014,.010],[D.arm/2,0,D.platform-.005],silver);
  cylinder(p,'finger_rod',.005,D.finger,[D.arm,0,D.platform+D.finger/2],silver);
  cylinder(p,'silicone_tip',D.tipR,D.tipLen,[D.arm,0,D.platform+D.finger+.006-D.tipLen/2],rubber);
  links.push({name,visual:p,collisions:[cc(.024,D.platform,[0,0,D.platform/2]),cb([D.arm,.014,.010],[D.arm/2,0,D.platform-.005]),cc(D.tipR,D.finger+.006,[D.arm,0,D.platform+(D.finger+.006)/2])]});
  joints.push({name:i===0?'finger_joint':`finger_${i+1}_mimic_joint`,type:'revolute',parent:name+'_origin',child:name,axis:[0,0,1],limit:{lower:0,upper:open,velocity:1.0,effort:5.3},...(i===0?{}:{mimic:{joint:'finger_joint',multiplier:1,offset:0}})});
  links.push({name:name+'_tip'});joints.push(fixed(name+'_tip_joint',name,name+'_tip',[D.arm,0,D.platform+D.finger-.004]));
 }
 links.push({name:'tcp'});joints.push(fixed('tcp_joint','mount','tcp',[0,0,D.bodyTop+D.platform+D.finger-.004]));
 return{name:'onrobot_3fg15_103666',links,joints};
}
