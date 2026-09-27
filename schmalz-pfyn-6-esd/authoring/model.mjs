import {THREE,group,silver,dark,rubber,blue,box,cylinder,lathe,plate,addMesh,namedMaterial,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';

// 10.01.01.14188. Root at M5 shoulder; thread projects toward negative Z.
export const D={diameter:.006,maxDiameter:.0065,height:.0115,thread:.0045,tcp:.007,hex:.008};
export function definition(){
 const g=group();const orange=namedMaterial('esd_nbr_55','#ba5224',0,.8);
 cylinder(g,'m5_nipple',.0025,D.thread,[0,0,-D.thread/2]);
 const hex=addMesh(g,'hex_sw8',new THREE.CylinderGeometry(D.hex/Math.sqrt(3),D.hex/Math.sqrt(3),.002,6),silver,[0,0,.001]);hex.rotation.x=Math.PI/2;
 cylinder(g,'neck',.002,.002,[0,0,.003]);
 lathe(g,'cup',[[.003,.0025],[.004,.0022],[.0055,.0027],[.0065,.00325],[.007,.003],[.0067,.00265],[.005,.001],[.003,.001]],orange);
 return{name:'schmalz_pfyn_6_esd',links:[{name:'mount',visual:g,collisions:[cc(.00462,.002,[0,0,.001]),cc(.00325,.005,[0,0,.0045])]},{name:'tcp'}],joints:[fixed('tcp_joint','mount','tcp',[0,0,D.tcp])]};
}
