import {THREE,group,silver,dark,rubber,blue,box,cylinder,lathe,plate,addMesh,namedMaterial,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';

// Metres. SMC MHZ catalog p419 (basic type); q=0 closed, each jaw travels 5 mm.
export const D={body:[.042,.0276,.0528], guide:[.050,.0276,.0095], tip:.0848, gap:.0163, stroke:.005};
export function definition(){
 const body=group(),links=[],joints=[];
 box(body,'anodized_body',D.body,[0,0,D.body[2]/2]);
 box(body,'hardened_guide',D.guide,[0,0,.05755],dark);
 for(const s of [-1,1]){
  box(body,'sensor_groove_'+s,[.003,.001,.047],[s*.013,s*.014,.026],dark);
  const port=cylinder(body,'air_port_'+s,.0025,.0015,[s*.0075,0,s>0?.023:.010],dark);
  port.rotation.x=Math.PI/2;port.position.y=-.014;
 }
 links.push({name:'mount',visual:body,collisions:[cb(D.body,[0,0,.0264]),cb(D.guide,[0,0,.05755])]});
 for(const [side,s] of [['left',1],['right',-1]]){
  const jaw=group(),x=s*(D.gap/2+.004);
  box(jaw,'base_jaw',[.008,.010,.0225],[x,0,.07355],dark);
  for(const z of [.0708,.0798]){
   const hole=cylinder(jaw,'attachment_m4_'+z,.002,.0006,[x,0,z],silver);hole.rotation.x=Math.PI/2;hole.position.y=-.0052;
  }
  links.push({name:side+'_jaw',visual:jaw,collisions:[cb([.008,.010,.0225],[x,0,.07355])]});
  joints.push({name:side==='left'?'finger_joint':'finger_mirror_joint',type:'prismatic',parent:'mount',child:side+'_jaw',axis:[s,0,0],limit:{lower:0,upper:D.stroke,velocity:.03,effort:42},...(s<0?{mimic:{joint:'finger_joint',multiplier:1,offset:0}}:{})});
  links.push({name:side+'_contact'});joints.push(fixed(side+'_contact_joint',side+'_jaw',side+'_contact',[s*D.gap/2,0,.0748]));
 }
 links.push({name:'tcp'});joints.push(fixed('tcp_joint','mount','tcp',[0,0,D.tip]));
 return{name:'smc_mhz2_20d',links,joints};
}
