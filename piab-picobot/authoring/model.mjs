/** Piab piCOBOT for Universal Robots — COAX ejector unit with the Adjustable Gripper
 * (two suction cups). Datasheet 2023-01-03: ejector Ø70 x 69 mm (A = 71.9 with the
 * cover), 22.8 oz, gripper arm 8.6 oz with cup spacing 97-142 mm and ±15° cups;
 * UR Marketplace listing: Ø93 x 74 mm with the ISO 9409-1-50-M6 adapter plate,
 * Adjustable Gripper 174 x 72 x 38 mm. Cups are placed at 120 mm spacing with
 * Ø40 mm bellows as a representative kit cup; display, fittings and the push-pin are
 * approximate. No vacuum state joint is invented.
 */
import {group,silver,dark,rubber,blue,box,cylinder,lathe,plate,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
export const D={plate:.005,body:.069,bodyR:.035,arm:[.174,.072,.038],cupSpacing:.120,cup:.022};
export function definition(){
 const body=group(),links=[],joints=[];
 const holes=[];for(const a of [45,135,225,315])holes.push([.025*Math.cos(a*Math.PI/180),.025*Math.sin(a*Math.PI/180),.0033]);
 plate(body,'iso50_adapter_plate',.0465,D.plate,holes,silver);                       // Ø93 x 5
 cylinder(body,'ejector_body',D.bodyR,D.body,[0,0,D.plate+D.body/2],dark);           // Ø70 x 69
 box(body,'display',[.030,.002,.016],[0,-D.bodyR-.0005,.040],blue);
 cylinder(body,'air_connector',.004,.014,[.035,.020,.030],silver).rotation.z=Math.PI/2;
 cylinder(body,'m8_socket',.005,.006,[-.034,-.020,.025],dark).rotation.z=Math.PI/2;
 const z0=D.plate+D.body;
 box(body,'gripper_arm',[D.arm[0],.040,.020],[0,0,z0+.010],dark);                   // 174 long beam
 box(body,'gripper_valve_block',[.060,D.arm[1],.018],[0,0,z0+.029],dark);           // piSAVE valves, 72 deep
 for(const s of [-1,1]) box(body,`cup_holder_${s<0?'a':'b'}`,[.022,.022,.018],[s*D.cupSpacing/2,0,z0+.029],silver);
 cylinder(body,'push_pin',.004,.030,[D.arm[0]/2+.012,0,z0+.010],silver).rotation.z=Math.PI/2;
 links.push({name:'mount',visual:body,collisions:[cc(.0465,D.plate,[0,0,D.plate/2]),cc(D.bodyR,D.body,[0,0,D.plate+D.body/2]),cb([D.arm[0],D.arm[1],D.arm[2]],[0,0,z0+D.arm[2]/2])]});
 const z1=z0+D.arm[2];
 for(const [name,s] of [['cup_a',-1],['cup_b',1]]){
  const cup=group();
  cylinder(cup,'fitting',.006,.006,[0,0,.003],silver);
  lathe(cup,'bellows_cup_40',[[.006,.006],[.008,.012],[.012,.020],[.015,.015],[.018,.020],[.022,.020],[.022,.012]],rubber);
  links.push({name,visual:cup,collisions:[cc(.006,.006,[0,0,.003]),cc(.020,.016,[0,0,.014])]});
  joints.push(fixed(name+'_joint','mount',name,[s*D.cupSpacing/2,0,z1]));
  links.push({name:name+'_contact'});joints.push(fixed(name+'_contact_joint',name,name+'_contact',[0,0,D.cup]));
 }
 links.push({name:'tcp'});joints.push(fixed('tcp_joint','mount','tcp',[0,0,z1+D.cup]));
 return{name:'piab_picobot_ur',links,joints};
}
