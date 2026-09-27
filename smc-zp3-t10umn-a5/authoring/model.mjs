import {THREE,group,silver,dark,rubber,blue,box,cylinder,lathe,plate,addMesh,namedMaterial,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';

// ZP3 European catalog p9: A12.5, B7, M5 male L3, SW10, pad Dmax11.
export const D={diameter:.010,maxDiameter:.011,height:.0125,thread:.003,tcp:.0095,hex:.010};
export function definition(){
 const g=group(),brass=namedMaterial('nickel_plated_brass','#c3bec0',.65,.35);
 cylinder(g,'m5_nipple',.0025,D.thread,[0,0,-D.thread/2],brass);
 const hex=addMesh(g,'hex_sw10',new THREE.CylinderGeometry(D.hex/Math.sqrt(3),D.hex/Math.sqrt(3),.0025,6),brass,[0,0,.00125]);hex.rotation.x=Math.PI/2;
 lathe(g,'grooved_flat_pad',[[.0025,.0045],[.0058,.0045],[.0068,.0024],[.0078,.0024],[.0088,.0055],[.0095,.005],[.0091,.0045],[.008,.001],[.0025,.001]],rubber);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;const rib=box(g,'support_rib_'+i,[.0012,.005,.0008],[Math.sin(a)*.002,Math.cos(a)*.002,.0084],rubber);rib.rotation.z=-a;}
 return{name:'smc_zp3_t10umn_a5',links:[{name:'mount',visual:g,collisions:[cc(.00578,.0025,[0,0,.00125]),cc(.0055,.007,[0,0,.006])]},{name:'tcp'}],joints:[fixed('tcp_joint','mount','tcp',[0,0,D.tcp])]};
}
