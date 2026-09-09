/** HND-GRP with HND-FIN-MLD-KIT. Numeric reference: July 2026 manual Fig.5-1.
 * The older 157 mm aluminium-finger assembly is not this 146 mm configuration.
 */
import {THREE,group,silver,dark,rubber,blue,box,cylinder,lathe,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
export function definition() {
 const body=group(),links=[],joints=[];
 lathe(body,'waisted_shell',[[0,0],[0,.0370],[.0129,.0370],[.014,.0375],[.017,.0375],[.024,.035],[.037,.027],[.068,.027],[.079,.035],[.083,.0375],[.094,.0375],[.1005,.034],[.1005,0]],dark);
 cylinder(body,'base_ring',.0375,.013,[0,0,.0065],silver);
 box(body,'rack_guide',[.064,.0285,.012],[0,0,.098],silver);
 box(body,'status_light',[.014,.002,.003],[0,-.0275,.044],blue);
 for(const x of [-.027,.027])for(const y of [-.016,.016]) cylinder(body,`mount_screw_${x}_${y}`,.0035,.004,[x,y,.014],silver);
 links.push({name:'mount',visual:body,collisions:[cc(.0375,.024,[0,0,.012]),cc(.027,.048,[0,0,.048]),cc(.0375,.0285,[0,0,.08625])]});
 for(const [side,sign] of [['left',1],['right',-1]]) {
  const jaw=group();
  box(jaw,'rack',[.015,.027,.01],[sign*.009,0,.1005],silver);
  // Reference profile of the stepped overmolded finger; pad gap is exact 2*q.
  box(jaw,'finger_base',[.010,.024,.016],[sign*.010,0,.111],silver);
  box(jaw,'finger_tip',[.0067,.024,.027],[sign*.00485,0,.1325],silver);
  box(jaw,'nbr_pad',[.0015,.023,.024],[sign*.00075,0,.1335],rubber);
  links.push({name:side+'_finger',visual:jaw,collisions:[cb([.015,.027,.01],[sign*.009,0,.1005]),cb([.010,.024,.016],[sign*.010,0,.111]),cb([.0082,.024,.027],[sign*.0041,0,.1325])]});
  joints.push({name:side==='left'?'finger_joint':'finger_mirror_joint',type:'prismatic',parent:'mount',child:side+'_finger',axis:[sign,0,0],limit:{lower:0,upper:.025,velocity:.05,effort:50},...(side==='right'?{mimic:{joint:'finger_joint',multiplier:1,offset:0}}:{})});
  links.push({name:side+'_contact'});joints.push(fixed(side+'_contact_joint',side+'_finger',side+'_contact',[0,0,.1335]));
 }
 links.push({name:'tcp'});joints.push(fixed('tcp_joint','mount','tcp',[0,0,.146]));
 return {name:'robotiq_hand_e_hnd_grp',links,joints};
}
