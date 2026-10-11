/** Independent AGIBOT G1 / original OmniPicker visual study. CC0-1.0.
 * Public product photographs and three published envelope values only.
 * NO vendor mesh, URDF, USD, CAD, or kinematic data are used in this model.
 * All articulation, collisions, part dimensions and mounting positions are estimates.
 * SI metres, Z up, front +X, left +Y. NOT a dynamics or hardware-control model.
 */
import * as T from 'three';
import {namedMaterial,addMesh,roundedBox,cylinderZ,cylinderBetween,tubeGeometry} from '../../authoring/geometry.mjs';
export const dimensions=Object.freeze({heightLow:1.30,heightHigh:1.80,liftStroke:.50,nominalArmReach:.70,gripperStroke:.120,baseLength:.65,baseWidth:.52,upperArm:.265,forearm:.235,wrist:.032,hand:.168});
const M={white:namedMaterial('pearl_white_shell',0xe9eae7,.12,.30),grey:namedMaterial('satin_grey_shell',0x9ea3a3,.22,.43),dark:namedMaterial('graphite_structure',0x25292b,.18,.43),black:namedMaterial('black_glass_face',0x111619,.12,.19),rubber:namedMaterial('dark_rubber',0x151919,0,.72),metal:namedMaterial('machined_metal',0xb8bec2,.8,.29),led:namedMaterial('cyan_status_lens',0x28c2c8,.15,.25),red:namedMaterial('red_emergency_stop',0xd22825,.06,.4),green:namedMaterial('green_control_lens',0x47ba62,.1,.3)};
export const materialProperties=Object.fromEntries(Object.values(M).map(m=>[m.name,{metalness:m.metalness,roughness:m.roughness}]));
const group=()=>new T.Group();
function box(g,n,s,p,m=M.white,r=.008){return addMesh(g,n,roundedBox(s,Math.min(r,...s.map(v=>v/2)),3),m,p);}
function cyl(g,n,r,h,p,m=M.metal,axis='z'){const o=addMesh(g,n,cylinderZ(r,h,{radial:32}),m,p);if(axis==='x')o.rotation.y=Math.PI/2;if(axis==='y')o.rotation.x=Math.PI/2;return o;}
function ell(g,n,s,p,m=M.white){const geo=new T.SphereGeometry(1,32,20);geo.scale(...s);return addMesh(g,n,geo,m,p);}
function line(g,n,a,b,r=.004,m=M.dark){return cylinderBetween(g,n,a,b,r,m,{radial:12});}
/** Closed cross-section loft. Rings counter-clockwise from above, outward winding. */
export function loft(rings,segments=48,power=3){const v=[],f=[];for(const [z,rx,ry,cx=0] of rings)for(let i=0;i<segments;i++){const a=2*Math.PI*i/segments,c=Math.cos(a),s=Math.sin(a);v.push(cx+rx*Math.sign(c)*Math.abs(c)**(2/power),ry*Math.sign(s)*Math.abs(s)**(2/power),z);}
for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){const a=j*segments+i,b=j*segments+(i+1)%segments,c=b+segments,d=a+segments;f.push(a,b,d,b,c,d);}
const low=v.length/3;v.push(rings[0][3]||0,0,rings[0][0]);const high=v.length/3;v.push(rings.at(-1)[3]||0,0,rings.at(-1)[0]);for(let i=0;i<segments;i++){f.push(low,(i+1)%segments,i);const a=(rings.length-1)*segments+i,b=(rings.length-1)*segments+(i+1)%segments;f.push(high,a,b);}
const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setIndex(f);geo.computeVertexNormals();return geo;}
function shell(g,n,rings,m=M.white,power=3){return addMesh(g,n,loft(rings,48,power),m);}
function screw(g,n,p,axis='x'){cyl(g,n,.0025,.0015,p,M.metal,axis);}
function baseVisual(detail=true){const g=group();
box(g,'continuous_floor_bumper',[.65,.52,.035],[0,0,.037],M.rubber,.016);
shell(g,'lower_mobile_chassis',[[.045,.322,.253],[.07,.325,.26],[.19,.319,.252],[.238,.29,.234]],M.white,5);
box(g,'dark_upper_belt',[.60,.49,.038],[0,0,.239],M.dark,.017);
for(const s of [-1,1]){cyl(g,`wheel_tyre_${s}`, .105,.046,[-.10,s*.254,.105],M.rubber,'y');cyl(g,`wheel_rim_${s}`,.073,.048,[-.10,s*.256,.105],M.dark,'y');cyl(g,`wheel_hub_${s}`,.049,.05,[-.10,s*.258,.105],M.grey,'y');}
box(g,'upper_platform_grey_lip',[.65,.52,.027],[0,0,.345],M.grey,.013);
box(g,'upper_platform_white_deck',[.648,.518,.021],[0,0,.368],M.white,.010);
for(const y of [-.17,.17])cyl(g,'deck_support_'+y,.022,.08,[.22,y,.293]);
box(g,'under_deck_structure',[.33,.33,.082],[-.14,0,.291],M.dark,.022);
// Tapered rear mast, with a dark recessed-looking front channel and two rails.
shell(g,'rear_mast',[[.378,.125,.153,-.147],[.43,.127,.155,-.147],[.70,.100,.146,-.153],[.92,.11,.146,-.16],[1.08,.135,.149,-.16],[1.16,.132,.146,-.16],[1.175,.119,.137,-.16]],M.white,5);
box(g,'mast_front_channel',[.014,.190,.74],[-.016,0,.785],M.dark,.006);
for(const s of [-1,1])box(g,'lift_rail_'+s,[.018,.014,.72],[-.006,s*.079,.785],M.metal,.004);
box(g,'rear_upper_panel',[.035,.253,.198],[-.283,0,1.065],M.grey,.006);
box(g,'rear_display_glass',[.014,.223,.128],[-.301,0,1.081],M.black,.005);
cyl(g,'stop_button_stem',.012,.012,[-.20,.095,1.18],M.metal);cyl(g,'emergency_stop',.021,.012,[-.20,.095,1.192],M.red);
if(detail){
for(const s of [-1,1]){box(g,'front_corner_light_'+s,[.014,.116,.014],[.302,s*.162,.223],M.white,.005);cyl(g,'front_ultrasonic_'+s,.010,.004,[.321,s*.185,.119],M.grey,'x');cyl(g,'rear_control_'+s,.008,.008,[-.293,s*.040,.974],M.green,'x');}
box(g,'front_depth_camera_border',[.013,.105,.028],[.328,0,.351],M.dark,.012);box(g,'front_depth_camera',[.014,.088,.015],[.334,0,.351],M.black,.006);
box(g,'rear_controls_support',[.020,.19,.038],[-.28,0,.974],M.white,.005);
box(g,'rear_service_hatch',[.008,.146,.12],[-.266,0,.505],M.grey,.004);

}return g;}
function cappedTube(points,radius){const geo=tubeGeometry(points,radius,{tubular:32,radial:8}),old=geo.attributes.position,v=[...old.array],idx=[...geo.index.array];for(const [ring,center,normal]of [[0,new T.Vector3(...points[0]),new T.Vector3(...points[0]).sub(new T.Vector3(...points[1]))],[32*9,new T.Vector3(...points.at(-1)),new T.Vector3(...points.at(-1)).sub(new T.Vector3(...points.at(-2)))]]){const ci=v.length/3;v.push(...center.toArray());for(let i=0;i<8;i++){let a=ring+i,b=ring+i+1;const aa=new T.Vector3().fromBufferAttribute(old,a).sub(center),bb=new T.Vector3().fromBufferAttribute(old,b).sub(center);if(aa.cross(bb).dot(normal)<0)[a,b]=[b,a];idx.push(ci,a,b);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return g;}
function torsoVisual(detail=true){const g=group();
shell(g,'flexible_waist',[[0,.080,.095],[.05,.080,.097],[.12,.073,.106],[.16,.087,.133]],M.dark,2.8);
shell(g,'sculpted_chest',[[.115,.083,.115],[.14,.097,.135],[.22,.109,.154],[.30,.102,.161],[.345,.083,.150],[.362,.06,.12]],M.white,3);
box(g,'rear_lift_carriage',[.07,.205,.29],[-.125,0,.145],M.dark,.014);
if(detail){
// Independent crescent-like chest trim, no copied logo artwork.
const pts=[];for(let i=0;i<=22;i++){const y=-.104+i*.208/22;const z=.226+.048*(1-(y/.104)**2),t=(z-.22)/.08,rx=.109+(.102-.109)*t,ry=.154+(.161-.154)*t,x=rx*Math.cbrt(1-(Math.abs(y)/ry)**3)-.001;pts.push([x,y,z]);}addMesh(g,'chest_arc_trim',cappedTube(pts,.005),M.dark);

}return g;}
function headVisual(detail=true){const g=group();
ell(g,'white_head_shell',[.105,.105,.127],[0,0,.127]);
// A closed convex black visor inset into the independently sculpted head.
ell(g,'black_face_shield',[.060,.097,.116],[.061,0,.131],M.black);
if(detail){box(g,'horizontal_camera_bar',[.035,.123,.023],[.121,0,.152],M.dark,.010);for(const s of [-1,1]){cyl(g,'bar_camera_'+s,.006,.003,[.139,s*.044,.152],M.black,'x');cyl(g,'face_camera_'+s,.008,.005,[.109,0,.131+s*.068],M.dark,'x');}}
return g;}
function limb(name,length,r0,r1,detail=true){const g=group();shell(g,name,[[ -length+.004,r1*.80,r1*.80],[-length+.008,r1,r1],[-length*.55,(r0+r1)/2,(r0+r1)/2],[-.008,r0,r0],[-.004,r0*.75,r0*.75]],M.white,2.6);if(detail){cyl(g,name+'_seam',r0*.95,.002,[0,0,-Math.min(.04,length*.45)],M.grey);}return g;}
function handVisual(detail=true){const g=group();cyl(g,'omnipicker_black_motor',.031,.038,[0,0,-.019],M.dark);cyl(g,'omnipicker_mount_rim',.033,.006,[0,0,-.038],M.metal);box(g,'omnipicker_palm',[.056,.082,.043],[0,0,-.06],M.white,.012);if(detail)for(const y of [-.028,.028])cyl(g,'palm_screw_'+y,.004,.002,[.029,y,-.06],M.metal,'x');return g;}
function adaptivePlate(g,name,x,side,offset,width){const shape=new T.Shape();for(let i=0;i<=10;i++){const u=.07*i/10,v=side*(offset+.010*Math.sin(Math.PI*i/10))+width/2;i?shape.lineTo(u,v):shape.moveTo(u,v);}for(let i=10;i>=0;i--){const u=.07*i/10,v=side*(offset+.010*Math.sin(Math.PI*i/10))-width/2;shape.lineTo(u,v);}shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:.005,bevelEnabled:true,bevelSize:.001,bevelThickness:.001,bevelSegments:2,steps:1});geo.rotateY(Math.PI/2);addMesh(g,name,geo,M.dark,[x-.0025,0,0]);}
function fingerDriveVisual(side){const g=group();for(const x of [-.019,.019]){adaptivePlate(g,'adaptive_primary_link_'+x,x,side,0,.010);adaptivePlate(g,'adaptive_parallel_link_'+x,x,side,.013,.007);for(const z of [0,-.07])for(const y of [0,side*.013])cyl(g,'finger_pivot_'+x+'_'+z+'_'+y,.006,.005,[x,y,z],M.metal,'x');}return g;}
function fingerTipVisual(side,detail=true){const g=group();box(g,'finger_white_tip',[.043,.016,.047],[0,-side*.012,-.024],M.white,.005);box(g,'finger_contact_pad',[.037,.008,.042],[0,-side*.021,-.025],M.rubber,.003);if(detail)for(let i=0;i<8;i++)box(g,'pad_rib_'+i,[.037,.0015,.0015],[0,-side*.025,-.008-i*.0045],M.dark,.0007);return g;}
export const openingAngle=Math.asin(.06/.07);
export const poses=Object.freeze({travel:{left_elbow:0,right_elbow:0,left_shoulder_roll:.08,right_shoulder_roll:-.08,left_gripper_open:.60,right_gripper_open:.60},raised:{lift:.50,left_elbow:.13,right_elbow:.13,left_shoulder_roll:.12,right_shoulder_roll:-.12,left_gripper_open:openingAngle,right_gripper_open:openingAngle},reach:{lift:.25,left_shoulder_pitch:-.65,right_shoulder_pitch:-.65,left_elbow:.68,right_elbow:.68,left_gripper_open:openingAngle,right_gripper_open:openingAngle},head_turn:{lift:.25,head_yaw:.55,head_pitch:.15,left_elbow:0,right_elbow:0,left_gripper_open:.35,right_gripper_open:.35}});
export function definition({detail=true}={}){const links=[],joints=[];const link=(name,visual,collisions=[])=>{links.push({name,visual,collisions});return name;};const joint=(name,parent,child,xyz,type='fixed',axis=[0,0,1],range=[0,0],extra={})=>joints.push({name,parent,child,xyz,type,axis,...(type==='fixed'?{}:{limit:{lower:range[0],upper:range[1],effort:1,velocity:1}}),...extra});const bc=(size,xyz)=>({kind:'box',size,xyz});
link('base_link',baseVisual(detail),[bc([.65,.52,.26],[0,0,.15]),bc([.30,.31,.80],[-.16,0,.775]),bc([.65,.52,.045],[0,0,.356])]);
link('lift_carriage',null);joint('lift','base_link','lift_carriage',[.12,0,.630],'prismatic',[0,0,1],[0,.50]);
link('torso',torsoVisual(detail),[bc([.19,.28,.23],[0,0,.235]),bc([.15,.18,.12],[0,0,.06])]);joint('waist_pitch','lift_carriage','torso',[0,0,0],'revolute',[0,1,0],[-.15,.35]);
const neck=group();shell(neck,'neck_gaiter',[[0,.058,.060],[.026,.045,.05],[.07,.036,.04]],M.dark,2.4);link('neck',neck);joint('head_yaw','torso','neck',[0,0,.355],'revolute',[0,0,1],[-.75,.75]);link('head',headVisual(detail),[bc([.17,.18,.22],[.02,0,.125])]);joint('head_pitch','neck','head',[.025,0,.061],'revolute',[0,1,0],[-.3,.3]);
for(const [side,s] of [['left',1],['right',-1]]){
const shoulder=group();cyl(shoulder,side+'_shoulder_socket',.064,.062,[0,0,0],M.white,'y');cyl(shoulder,side+'_shoulder_disc',.050,.064,[0,0,0],M.grey,'y');link(side+'_shoulder',shoulder);joint(side+'_shoulder_pitch','torso',side+'_shoulder',[0,s*.177,.307],'revolute',[0,1,0],[-1.6,1.6]);
link(side+'_shoulder_roll_frame',null);joint(side+'_shoulder_roll',side+'_shoulder',side+'_shoulder_roll_frame',[0,s*.05,0],'revolute',[1,0,0],[-1.4,1.4]);
link(side+'_upper_arm',limb(side+'_upper_shell',dimensions.upperArm,.048,.037,detail),[{kind:'cylinder',radius:.046,length:.235,xyz:[0,0,-.133]}]);joint(side+'_upper_twist',side+'_shoulder_roll_frame',side+'_upper_arm',[0,0,0],'revolute',[0,0,1],[-1.5,1.5]);
const elbow=group();ell(elbow,side+'_elbow_housing',[.043,.043,.045],[0,0,0]);cyl(elbow,side+'_elbow_endcap',.029,.088,[0,0,0],M.grey,'y');link(side+'_elbow',elbow);joint(side+'_elbow',side+'_upper_arm',side+'_elbow',[0,0,-dimensions.upperArm],'revolute',[0,1,0],[-.17,1.58],{rpy:[0,-1.48,0]});
link(side+'_forearm',limb(side+'_forearm_shell',dimensions.forearm,.038,.027,detail),[{kind:'cylinder',radius:.036,length:.210,xyz:[0,0,-.118]}]);joint(side+'_forearm_twist',side+'_elbow',side+'_forearm',[0,0,0],'revolute',[0,0,1],[-1.5,1.5]);
const wrist=limb(side+'_wrist_shell',dimensions.wrist,.029,.028,detail);ell(wrist,side+'_wrist_pivot_sleeve',[.029,.029,.018],[0,0,0],M.grey);cyl(wrist,side+'_wrist_distal_sleeve',.027,.016,[0,0,-dimensions.wrist+.003],M.grey);link(side+'_wrist',wrist);joint(side+'_wrist_pitch',side+'_forearm',side+'_wrist',[0,0,-dimensions.forearm],'revolute',[0,1,0],[-.65,.65]);
const flange=group();cyl(flange,side+'_metal_wrist_flange',.030,.014,[0,0,-.007],M.metal);cyl(flange,side+'_cyan_wrist_status',.027,.003,[0,0,-.015],M.led);link(side+'_flange',flange);joint(side+'_wrist_roll',side+'_wrist',side+'_flange',[0,0,-dimensions.wrist],'revolute',[0,0,1],[-1.5,1.5]);
link(side+'_gripper',handVisual(detail),[bc([.058,.079,.075],[0,0,-.0375])]);joint(side+'_hand_mount',side+'_flange',side+'_gripper',[0,0,-.018]);
for(const k of [-1,1]){const half=side+(k===1?'_finger_left':'_finger_right'),drive=side+(k===1?'_gripper_open':'_gripper_mimic');link(half+'_drive',fingerDriveVisual(k));joint(drive,side+'_gripper',half+'_drive',[0,k*.025,-.065],'revolute',[k,0,0],[0,openingAngle],k===-1?{mimic:{joint:side+'_gripper_open',multiplier:1,offset:0}}:{});link(half,fingerTipVisual(k,detail),[bc([.043,.016,.046],[0,-k*.012,-.024])]);joint(half+'_parallel',half+'_drive',half,[0,0,-.07],'revolute',[k,0,0],[-openingAngle,0],{mimic:{joint:side+'_gripper_open',multiplier:-1,offset:0}});}
link(side+'_tcp',null);joint(side+'_tcp_fixed',side+'_gripper',side+'_tcp',[0,0,-.150]);
}
return {name:'agibot_g1_omnipicker_independent_visual_study',links,joints};}
