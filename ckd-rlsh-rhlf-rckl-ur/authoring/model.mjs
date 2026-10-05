/** CKD pneumatic grippers for Universal Robots, UR+ certified: RLSH-UR (compact,
 * 18 mm stroke, 42 N, 0.8 kg), RHLF-UR (long stroke, 32 mm, 85 N, 1.0 kg) and
 * RCKL-UR (3-way finger, 10 mm, 125 N, 1.1 kg) — CKD product pages. The common
 * robot flange with the clamp ring and the 360° indicator are from the CKD leaflet;
 * outer envelopes come from the UR Marketplace listing (148 x 83 x 76, 111 x 138 x 79,
 * 119.4 x 76 x 87 mm). CKD publishes the drawings only in its member catalog, so the
 * body split, jaw gaps and finger shapes are envelope-based approximations.
 */
import {THREE,group,silver,dark,blue,box,cylinder,addMesh,namedMaterial,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
const teal=namedMaterial('indicator_teal','#39b7a6',.1,.4);
export const variants=['rlsh-ur','rhlf-ur','rckl-ur'];
export const V={
 'rlsh-ur':{name:'ckd_rlsh_ur',height:.148,body:[.083,.076,.095],jaws:2,stroke:.009,gapClosed:.010,finger:[.012,.020,.035],mass:.8},
 'rhlf-ur':{name:'ckd_rhlf_ur',height:.111,body:[.138,.079,.070],jaws:2,stroke:.016,gapClosed:.020,finger:[.014,.024,.023],mass:1.0},
 'rckl-ur':{name:'ckd_rckl_ur',height:.1194,body:[.076,.087,.075],jaws:3,stroke:.005,closedR:.015,finger:[.010,.014,.0264],mass:1.1},
};
const flange=.018;
export function definition(sku){
 const v=V[sku], links=[], joints=[], body=group();
 cylinder(body,'robot_flange_clamp_ring',.038,flange,[0,0,flange/2],silver);      // common CKD robot flange, Ø76
 cylinder(body,'indicator_ring',.0385,.003,[0,0,flange+.0015],teal);
 box(body,'housing',[v.body[0],v.body[1],v.body[2]-.003],[0,0,flange+.003+(v.body[2]-.003)/2],dark);
 box(body,'connector',[.014,.016,.012],[v.body[0]/2+.006,0,flange+.020],dark);
 links.push({name:'mount',visual:body,collisions:[cc(.038,flange,[0,0,flange/2]),cb(v.body,[0,0,flange+v.body[2]/2])]});
 const jawTop=flange+v.body[2], tipZ=v.height;
 const dirs=v.jaws===2?[['left',-1],['right',1]]:[['jaw_1',0],['jaw_2',2*Math.PI/3],['jaw_3',4*Math.PI/3]];
 for(const [i,[name,d]] of dirs.entries()){
  const f=group();
  let origin, axis, xi;
  if(v.jaws===2){ xi=d*v.gapClosed/2; origin=[0,0,0]; axis=[d,0,0];
    box(f,'base_jaw',[v.finger[0]+.004,v.finger[1]+.004,.008],[xi+d*(v.finger[0]+.004)/2,0,jawTop+.004],silver);
    box(f,'finger',v.finger,[xi+d*v.finger[0]/2,0,tipZ-v.finger[2]/2],dark);
    links.push({name:name+'_jaw',visual:f,collisions:[cb([v.finger[0]+.004,v.finger[1]+.004,.008],[xi+d*(v.finger[0]+.004)/2,0,jawTop+.004]),cb(v.finger,[xi+d*v.finger[0]/2,0,tipZ-v.finger[2]/2])]});
    links.push({name:name+'_contact'});joints.push(fixed(name+'_contact_joint',name+'_jaw',name+'_contact',[xi,0,tipZ-.010]));
  } else { // radial jaws: local +X points outward from the axis
    links.push({name:name+'_origin'});joints.push(fixed(name+'_origin_joint','mount',name+'_origin',[0,0,0],[0,0,d]));
    xi=v.closedR; origin=[0,0,0]; axis=[1,0,0];
    box(f,'base_jaw',[.012,v.finger[1]+.004,.008],[xi+.006,0,jawTop+.004],silver);
    box(f,'finger',v.finger,[xi+v.finger[0]/2,0,tipZ-v.finger[2]/2],dark);
    links.push({name:name,visual:f,collisions:[cb([.012,v.finger[1]+.004,.008],[xi+.006,0,jawTop+.004]),cb(v.finger,[xi+v.finger[0]/2,0,tipZ-v.finger[2]/2])]});
    links.push({name:name+'_contact'});joints.push(fixed(name+'_contact_joint',name,name+'_contact',[xi,0,tipZ-.010]));
  }
  const child=v.jaws===2?name+'_jaw':name, parent=v.jaws===2?'mount':name+'_origin';
  joints.push({name:i===0?'finger_joint':`${name}_mimic_joint`,type:'prismatic',parent,child,axis,limit:{lower:0,upper:v.stroke,velocity:.05,effort:v.jaws===2?(sku==='rlsh-ur'?42:85):125},...(i===0?{}:{mimic:{joint:'finger_joint',multiplier:1,offset:0}})});
 }
 links.push({name:'tcp'});joints.push(fixed('tcp_joint','mount','tcp',[0,0,tipZ-.010]));
 return{name:v.name,links,joints};
}
