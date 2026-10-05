/** ASPINA (Shinano Kenshi) ARH350A electric 3-finger robotic hand. Published values:
 * Ø60 x 155 mm, 640 g, max opening Ø143 mm, 50 N, standard fingers; UR Marketplace
 * listing height 153 mm closed / 135 mm open. The three fingers swing about pivots at
 * the body bottom: with the pivot ring at r = 22 mm, the 18 mm height change and the
 * 143 mm opening give a 77 mm finger and a 40° swing (solved, not published).
 * The robot attachment (sold separately) is not part of this model.
 */
import {THREE,group,silver,dark,rubber,blue,box,cylinder,addMesh,namedMaterial,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
import {roundedBox} from '../../authoring/geometry.mjs';
const white=namedMaterial('housing_white','#eceff1',.05,.5);
export const D={bodyR:.030,body:.076,finger:.077,pivotR:.022,swing:40*Math.PI/180,closedHeight:.153,openHeight:.135,openDiameter:.143};
export function definition(){
 const body=group(),links=[],joints=[];
 cylinder(body,'housing',D.bodyR,D.body-.006,[0,0,(D.body-.006)/2],white);
 cylinder(body,'base_ring',D.bodyR,.006,[0,0,D.body-.003],silver);
 cylinder(body,'hollow_shaft',.008,.004,[0,0,D.body-.002],dark);
 box(body,'status_led',[.008,.001,.003],[0,-D.bodyR,.020],blue);
 cylinder(body,'cable_gland',.005,.010,[0,D.bodyR+.003,.012],dark).rotation.x=Math.PI/2;
 links.push({name:'mount',visual:body,collisions:[cc(D.bodyR,D.body,[0,0,D.body/2])]});
 const tips=[];
 for(let i=0;i<3;i++){
  const a=i*2*Math.PI/3, name=`finger_${i+1}`;
  links.push({name:name+'_origin'});
  joints.push(fixed(name+'_origin_joint','mount',name+'_origin',[D.pivotR*Math.cos(a),D.pivotR*Math.sin(a),D.body],[0,0,a]));
  const f=group();
  // finger bar along +Z from the pivot, pad on the inner (−X) face near the tip
  addMesh(f,'finger_bar',roundedBox([.008,.012,D.finger],.0015,2),dark,[0,0,D.finger/2]);
  cylinder(f,'pivot_pin',.0045,.016,[0,0,0],silver).rotation.x=Math.PI/2;
  addMesh(f,'finger_pad',new THREE.BoxGeometry(.003,.012,.020),rubber,[-.0055,0,D.finger-.010]);
  links.push({name,visual:f,collisions:[cb([.008,.012,D.finger],[0,0,D.finger/2]),cb([.003,.012,.020],[-.0055,0,D.finger-.010])]});
  joints.push({name:i===0?'finger_joint':`finger_${i+1}_mimic_joint`,type:'revolute',parent:name+'_origin',child:name,axis:[0,1,0],limit:{lower:0,upper:D.swing,velocity:1.0,effort:5},...(i===0?{}:{mimic:{joint:'finger_joint',multiplier:1,offset:0}})});
  links.push({name:name+'_tip'});joints.push(fixed(name+'_tip_joint',name,name+'_tip',[-.007,0,D.finger-.010]));
  tips.push(name+'_tip');
 }
 links.push({name:'tcp'});joints.push(fixed('tcp_joint','mount','tcp',[0,0,D.closedHeight-.012]));
 return{name:'aspina_arh350a',links,joints};
}
