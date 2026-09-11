/** UR8 Long / UR15 / UR18 / UR20 / UR30, independently authored shells.
 * Joint translations are published UR default kinematics at 89bbe795f38a7ab00fb66fe8831dfff79dc99edf.
 * Shell radii, bevels and finish are visual approximations, never clearance proof.
 */
import * as THREE from 'three';
import {addMesh, cylinderZ, ringGeometry} from '@botrail/authoring/geometry.mjs';
import {finishes, barrel, cover, armTube, armEnd, baseSkirt} from './visual.mjs';

export const dimensions = {
  ur8long: {d1:.2186,a2:.8989,a3:.7149,d4:.1824,d5:.1361,d6:.1434,large:false},
  ur15: {d1:.2186,a2:.6475,a3:.5164,d4:.1824,d5:.1361,d6:.1434,large:false},
  ur18: {d1:.2186,a2:.475,a3:.3389,d4:.1824,d5:.1361,d6:.1434,large:false},
  ur20: {d1:.2363,a2:.862,a3:.7287,d4:.201,d5:.1593,d6:.1543,large:true},
  ur30: {d1:.2363,a2:.637,a3:.5037,d4:.201,d5:.1593,d6:.1543,large:true},
};
// Public footprint / tool-face dimensions, plus explicit photo-based shell estimates.
// See README for source URLs and the boundary between facts and approximations.
export const appearance = {
  small: {baseRadius:.102,basePitch:.090,neck:.078,shoulder:.089,elbow:.068,wrist:.050,
    upperPlane:.142,forearmPlane:.041,faceRadius:.0315,faceBore:.01575,toolHousing:.045},
  large: {baseRadius:.1225,basePitch:.105,neck:.091,shoulder:.102,elbow:.081,wrist:.058,
    upperPlane:.155,forearmPlane:.044,faceRadius:.050,faceBore:.025,toolHousing:.050},
};
const {aluminium:silver,housing,seal:graphite,steel,indicator}=finishes;
const cyl = (g,n,r,h,at,mat) => addMesh(g,n,cylinderZ(r,h,{radial:64}),mat,at);
const boltCircle = (pitch,count,radius,phase=0) => Array.from({length:count},(_,i)=>{
  const a=phase+i*2*Math.PI/count;return [pitch*Math.cos(a),pitch*Math.sin(a),radius];
});
const group = name => {const g = new THREE.Group();g.name=name;return g;};
const collision = (r,l,xyz) => ({kind:'cylinder',radius:r,length:l,xyz});

export function definition(type = 'ur20') {
  const p=dimensions[type]; if (!p) throw new Error(`Unknown UR model: ${type}`);
  const radius=p.large?.088:.074, wrist=p.large?.061:.052, offset=p.large?.215:.19;
  const v=appearance[p.large?'large':'small'];
  const links=[];
  function link(name,build,collisions) {const visual=group(name);build(visual);links.push({name,visual,collisions});}
  link('base_link_inertia',g=>{
    // Nominal footprint is factual. Plate thickness, access bores and skirt are estimates.
    addMesh(g,'base_mounting_plate',ringGeometry(v.baseRadius,.040,.017,
      boltCircle(v.basePitch,6,.0055)),silver);
    baseSkirt(g,v.baseRadius-.002,v.neck,.082,.017);
    barrel(g,'base_core',v.neck-.009,.071,[0,0,.048],housing,.006);
    barrel(g,'indicator_lower_seal',v.neck,.004,[0,0,.082],graphite,.001);
    barrel(g,'base_status_ring',v.neck,.007,[0,0,.0875],indicator,.001);
    barrel(g,'yaw_seal',v.neck,.017,[0,0,.0995],graphite,.001);
  },[collision(p.large?.11:.098,.145,[0,0,.0725])]);
  link('shoulder_link',g=>{
    const lower=.109-p.d1,upper=v.shoulder*.76;
    barrel(g,'yaw_housing',v.neck,upper-lower,[0,0,(lower+upper)/2],housing,.012);
    barrel(g,'yaw_service_lid',v.neck*.88,.005,[0,0,upper],housing,.002);
    // Bearing seat aligns the perpendicular shoulder joint to its unchanged origin.
    barrel(g,'shoulder_bearing_seat',v.shoulder*.84,.056,[0,-.020,0],housing,.009,[0,1,0]);
  },[collision(radius,.1,[0,0,-.046])]);
  link('upper_arm_link',g=>{
    const z=v.upperPlane, shoulder=v.shoulder, elbow=v.elbow;
    armEnd(g,'shoulder',shoulder,-.012,z+shoulder*.90,0,z,-1);
    cover(g,'shoulder_cap',shoulder*.77,[0,0,z+shoulder*.90]);
    armEnd(g,'upper_elbow',elbow,.039,z+elbow*.96,-p.a2,z,1);
    cover(g,'upper_elbow_cap',elbow*.82,[-p.a2,0,z+elbow*.96]);
    armTube(g,'upper_tube',[-shoulder*1.5,0,z],[-p.a2+elbow*1.5,0,z],shoulder*.965,elbow*.965);
  },[collision(radius,offset+.05,[0,0,offset/2]),collision(radius,offset+.05,[-p.a2,0,offset/2]),
    {...collision(radius*.7,p.a2,[-p.a2/2,0,offset*.78]),rpy:[0,Math.PI/2,0]}]);
  link('forearm_link',g=>{
    const r=v.elbow,z=v.forearmPlane,w=v.wrist;
    armEnd(g,'forearm_elbow',r,-.039,.102,0,z,-1);
    cover(g,'elbow_cap',r*.82,[0,0,-.040],-1);
    barrel(g,'elbow_bearing_seam',r*.89,.005,[0,0,.102],graphite,.001);
    armEnd(g,'forearm_wrist',w,-.015,p.d4+.018,-p.a3,z,1);
    cover(g,'forearm_wrist_cap',w*.97,[-p.a3,0,-.017],-1,true);
    armTube(g,'forearm_tube',[-r*1.5,0,z],[-p.a3+w*1.5,0,z],r*.965,w*.965);
  },[collision(radius*.8,.12,[0,0,.018]),{...collision(wrist*.8,p.a3,[-p.a3/2,0,.043]),rpy:[0,Math.PI/2,0]},collision(wrist,p.d4,[-p.a3,0,p.d4/2])]);
  link('wrist_1_link',g=>{
    const w=v.wrist;
    barrel(g,'wrist_axis',w,.093,[0,0,-.022],housing,w*.24);
    cover(g,'wrist_cap',w*.97,[0,0,.026],1,true);
    barrel(g,'wrist_bridge',w*.93,p.d5-.012,[0,-p.d5/2,0],housing,w*.44,[0,1,0]);
    barrel(g,'wrist_output_seal',w*.935,.009,[0,-p.d5+.019,0],graphite,.001,[0,1,0]);
  },[collision(wrist,.08,[0,0,-.018]),{...collision(wrist*.78,p.d5,[0,-p.d5/2,0]),rpy:[Math.PI/2,0,0]}]);
  link('wrist_2_link',g=>{
    const w=v.wrist;
    barrel(g,'wrist_axis',w,.086,[0,0,-.017],housing,w*.24);
    cover(g,'wrist_cap',w*.97,[0,0,.028],1,true);
    barrel(g,'tool_bridge',w*.91,p.d6-.044,[0,(p.d6-.044)/2,-.017],housing,w*.45,[0,1,0]);
    barrel(g,'tool_bearing_seal',v.toolHousing,.008,[0,p.d6-.055,0],graphite,.001,[0,1,0]);
  },[collision(wrist,.073,[0,0,-.016]),{...collision(wrist*.68,p.d6,[0,p.d6/2,-.019]),rpy:[Math.PI/2,0,0]}]);
  link('wrist_3_link',g=>{
    // Tool0 contact stays at z=0. The central register is a recess, not a through bore.
    const r=v.faceRadius,pcd=p.large?.04:.025,count=p.large?6:4,hole=p.large?.004:.003;
    const phase=p.large?0:Math.PI/4;
    const holes=boltCircle(pcd,count,hole,phase);
    holes.push([0,pcd,p.large?.004:.003]); // Published locating-hole position, no tolerance fit.
    barrel(g,'tool_sensor_housing',v.toolHousing,.040,[0,0,-.036],silver,.004);
    barrel(g,'tool_seal',v.toolHousing+.0005,.005,[0,0,-.057],graphite,.001);
    addMesh(g,'tool_face',ringGeometry(r,v.faceBore,.016,holes),steel,[0,0,-.016]);
    cyl(g,'tool_register_floor',v.faceBore,.003,[0,0,-.0077],steel);
    // Small M8 tool-I/O socket on the side; pin placement is an illustrative estimate.
    const socket=new THREE.Group();socket.name='tool_io';socket.position.set(v.toolHousing,0,-.035);
    socket.rotation.y=Math.PI/2;g.add(socket);
    addMesh(socket,'tool_io_rim',ringGeometry(.0055,.004,.003),steel);
    cyl(socket,'tool_io_insert',.0038,.001,[0,0,.001],graphite);
    for(const [i,[x,y]] of boltCircle(.0026,8,0).entries())
      cyl(socket,`tool_io_contact_${i}`,.00032,.0008,[x,y,.0017],steel);
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
