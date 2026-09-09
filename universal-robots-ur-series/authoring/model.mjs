/** UR8 Long / UR15 / UR18 / UR20 / UR30, independently authored shells.
 * Joint translations are published UR default kinematics at 89bbe795f38a7ab00fb66fe8831dfff79dc99edf.
 * Shell radii, bevels and finish are visual approximations, never clearance proof.
 */
import * as THREE from 'three';
import {addMesh, namedMaterial, cylinderZ, cylinderBetween, ringGeometry} from '@botrail/authoring/geometry.mjs';

export const dimensions = {
  ur8long: {d1:.2186,a2:.8989,a3:.7149,d4:.1824,d5:.1361,d6:.1434,large:false},
  ur15: {d1:.2186,a2:.6475,a3:.5164,d4:.1824,d5:.1361,d6:.1434,large:false},
  ur18: {d1:.2186,a2:.475,a3:.3389,d4:.1824,d5:.1361,d6:.1434,large:false},
  ur20: {d1:.2363,a2:.862,a3:.7287,d4:.201,d5:.1593,d6:.1543,large:true},
  ur30: {d1:.2363,a2:.637,a3:.5037,d4:.201,d5:.1593,d6:.1543,large:true},
};
const silver = namedMaterial('satin_aluminium', '#afb6bd', .7, .3);
const graphite = namedMaterial('joint_graphite', '#343e48', .45, .38);
const blue = namedMaterial('actuator_blue', '#78b5d5', .2, .35);
const steel = namedMaterial('flange_steel', '#c4c8ca', .85, .28);
const cyl = (group,name,r,h,at,mat) => addMesh(group,name,cylinderZ(r,h,{radial:48}),mat,at);
const group = name => {const g = new THREE.Group();g.name=name;return g;};
const collision = (r,l,xyz) => ({kind:'cylinder',radius:r,length:l,xyz});

export function definition(type = 'ur20') {
  const p=dimensions[type]; if (!p) throw new Error(`Unknown UR model: ${type}`);
  const radius=p.large?.088:.074, wrist=p.large?.061:.052, offset=p.large?.215:.19;
  const links=[];
  function link(name,build,collisions) {const visual=group(name);build(visual);links.push({name,visual,collisions});}
  link('base_link_inertia',g=>{
    cyl(g,'foot',p.large?.11:.098,.024,[0,0,.012],graphite);
    cyl(g,'pedestal',radius,.104,[0,0,.076],silver);
    cyl(g,'yaw_seal',radius+.002,.013,[0,0,.132],graphite);
  },[collision(p.large?.11:.098,.145,[0,0,.0725])]);
  link('shoulder_link',g=>{
    cyl(g,'yaw_housing',radius,.092,[0,0,-.05],silver);
    cyl(g,'service_cap',radius*.82,.006,[0,0,-.001],blue);
  },[collision(radius,.1,[0,0,-.046])]);
  link('upper_arm_link',g=>{
    for (const [i,x] of [0,-p.a2].entries()) {
      cyl(g,`joint_${i}`,radius,offset+.032,[x,0,offset/2],silver);
      cyl(g,`joint_ring_${i}`,radius+.001,.014,[x,0,offset+.015],graphite);
      cyl(g,`cap_${i}`,radius*.9,.009,[x,0,offset+.026],blue);
    }
    cylinderBetween(g,'upper_tube',[-radius*.45,0,offset*.78],[-p.a2+radius*.45,0,offset*.78],radius*.69,silver,{radial:48});
    for (const [i,x] of [-radius,-p.a2+radius].entries())
      cylinderBetween(g,`tube_collar_${i}`,[x-.012,0,offset*.78],[x+.012,0,offset*.78],radius*.73,graphite,{radial:48});
  },[collision(radius,offset+.05,[0,0,offset/2]),collision(radius,offset+.05,[-p.a2,0,offset/2]),
    {...collision(radius*.7,p.a2,[-p.a2/2,0,offset*.78]),rpy:[0,Math.PI/2,0]}]);
  link('forearm_link',g=>{
    cyl(g,'elbow',radius*.8,.104,[0,0,.022],silver);
    cyl(g,'elbow_seal',radius*.8,.012,[0,0,-.034],graphite);
    cylinderBetween(g,'forearm_tube',[-radius*.4,0,.043],[-p.a3+wrist*.4,0,.043],wrist*.78,silver,{radial:48});
    cyl(g,'wrist_support',wrist,p.d4-.005,[-p.a3,0,p.d4/2],silver);
    cyl(g,'elbow_cap',radius*.72,.009,[0,0,-.044],blue);
  },[collision(radius*.8,.12,[0,0,.018]),{...collision(wrist*.8,p.a3,[-p.a3/2,0,.043]),rpy:[0,Math.PI/2,0]},collision(wrist,p.d4,[-p.a3,0,p.d4/2])]);
  link('wrist_1_link',g=>{
    cyl(g,'wrist_axis',wrist,.07,[0,0,-.022],silver);
    cyl(g,'wrist_ring',wrist+.001,.008,[0,0,.018],graphite);
    cyl(g,'wrist_cap',wrist*.9,.007,[0,0,.026],blue);
    cylinderBetween(g,'wrist_bridge',[0,0,0],[0,-p.d5,0],wrist*.77,silver,{radial:48});
  },[collision(wrist,.08,[0,0,-.018]),{...collision(wrist*.78,p.d5,[0,-p.d5/2,0]),rpy:[Math.PI/2,0,0]}]);
  link('wrist_2_link',g=>{
    cyl(g,'wrist_axis',wrist,.064,[0,0,-.019],silver);
    cyl(g,'wrist_ring',wrist+.001,.008,[0,0,.017],graphite);
    cyl(g,'wrist_cap',wrist*.9,.007,[0,0,.025],blue);
    cylinderBetween(g,'tool_bridge',[0,0,-.019],[0,p.d6,-.019],wrist*.67,silver,{radial:48});
  },[collision(wrist,.073,[0,0,-.016]),{...collision(wrist*.68,p.d6,[0,p.d6/2,-.019]),rpy:[Math.PI/2,0,0]}]);
  link('wrist_3_link',g=>{
    const r=p.large?.045:.0315, pcd=p.large?.04:.025, count=p.large?6:4, hole=p.large?.004:.003;
    cyl(g,'tool_seal',r+.006,.025,[0,0,-.03],graphite);
    // ISO bolt pitch is factual; screw threads, dowel and tolerances are omitted.
    const holes=Array.from({length:count},(_,i)=>[pcd*Math.cos(i*2*Math.PI/count),pcd*Math.sin(i*2*Math.PI/count),hole]);
    addMesh(g,'tool_face',ringGeometry(r,.008,.017,holes),steel,[0,0,-.017]);
  },[collision(p.large?.051:.0375,.043,[0,0,-.0215])]);
  // Browser reference tree only; the catalog uses the complete official BSD macro,
  // including physical parameters, limits, tiny calibrated rotations and tool0.
  links.push({name:'base_link'},{name:'tool0'});
  const joints=[
    {name:'base_link_inertia_joint',type:'fixed',parent:'base_link',child:'base_link_inertia',rpy:[0,0,Math.PI]},
    {name:'shoulder_pan_joint',type:'revolute',parent:'base_link_inertia',child:'shoulder_link',xyz:[0,0,p.d1]},
    {name:'shoulder_lift_joint',type:'revolute',parent:'shoulder_link',child:'upper_arm_link',rpy:[Math.PI/2,0,0]},
    {name:'elbow_joint',type:'revolute',parent:'upper_arm_link',child:'forearm_link',xyz:[-p.a2,0,0]},
    {name:'wrist_1_joint',type:'revolute',parent:'forearm_link',child:'wrist_1_link',xyz:[-p.a3,0,p.d4]},
    {name:'wrist_2_joint',type:'revolute',parent:'wrist_1_link',child:'wrist_2_link',xyz:[0,-p.d5,0],rpy:[Math.PI/2,0,0]},
    {name:'wrist_3_joint',type:'revolute',parent:'wrist_2_link',child:'wrist_3_link',xyz:[0,p.d6,0],rpy:[Math.PI/2,Math.PI,Math.PI]},
    {name:'tool0_joint',type:'fixed',parent:'wrist_3_link',child:'tool0'},
  ];
  return {name:type,links,joints};
}
