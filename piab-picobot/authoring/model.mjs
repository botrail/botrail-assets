/** Original air-driven 7 kg piCOBOT UR with Adjustable Gripper.
 * Independent photo-informed visual refinement; not piCOBOT L / Electric.
 * Public UR envelopes: ejector Ø93 x 74 mm, gripper 174 x 72 x 38 mm.
 * Legacy Ø40 x 22 mm cups / 120 mm spacing / flange holes are retained,
 * not authenticated OEM kit geometry. All detail sizes below are estimates.
 * Fixed links, TCP and collision contract are unchanged from c945d9e main.
 */
import {group,silver,dark,rubber,box,cylinder,lathe,plate,collisionBox as cb,collisionCylinder as cc,fixed,THREE,addMesh,namedMaterial} from '../../authoring/tool-shapes.mjs';
import {cylinderBetween,ringGeometry,roundedRectangle} from '../../authoring/geometry.mjs';
export const D={plate:.005,body:.069,bodyR:.035,arm:[.174,.072,.038],cupSpacing:.120,cup:.022};
const black=namedMaterial('picobot_moulded_black','#202527',.06,.47);
const cap=namedMaterial('picobot_satin_cap','#bec5c8',.76,.28);
const green=namedMaterial('picobot_coax_green','#02965b',.02,.43);
const cupGreen=namedMaterial('picobot_cup_green','#185c36',0,.38);
const lip=namedMaterial('picobot_cup_yellow','#c5d92a',0,.58);
const screen=namedMaterial('picobot_screen_glass','#071722',.12,.22);
const cyan=namedMaterial('picobot_display_cyan','#20a6d7',.05,.36);
const lens=namedMaterial('picobot_indicator_lens','#798b7f',.22,.25);
const pipe=(g,n,a,b,r,m=black)=>cylinderBetween(g,n,a,b,r,m,{radial:32});
function frontDisc(g,n,x,y,z,r,h,m){return pipe(g,n,[x,y+h/2,z],[x,y-h/2,z],r,m);}
function screw(g,n,x,y,z,r=.0017){frontDisc(g,n+'_head',x,y,z,r,.001,cap);frontDisc(g,n+'_socket',x,y-.00055,z,r*.42,.00012,black);}
function panel(g,n,w,h,depth,at,r,m){const geo=new THREE.ExtrudeGeometry(roundedRectangle(w,h,r),{depth,bevelEnabled:false,curveSegments:8});geo.rotateX(Math.PI/2);return addMesh(g,n,geo,m,at);}
function ring(g,n,ro,ri,h,z,m){return addMesh(g,n,ringGeometry(ro,ri,h),m,[0,0,z]);}
function cupVisual(){
 const g=group();cylinder(g,'cup_thread_neck',.006,.006,[0,0,.003],silver);
 // Independently authored closed profiles with a real open suction cavity.
 lathe(g,'cup_upper_bellows',[[.005,.005],[.005,.010],[.009,.010],[.011,.012],[.013,.018],[.015,.018],[.016,.013],[.017,.013],[.017,.011],[.014,.014],[.012,.010],[.009,.008],[.007,.005],[.005,.005]],cupGreen);
 lathe(g,'cup_compliant_yellow_lip',[[.016,.013],[.018,.017],[.020,.020],[.022,.020],[.022,.0175],[.020,.017],[.018,.012],[.016,.011],[.016,.013]],lip);
 for(let i=0;i<12;i++){let a=i*Math.PI/6;cylinder(g,`lip_moulding_${i}`,.0008,.0006,[.018*Math.cos(a),.018*Math.sin(a),.0204],lip);}
 return g;
}
export function definition(){
 const body=group(),links=[],joints=[];
 const holes=[];for(const a of [45,135,225,315])holes.push([.025*Math.cos(a*Math.PI/180),.025*Math.sin(a*Math.PI/180),.0033]);
 plate(body,'legacy_iso50_adapter_plate',.0465,D.plate,holes,cap);
 ring(body,'upper_cap_rolled_edge',.0463,.033,.005,.005,cap);
 ring(body,'upper_cap_lower_step',.0458,.033,.004,.010,cap);
 lathe(body,'ejector_barrel',[[.005,.025],[.005,.034],[.010,.035],[.064,.035],[.070,.0335],[.074,.030],[.074,.025],[.005,.025]],black);
 cylinder(body,'barrel_inner_core',.026,.069,[0,0,.0395],black);
 ring(body,'lower_shell_seam',.0347,.034,.001,.064,dark);
 panel(body,'hmi_rounded_outer_surround',.069,.047,.011,[0,-.026,.039],.006,black);
 panel(body,'hmi_face_recess',.060,.027,.001,[0,-.0369,.031],.0015,dark);
 panel(body,'oled_glass',.032,.010,.0005,[.004,-.0378,.036],.001,screen);
 // Abstract indicator strokes, no copied OEM text, logo or screen artwork.
 for(let i=0;i<3;i++)box(body,`display_digit_bar_${i}`,[.004,.00025,.005],[.002+i*.007,-.03835,.035],cyan);
 for(let i=0;i<6;i++)box(body,`display_status_${i}`,[.0025,.00025,.001],[i*.004-.009,-.03835,.040],cyan);
 for(const z of [.025,.037]){frontDisc(body,`button_bezel_${z}`,.022,-.0385,z,.0033,.0015,black);frontDisc(body,`green_button_${z}`,.022,-.0394,z,.0025,.0012,green);frontDisc(body,`right_button_${z}`,-.024,-.0385,z,.0024,.001,black);}
 frontDisc(body,'manual_override',.029,-.0385,.037,.0017,.001,rubber);
 for(const x of [-.027,.027])for(const z of [.020,.043])screw(body,`hmi_screw_${x}_${z}`,x,-.0385,z,.00125);
 panel(body,'coax_cartridge_recess',.056,.012,.001,[0,-.0369,.055],.001,screen);
 box(body,'green_coax_cartridge',[.051,.002,.009],[0,-.038,.055],green);
 box(body,'coax_moulded_center',[.019,.0008,.007],[.003,-.0392,.055],green);
 for(const x of [-.023,-.008,.022])for(const z of [.052,.058])screw(body,`cartridge_fastener_${x}_${z}`,x,-.0395,z,.00125);
 panel(body,'indicator_backing',.040,.004,.007,[0,-.028,.0155],.001,black);
 panel(body,'indicator_translucent_strip',.038,.0035,.001,[0,-.035,.0155],.001,lens);
 for(const x of [-.008,0,.008])box(body,`indicator_element_${x}`,[.004,.0004,.0015],[x,-.036,.0155],green);
 // Side compressed-air elbow and rear electrical connector. External leads omitted.
 pipe(body,'air_port_hex_base',[-.032,.004,.039],[-.041,.004,.039],.006,cap);
 pipe(body,'air_elbow_horizontal',[-.040,.004,.039],[-.047,.004,.039],.0045,cap);
 pipe(body,'air_elbow_upright',[-.047,.004,.039],[-.047,.004,.025],.0045,cap);
 cylinder(body,'air_pushfit_collar',.005,.003,[-.047,.004,.024],dark);
 cylinder(body,'air_pushfit_opening',.003,.0004,[-.047,.004,.0223],black);
 pipe(body,'m8_rear_socket',[0,.031,.030],[0,.039,.030],.0047,cap);
 pipe(body,'m8_socket_insert',[0,.039,.030],[0,.0394,.030],.0036,black);
 for(const x of [-.028,.028])box(body,`housing_side_cover_${x}`,[.005,.024,.042],[x,.013,.040],dark);
 const z0=D.plate+D.body;
 // Sliding rails replace the old solid full-width box. Central cover stays separate.
 for(const s of [-1,1]){
  const side=s<0?'a':'b',x=s*D.cupSpacing/2,hy=s*.022;
  box(body,`sliding_arm_${side}`,[.053,.017,.018],[s*.0435,.005,.095],black);
  box(body,`arm_top_track_${side}`,[.044,.012,.003],[s*.043,.005,.084],dark);
  for(let i=0;i<7;i++)box(body,`arm_scale_${side}_${i}`,[.001,.0005,.006],[s*(.026+i*.0035),-.004,.095],dark);
  box(body,`clamp_strap_${side}`,[.009,.003,.020],[s*.047,-.006,.095],cap);
  for(const z of [.089,.101])screw(body,`arm_clamp_${side}_${z}`,s*.047,-.008,z,.0019);
  panel(body,`hinged_cup_holder_${side}`,.023,.031,.032,[x,.016,.096],.007,black);
  frontDisc(body,`holder_pivot_washer_${side}`,x,-.017,.089,.009,.0018,cap);
  screw(body,`holder_pivot_${side}`,x,-.0184,.089,.0033);
  cylinder(body,`holder_lower_collar_${side}`,.011,.008,[x,0,.108],black);
  pipe(body,`vacuum_tube_${side}`,[s*.020,hy,.090],[s*.055,hy,.090],.0025,black);
  pipe(body,`vacuum_pushfit_${side}`,[s*.050,hy,.090],[s*.057,hy,.090],.004,black);
  pipe(body,`vacuum_elbow_${side}`,[s*.057,hy,.090],[x,hy*.76,.090],.0035,black);
 }
 panel(body,'gripper_central_shroud',.047,.034,.060,[0,.030,.094],.006,black);
 for(const x of [-.014,0,.014])panel(body,`shroud_lower_recess_${x}`,.008,.005,.0004,[x,-.0299,.103],.002,dark);
 cylinder(body,'gripper_neck',.021,.007,[0,0,.0765],black);
 // Detached adjustment pin is not installed in the operating assembly.
 links.push({name:'mount',visual:body,collisions:[cc(.0465,D.plate,[0,0,D.plate/2]),cc(D.bodyR,D.body,[0,0,D.plate+D.body/2]),cb([D.arm[0],D.arm[1],D.arm[2]],[0,0,z0+D.arm[2]/2])]});
 const z1=z0+D.arm[2];
 for(const [name,s] of [['cup_a',-1],['cup_b',1]]){
  links.push({name,visual:cupVisual(),collisions:[cc(.006,.006,[0,0,.003]),cc(.020,.016,[0,0,.014])]});
  joints.push(fixed(name+'_joint','mount',name,[s*D.cupSpacing/2,0,z1]));
  links.push({name:name+'_contact'});joints.push(fixed(name+'_contact_joint',name,name+'_contact',[0,0,D.cup]));
 }
 links.push({name:'tcp'});joints.push(fixed('tcp_joint','mount','tcp',[0,0,z1+D.cup]));
 return{name:'piab_picobot_ur',links,joints};
}
