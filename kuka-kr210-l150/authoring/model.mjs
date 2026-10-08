/** CC0 authored shells. Numeric ROS-I joint coordinates only; no imported CAD. */
import * as THREE from 'three';
import {addMesh, namedMaterial, roundedBox, cylinderZ, ringGeometry}
  from '@botrail/authoring/geometry.mjs';

import {casting, profile} from './casting.mjs';

// ROS-I kr210l150_macro.xacro @ 54444a29c50fee342efd4f76c00265fa02c4155a.
// Preserve r1's planning convention; these are not calibrated controller data.
export const origins = [
  [-0.00262,0.00097586,0.33099], [0.35277,-0.037476,0.4192],
  [-0.000098483,-0.1475,1.2499], [0.95795,0.184,-0.055059],
  [0.542,0,0], [0.1925,0,0],
];
export const limitsDeg = [[-185,185],[-45,85],[-210,65],[-350,350],[-125,125],[-350,350]];
export const speedsDeg = [123,115,112,179,172,219]; // community planning limits, not rated-load speeds
const orange=namedMaterial('kuka_orange','#ed6b21',0.12,0.48);
const dark=namedMaterial('motor_graphite','#292b2d',0.25,0.55);
const steel=namedMaterial('flange_steel','#b1b4b7',0.75,0.32);
const black=namedMaterial('joint_seal','#121416',0.0,0.8);
const box=(size,xyz)=>({kind:'box',size,xyz});
const cyl=(radius,length,xyz,rpy=[0,0,0])=>({kind:'cylinder',radius,length,xyz,rpy});
const G=()=>new THREE.Group();
const fixed=(name,parent,child,xyz=[0,0,0],rpy=[0,0,0])=>({name,type:'fixed',parent,child,xyz,rpy});

// Cast-envelope coordinates below are independently estimated from photographs
// of a nameplate-verified floor-mounted KR 210 L150-2, not measured CAD data.
// See provenance.json. No mounting-hole or bolt-fit accuracy is claimed.
function housing(g,name,at,radius,width,material=orange,axis='y') {
  const shape=cylinderZ(radius,width,{radial:64});
  if(axis==='y') shape.rotateX(Math.PI/2);
  if(axis==='x') shape.rotateY(Math.PI/2);
  return addMesh(g,name,shape,material,at);
}
function shell(g,name,size,at,material=orange,radius=0.02) {
  return addMesh(g,name,roundedBox(size,radius,3),material,at);
}
function sideShape(points) {
  const shape=new THREE.Shape();shape.moveTo(...points[0]);
  for(const p of points.slice(1)) shape.lineTo(...p);shape.closePath();return shape;
}
export const balancerAnchors={
  // Visual estimates only. rear is in link_1, moving is in link_2.
  rear:[-0.40,0.135,0.245], moving:[-0.265,0.172476,-0.105],
  barrelLength:0.38, barrelRadius:0.127,
};

export function definition() {
  const base=G();
  // Flared orange mounting rim and black tapered A1 skirt seen on the exact unit.
  casting(base,'flared_mounting_rim',[
    [0.006,0,0,.431,.412,2.65],[.015,0,0,.449,.430,2.65],
    [.053,0,0,.449,.430,2.65],[.075,0,0,.408,.395,2.5],
    [.093,0,0,.383,.371,2.15],
  ],orange);
  casting(base,'a1_tapered_skirt',[
    [.085,0,0,.383,.371,2],[.10,0,0,.378,.367,2],
    [.275,0,0,.328,.324,2],[.314,0,0,.324,.320,2],
  ],dark);
  housing(base,'a1_seal',[0,0,.322],.321,.018,black,'z');
  // Raised casting pads suggest the four foot zones. Holes are deliberately
  // omitted: the reference photos do not establish an installation interface.
  for(let i=0;i<4;i++) {
    const a=Math.PI/4+i*Math.PI/2;
    const pad=shell(base,`mounting_rim_pad_${i}`,[.17,.077,.038],
      [.375*Math.cos(a),.375*Math.sin(a),.065],orange,.012);
    pad.rotation.z=a+Math.PI/2;
  }

  const column=G();
  housing(column,'rotating_table',[0,0,.012],.367,.042,orange,'z');
  casting(column,'rotating_table_upper',[
    [.028,0,0,.350,.340,2],[.060,.025,0,.338,.320,2.4],
    [.090,.035,0,.302,.292,3],
  ],orange);
  const shoulder=new THREE.Shape();
  shoulder.moveTo(-.30,.075);shoulder.lineTo(.34,.075);
  shoulder.bezierCurveTo(.54,.08,.605,.245,.584,.435);
  shoulder.bezierCurveTo(.573,.575,.488,.652,.358,.655);
  shoulder.bezierCurveTo(.232,.657,.153,.563,.125,.445);
  shoulder.bezierCurveTo(.087,.300,-.063,.180,-.30,.168);shoulder.closePath();
  profile(column,'curved_shoulder_casting',shoulder,.30,.10,orange,.016);
  housing(column,'a2_fixed_bearing',origins[1],.233,.29,orange);
  housing(column,'a2_bearing_seal',[.35277,.125,.4192],.205,.019,black);
  housing(column,'a2_reducer_cover',[.35277,.15,.4192],.190,.030,orange);
  shell(column,'a2_drive_mount',[.225,.055,.218],[.35277,.190,.4192],orange,.014);
  shell(column,'a2_drive_body',[.177,.193,.177],[.35277,.305,.4192],dark,.021);
  housing(column,'a2_drive_end',[.35277,.410,.4192],.073,.030,dark);
  shell(column,'rear_connection_cover',[.19,.15,.16],[-.295,.20,.10],dark,.016);
  const bracket=sideShape([[-.49,.065],[-.23,.065],[-.390,.293],[-.425,.293]]);
  for(const y of [-.016,.286]) {
    profile(column,`balancer_rear_bracket_${y<0?'near':'far'}`,bracket,.025,y,orange,.007);
    housing(column,`balancer_rear_pin_${y<0?'near':'far'}`,[-.40,y,.245],.042,.039,dark);
  }

  const upper=G();
  housing(upper,'a2_rotating_hub',[0,-.086,0],.223,.260,orange);
  housing(upper,'a2_outer_seal',[0,-.226,0],.196,.016,black);
  housing(upper,'a2_outer_cover',[0,-.238,0],.185,.016,orange);
  // Broad flat-sided beam with a bulged shoulder, narrowing web, and elbow head.
  casting(upper,'link_arm_casting',[
    [-.055,-.010,-.11,.207,.111,3.1],[.035,-.015,-.11,.221,.120,3.4],
    [.16,-.026,-.112,.216,.118,3.7],[.33,-.030,-.118,.175,.101,4.5],
    [.70,-.025,-.132,.146,.090,4.6],[1.08,-.012,-.146,.132,.079,4.0],
    [1.23,0,-.1475,.157,.086,3.3],[1.31,0,-.1475,.124,.078,2.5],
  ],orange);
  const crescent=new THREE.Shape();
  crescent.moveTo(-.305,-.12);
  crescent.bezierCurveTo(-.355,-.105,-.316,.092,-.25,.232);
  crescent.bezierCurveTo(-.204,.332,-.169,.397,-.151,.48);
  crescent.lineTo(-.139,1.080);
  crescent.bezierCurveTo(-.173,1.197,-.149,1.328,-.044,1.354);
  crescent.bezierCurveTo(.076,1.386,.156,1.307,.146,1.209);
  crescent.lineTo(.109,.48);
  crescent.bezierCurveTo(.145,.324,.258,.165,.244,.012);
  crescent.bezierCurveTo(.24,-.1,.224,-.177,.175,-.205);
  crescent.bezierCurveTo(.14,-.03,.047,.069,-.087,.064);
  crescent.bezierCurveTo(-.200,.057,-.262,-.026,-.270,-.106);
  crescent.bezierCurveTo(-.274,-.124,-.288,-.134,-.305,-.12);crescent.closePath();
  profile(upper,'continuous_arm_face_and_open_crescent',crescent,.035,-.241,orange,.009);
  const lug=sideShape([[-.29,-.12],[-.23,-.15],[-.16,.015],[-.24,.07]]);
  profile(upper,'balancer_moving_clevis',lug,.055,.172476,orange,.008);
  housing(upper,'balancer_moving_pin',balancerAnchors.moving,.043,.079,dark);
  housing(upper,'a3_bearing',origins[2],.174,.25,orange);
  housing(upper,'a3_outer_cover',[0,-.282,1.2499],.140,.016,orange);
  housing(upper,'a3_drive_adapter',[0,.035,1.2499],.130,.065,orange);
  housing(upper,'a3_drive_body',[0,.170,1.2499],.112,.205,dark);
  shell(upper,'a3_drive_rear_cover',[.16,.035,.16],[0,.291,1.2499],dark,.017);

  const elbow=G();
  housing(elbow,'elbow_hub',[0,.08,0],.172,.215,orange);
  // Three rear-facing motor bodies, separately legible in the exact-unit photos.
  for(const [i,z] of [.178,0,-.178].entries()) {
    shell(elbow,`elbow_motor_mount_${i}`,[.053,.187,.15],[-.118,.20,z],orange,.012);
    shell(elbow,`elbow_motor_${i}`,[.270,.155,.139],[-.280,.20,z],dark,.016);
    shell(elbow,`elbow_motor_end_${i}`,[.027,.166,.145],[-.426,.20,z],dark,.008);
  }
  // Standard cast forearm followed by the L150-2's observed 400 mm extension.
  casting(elbow,'forearm_casting',[
    [.035,.175,-.017,.154,.183,2.7],[.115,.184,-.034,.159,.183,2.6],
    [.245,.184,-.050,.137,.155,2.3],[.400,.184,-.055059,.118,.128,2.05],
    [.520,.184,-.055059,.112,.116,2],
  ],orange,'x');
  housing(elbow,'extension_root_ring',[.545,.184,-.055059],.139,.034,orange,'x');
  housing(elbow,'l150_extension_tube',[.746,.184,-.055059],.131,.368,orange,'x');
  housing(elbow,'extension_end_ring',[.939,.184,-.055059],.140,.024,orange,'x');
  housing(elbow,'a4_seal',origins[3],.132,.014,black,'x');

  const forearm=G();
  housing(forearm,'a4_rotating_collar',[.021,0,0],.135,.028,orange,'x');
  casting(forearm,'wrist_drive_neck',[
    [.035,0,0,.126,.126,2],[.10,0,0,.121,.120,2],
    [.19,0,0,.113,.106,2.2],[.265,0,.017,.097,.089,2.7],
    [.33,0,.040,.083,.067,3],
  ],orange,'x');
  const wristCheek=new THREE.Shape();
  wristCheek.moveTo(.195,-.081);wristCheek.lineTo(.463,-.122);
  wristCheek.bezierCurveTo(.52,-.158,.618,-.140,.661,-.065);
  wristCheek.bezierCurveTo(.716,.037,.640,.146,.542,.145);
  wristCheek.bezierCurveTo(.475,.151,.414,.110,.373,.108);
  wristCheek.lineTo(.190,.105);wristCheek.closePath();
  for(const [label,y] of [['near',-.123],['far',.123]])
    profile(forearm,`wrist_fork_${label}`,wristCheek,.036,y,orange,.009);
  housing(forearm,'wrist_side_seal',[.542,-.147,0],.098,.014,black);
  housing(forearm,'wrist_side_cover',[.542,-.156,0],.088,.012,orange);

  const wrist=G();
  housing(wrist,'a5_housing',[0,0,0],.104,.207,orange);
  casting(wrist,'wrist_nose',[
    [.01,0,0,.092,.091,2],[.065,0,0,.082,.085,2.3],
    [.133,0,0,.083,.086,2.4],[.18,0,0,.096,.096,2],
  ],orange,'x');
  housing(wrist,'a6_seal',[.183,0,0],.102,.015,black,'x');
  const flange=G();
  // Public 2007 KUKA datasheet: 200 OD, 100 x 8-deep pilot recess,
  // six M10 x 14-deep holes on 160 PCD and one 10 x 10-deep locator.
  // Smooth nominal bores, no modeled thread/tolerance or calibrated clocking.
  const boltHoles=Array.from({length:6},(_,i)=>{
    const a=i*Math.PI/3;return [-.080*Math.sin(a),.080*Math.cos(a),.005];
  });
  const locator=[-.080,0,.005];
  const flangeLayer=(name,start,end,inner,holes)=>{
    const g=ringGeometry(.10,inner,end-start,holes);g.rotateY(Math.PI/2);
    addMesh(flange,name,g,steel,[start,0,-.00023924]);
  };
  flangeLayer('flange_back',0,.0235,0,[]);
  flangeLayer('flange_threaded_bore_depth',.0235,.0275,0,boltHoles);
  flangeLayer('flange_locator_bore_depth',.0275,.0295,0,[...boltHoles,locator]);
  flangeLayer('flange_recess_and_face',.0295,.0375,.05,[...boltHoles,locator]);
  const links=[
    {name:'base_link',visual:base,collisions:[box([0.79,0.71,0.085],[0,0,0.0425]),cyl(0.32,0.23,[0,0,0.20])]},
    {name:'link_1',visual:column,collisions:[box([0.50,0.46,0.34],[0.10,0,0.19]),cyl(0.20,0.42,origins[1],[Math.PI/2,0,0])]},
    {name:'link_2',visual:upper,collisions:[box([0.34,0.30,1.10],[0,-0.12,0.625])]},
    {name:'link_3',visual:elbow,collisions:[box([0.82,0.31,0.30],[0.46,0.15,-0.03])]},
    {name:'link_4',visual:forearm,collisions:[cyl(0.115,0.49,[0.25,0,0],[0,Math.PI/2,0])]},
    {name:'link_5',visual:wrist,collisions:[cyl(0.10,0.16,[0.08,0,0],[0,Math.PI/2,0])]},
    {name:'link_6',visual:flange,collisions:[cyl(0.10,0.0375,[0.01875,0,-0.00023924],[0,Math.PI/2,0])]},
    {name:'tool0'},{name:'flange'},{name:'Link1'},
  ];
  const axes=[[0,0,1],[0,1,0],[0,1,0],[1,0,0],[0,1,0],[1,0,0]];
  const joints=origins.map((xyz,i)=>({name:`joint_a${i+1}`,type:'revolute',
    parent:i===0?'base_link':`link_${i}`,child:`link_${i+1}`,xyz,axis:axes[i],
    limit:{lower:limitsDeg[i][0]*Math.PI/180,upper:limitsDeg[i][1]*Math.PI/180,velocity:speedsDeg[i]*Math.PI/180}}));
  joints.push(fixed('link_6_tool0','link_6','tool0',[0.0375,0,-0.00023924]),
    fixed('flange_joint','tool0','flange',[0,0,0],[0,Math.PI/2,0]),fixed('Link1_link_1','link_1','Link1'));
  return {name:'kuka_kr210_l150_reference',links,joints};
}
