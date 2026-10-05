/** OnRobot 2FG7 (item 106376) electric parallel gripper with the integral tool-side
 * Quick Changer, fingers mounted inwards. Datasheet v2.0 p.2/p.11: 38 mm total stroke,
 * external grip 1-39 mm (fingers inwards), 90 x 71 mm body, 99 mm from the QC face to
 * the finger platforms, 145 mm overall with the delivered 8.5 mm fingers, 60 / 32 mm
 * finger platform widths, 1.1 kg. Finger plates and bellow are approximate.
 */
import {THREE,group,silver,dark,rubber,blue,box,cylinder,addMesh,namedMaterial,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
export const D={qc:.012,bodyTop:.099,width:.090,depth:.071,overall:.145,gapClosed:.001,stroke:.019,finger:[.0085,.032,.040]};
export function definition(){
 const body=group(),links=[],joints=[];
 cylinder(body,'integral_tool_side_qc',.0355,D.qc,[0,0,D.qc/2],silver);
 box(body,'upper_shell',[D.width,D.depth,.040],[0,0,D.qc+.020],dark);
 box(body,'lower_shell',[D.width,.064,D.bodyTop-D.qc-.040],[0,0,(D.qc+.040+D.bodyTop)/2],dark);
 box(body,'bellow',[.070,.050,.006],[0,0,D.bodyTop-.003],rubber);
 box(body,'logo_window',[.030,.001,.010],[0,-D.depth/2-.0005,.050],blue);
 cylinder(body,'m3_service_port',.002,.002,[0,D.depth/2,.03465],silver).rotation.x=Math.PI/2;
 links.push({name:'mount',visual:body,collisions:[cc(.0355,D.qc,[0,0,D.qc/2]),cb([D.width,D.depth,D.bodyTop-D.qc],[0,0,(D.qc+D.bodyTop)/2])]});
 for(const [side,s] of [['left',-1],['right',1]]){
  const f=group(), xi=s*D.gapClosed/2;
  box(f,'finger_platform',[.022,.060,.006],[xi+s*.011,0,D.bodyTop+.003],silver);
  box(f,'finger_plate',D.finger,[xi+s*D.finger[0]/2,0,D.overall-D.finger[2]/2],dark);
  links.push({name:side+'_finger',visual:f,collisions:[cb([.022,.060,.006],[xi+s*.011,0,D.bodyTop+.003]),cb(D.finger,[xi+s*D.finger[0]/2,0,D.overall-D.finger[2]/2])]});
  joints.push({name:side==='left'?'finger_joint':'finger_mirror_joint',type:'prismatic',parent:'mount',child:side+'_finger',axis:[s,0,0],limit:{lower:0,upper:D.stroke,velocity:.225,effort:140},...(s>0?{mimic:{joint:'finger_joint',multiplier:1,offset:0}}:{})});
  links.push({name:side+'_contact'});joints.push(fixed(side+'_contact_joint',side+'_finger',side+'_contact',[xi,0,D.overall-.015]));
 }
 links.push({name:'tcp'});joints.push(fixed('tcp_joint','mount','tcp',[0,0,D.overall-.015]));
 return{name:'onrobot_2fg7_106376',links,joints};
}
