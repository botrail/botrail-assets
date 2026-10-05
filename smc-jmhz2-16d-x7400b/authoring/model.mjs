/** SMC JMHZ2-16D-X7400B — air gripper unit for Universal Robots (ISO 9409-1-50-4-M6
 * flange, integrated solenoid valve, speed controllers and auto switches, M8 8-pin
 * socket). Numbers from the SMC flyer P-20-26 (JMHZ2-X7400B-CRX, same gripper unit):
 * 88.1 mm flange face to jaw base, 85.8 mm grip reference, (135) with the supplied
 * attachments, body 33.6 + 37 deep, cover 33.1 + 50 wide, attachment 12.5 wide /
 * 49.2 long, inner gap 17 closed / 27 open (10 mm stroke); UR+ listing envelope
 * 85 x 68 x 135 mm; mass 430 g. The valve box, knobs and covers are approximate.
 */
import {THREE,group,silver,dark,blue,box,cylinder,plate,addMesh,namedMaterial,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
const white=namedMaterial('resin_cover_white','#e8e9ea',.05,.55);
export const D={flange:.003,block:.0286,coverBottom:.0596,jawBase:.0881,tip:.135,gapClosed:.017,gapOpen:.027,stroke:.005,attach:[.0095,.0125,.0492]};
export function definition(){
 const body=group(),links=[],joints=[];
 const holes=[];for(const a of [45,135,225,315])holes.push([.025*Math.cos(a*Math.PI/180),.025*Math.sin(a*Math.PI/180),.0033]);
 plate(body,'iso50_flange',.0315,D.flange,holes,silver);                               // Ø63 x 3 flange plate (Ø31.5 pilot not modelled)
 box(body,'connector_block',[.060,.050,D.block-D.flange],[0,0,(D.flange+D.block)/2],silver); // 3 .. 28.6, M8 socket block
 cylinder(body,'m8_socket',.005,.006,[0,-.028,.020],dark).rotation.x=Math.PI/2;
 box(body,'cover_switch_side',[.0331,.0706,.031],[-.01655,.0017,(D.block+D.coverBottom)/2],white);   // 28.6 .. 59.6
 box(body,'cover_valve_side',[.050,.0706,.031],[.025,.0017,(D.block+D.coverBottom)/2],white);
 for(const [i,y] of [[0,-.012],[1,.012]]) cylinder(body,`speed_knob_${i}`,.004,.006,[.047,y,.045],dark).rotation.z=Math.PI/2;
 cylinder(body,'air_port_fitting',.004,.010,[-.030,0,.040],silver).rotation.z=Math.PI/2;
 box(body,'gripper_body',[.040,.030,D.jawBase-D.coverBottom],[0,0,(D.coverBottom+D.jawBase)/2],silver); // 59.6 .. 88.1 guide body
 box(body,'status_led',[.006,.001,.003],[-.02,-.0345,.050],blue);
 links.push({name:'mount',visual:body,collisions:[cc(.0315,D.flange,[0,0,D.flange/2]),cb([.060,.050,D.block-D.flange],[0,0,(D.flange+D.block)/2]),cb([.0831,.0706,.031],[.00845,.0017,(D.block+D.coverBottom)/2]),cb([.040,.030,D.jawBase-D.coverBottom],[0,0,(D.coverBottom+D.jawBase)/2])]});
 for(const [side,s] of [['left',-1],['right',1]]){
  const jaw=group(), xi=s*D.gapClosed/2;                // inner face of the attachment at closed
  box(jaw,'base_jaw',[.012,.014,.012],[xi+s*.008,0,D.jawBase+.006],dark);
  box(jaw,'attachment',[D.attach[0],D.attach[1],D.attach[2]],[xi+s*D.attach[0]/2,0,D.tip-D.attach[2]/2],silver);   // 85.8 .. 135 (grip reference L starts at 85.8)
  links.push({name:side+'_jaw',visual:jaw,collisions:[cb([.012,.014,.012],[xi+s*.008,0,D.jawBase+.006]),cb(D.attach,[xi+s*D.attach[0]/2,0,D.tip-D.attach[2]/2])]});
  joints.push({name:side==='left'?'finger_joint':'finger_mirror_joint',type:'prismatic',parent:'mount',child:side+'_jaw',axis:[s,0,0],limit:{lower:0,upper:D.stroke,velocity:.05,effort:33},...(s>0?{mimic:{joint:'finger_joint',multiplier:1,offset:0}}:{})});
  links.push({name:side+'_contact'});joints.push(fixed(side+'_contact_joint',side+'_jaw',side+'_contact',[xi,0,.122]));
 }
 links.push({name:'tcp'});joints.push(fixed('tcp_joint','mount','tcp',[0,0,.122]));
 return{name:'smc_jmhz2_16d_x7400b',links,joints};
}
