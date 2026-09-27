import {THREE,group,silver,dark,rubber,blue,box,cylinder,lathe,plate,addMesh,namedMaterial,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';

// Product dimensions and stroke; jaw profile/locations are an authored reference.
export const D={width:.026,depth:.018,height:.027,bodyHeight:.020,stroke:.003};
export function definition(){
 const body=group(),links=[],joints=[];
 box(body,'anodized_body',[D.width,D.depth,D.bodyHeight],[0,0,.010],silver);
 box(body,'steel_guide',[D.width,D.depth,.003],[0,0,.0215],dark);
 box(body,'front_cover',[.022,.0008,.006],[0,-.0093,.008],dark);
 for(const x of [-.009,0,.009])box(body,'guide_relief_'+x,[.002,.0006,.004],[x,-.0093,.018],dark);
 links.push({name:'mount',visual:body,collisions:[cb([D.width,D.depth,.023],[0,0,.0115])]});
 for(const [side,s] of [['left',1],['right',-1]]){
  const jaw=group();box(jaw,'base_jaw',[.004,.012,.004],[s*.006,0,.025],dark);
  links.push({name:side+'_jaw',visual:jaw,collisions:[cb([.004,.012,.004],[s*.006,0,.025])]});
  joints.push({name:side==='left'?'finger_joint':'finger_mirror_joint',type:'prismatic',parent:'mount',child:side+'_jaw',axis:[s,0,0],limit:{lower:0,upper:D.stroke,velocity:.04,effort:19},...(s<0?{mimic:{joint:'finger_joint',multiplier:1,offset:0}}:{})});
  links.push({name:side+'_contact'});joints.push(fixed(side+'_contact_joint',side+'_jaw',side+'_contact',[s*.004,0,.025]));
 }
 links.push({name:'tcp'});joints.push(fixed('tcp_joint','mount','tcp',[0,0,D.height]));
 return{name:'schunk_mpg_plus_25',links,joints};
}
