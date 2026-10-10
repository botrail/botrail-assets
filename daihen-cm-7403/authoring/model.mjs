/** CM-7403 independent photo-based visual, 2026-10-09.
 * Official product page: 254 x 611 x 393 mm. Every subcomponent dimension is
 * an estimate. The legacy mount frame is preserved; since 2026-10-10 the torch
 * outlet frame sits on the visible connector and the collision boxes follow
 * the visual within the published envelope. Neither is a measured interface.
 */
import {THREE,group,silver,dark,rubber,box,namedMaterial,addMesh,collisionBox as cb,fixed} from '../../authoring/tool-shapes.mjs';
import {cylinderBetween} from '../../authoring/geometry.mjs';
import {profile,ring} from './visual-geometry.mjs';
export const D={w:.254,d:.611,h:.393,housingD:.370,housingH:.363,holder:[.239,.241,.290],pattern:[.185,.475],spoolR:.150,spoolW:.103,spoolTilt:15*Math.PI/180,spoolHub:[-.215,.180],mass:14};
export const V={front:.3175,rear:-.2935,baseH:.014,spoolCenter:[-.003,-.138,.228],spoolWidth:.103,spoolRadius:.150,wireRadius:.123,coverTop:.345,handleTop:.393};
const teal=namedMaterial('teal_painted_frame','#245569',.25,.42);
const pale=namedMaterial('light_gray_cover','#c6cdd0',.22,.43);
const panel=namedMaterial('charcoal_panel','#343c47',.12,.56);
const pearl=namedMaterial('pale_spool_flange','#dddeda',.05,.48);
const copper=namedMaterial('copper_wire','#b77c55',.65,.35);
const brass=namedMaterial('brass_connector','#af9146',.68,.35);
export function definition(){
 const g=group(),links=[],joints=[];
 const cyl=(n,a,b,r,m=dark,radial=48)=>cylinderBetween(g,n,a,b,r,m,{radial});
 const yz=(name,pts,x,width,mat,holes=[])=>{const o=addMesh(g,name,profile(pts,width,holes),mat);o.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,0)));o.position.x=x;return o;};
 // Long low tray, with a genuinely open rear and visible longitudinal flanges.
 box(g,'base_tray',[.254,.611,.010],[0,.012,.005],teal);
 for(const x of [-.122,.122])box(g,'base_edge_'+x,[.010,.603,.016],[x,.012,.013],teal);
 // Teal side arches. The large feed-access opening is a through opening,
 // not a dark patch on a solid housing.
 const side=[[-.044,.025],[.302,.025],[.302,.184],[.277,.193],[.119,.321],[.004,.291],[-.044,.274]];
 const opening=[[-.018,.047],[-.018,.239],[.056,.259],[.133,.235],[.190,.168],[.190,.047]];
 yz('side_arch',side,.105,.014,teal,[opening]);
 yz('opposite_side_cover',side,-.119,.014,pale);
 box(g,'rear_feed_bridge',[.216,.018,.066],[0,.025,.281],teal);
 // Front face and its sloping console: a light surround around inset dark panels.
 box(g,'front_lower_surround',[.238,.020,.194],[0,.2975,.115],pale);
 box(g,'front_service_panel',[.195,.004,.155],[0,.3095,.112],panel);
 const cover=[[-.004,.313],[.128,.345],[.303,.211],[.303,.183],[.277,.192],[.119,.320],[.004,.290]];
 yz('upper_cover',cover,-.119,.238,pale);
 // Sloped face runs from (y=.128,z=.345) to (.303,.211).
 const slope=new THREE.Vector3(0,.175,-.134),normal=new THREE.Vector3(0,.134,.175).normalize();
 const upper=box(g,'sloping_control_panel',[.193,slope.length()-.025,.004],[0,.2155+normal.y*.002,.278+normal.z*.002],panel);upper.rotation.x=Math.atan2(slope.z,slope.y);
 // Small visible fasteners, deliberately no copied logo or specification label.
 for(const x of [-.087,.087])for(const z of [.047,.177])cyl('front_fastener_'+x+'_'+z,[x,.311,z],[x,.314,z],.0026,silver,16);
 // Photo-estimated lower-front connector; `torch_outlet_frame` sits on its face.
 // A visual estimate, not a measured physical connector datum.
 const torchAt=[.052,V.front,.115];
 const torch=addMesh(g,'torch_brass_ring',ring(.019,.012,.009),brass);torch.rotation.x=-Math.PI/2;torch.position.set(.052,.3075,.115);
 cyl('torch_recess',[.052,.309,.115],[.052,.311,.115],.0115,rubber);
 cyl('torch_center',[.052,.311,.115],[.052,.3175,.115],.0035,brass);
 // Individual panel and connector dimensions remain unmeasured.
 for(const [i,t] of [.20,.78].entries()){
  const pos=new THREE.Vector3(-.045,.128,.345).addScaledVector(slope,t).addScaledVector(normal,.004);
  cyl('upper_switch_'+i,pos.toArray(),pos.clone().addScaledVector(normal,.010).toArray(),.0045,rubber,24);
 }
 // Enclosed feed motor and roller hardware visible through side openings.
 box(g,'feed_motor_body',[.125,.095,.082],[0,.032,.098],dark);
 cyl('feed_motor_end',[-.081,.032,.098],[.071,.032,.098],.042,dark);
 box(g,'feed_roller_bed',[.175,.102,.014],[0,.112,.051],silver);
 for(const y of [.087,.142]){box(g,'feed_bearing_'+y,[.018,.030,.030],[.063,y,.070],dark);cyl('feed_roller_'+y,[.069,y,.079],[.096,y,.079],.016,silver);cyl('feed_roller_cap_'+y,[.096,y,.079],[.100,y,.079],.008,dark);}
 for(const y of [.074,.150])box(g,'roller_arm_support_'+y,[.014,.012,.060],[.086,y,.086],silver);
 cyl('side_latch',[.105,.012,.069],[.126,.012,.069],.020,teal,48);
 box(g,'side_latch_mount',[.016,.038,.026],[.106,.012,.045],teal);
 box(g,'roller_pressure_arm',[.012,.091,.015],[.096,.111,.115],dark);
 cyl('pressure_adjuster',[.100,.10,.121],[.100,.10,.155],.010,teal,24);
 // Narrow rear spindle pedestal leaves daylight around the reel.
 yz('spindle_pedestal',[[-.256,.021],[-.247,.060],[-.161,.254],[-.102,.253],[-.092,.221],[-.182,.030]],-.102,.021,teal);
 box(g,'spindle_foot',[.177,.109,.012],[-.017,-.210,.022],teal);
 const center=new THREE.Vector3(...V.spoolCenter),axis=new THREE.Vector3(Math.cos(D.spoolTilt),0,Math.sin(D.spoolTilt));
 const along=s=>center.clone().addScaledVector(axis,s).toArray();
 cyl('spindle',along(-.120),along(.072),.019,silver);
 // The reel is an independent generic loaded spool, not a vendor accessory CAD.
 const orient=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),axis);
 const ringAt=(name,ro,ri,len,s,mat)=>{const o=addMesh(g,name,ring(ro,ri,len),mat,along(s));o.quaternion.copy(orient);return o;};
 cyl('wound_wire_body',along(-.044),along(.044),V.wireRadius,copper,96);
 for(let i=0;i<58;i++){
  const o=addMesh(g,'wire_turn_'+i,new THREE.TorusGeometry(V.wireRadius,.00065,6,96),copper,along(-.0435+i*.087/57));o.quaternion.copy(orient);
 }
 for(const s of [-.0515,.0475]){
  ringAt('spool_flange_'+s,.150,.042,.004,s,pearl);
  ringAt('spool_hub_'+s,.022,.010,.010,s-.003,pearl);
  // Three open hub windows remain between spokes.
  for(let i=0;i<3;i++){
   const a=i*Math.PI*2/3,radial=new THREE.Vector3(0,Math.cos(a),Math.sin(a)).applyAxisAngle(new THREE.Vector3(0,1,0),-D.spoolTilt);
   const start=center.clone().addScaledVector(axis,s+.002).addScaledVector(radial,.017);
   const end=center.clone().addScaledVector(axis,s+.002).addScaledVector(radial,.045);
   cyl('spool_spoke_'+s+'_'+i,start.toArray(),end.toArray(),.005,pearl,16);
  }
 }
 cyl('spool_lock',along(.052),along(.066),.023,dark,12);
 cyl('spool_lock_center',along(.066),along(.069),.009,silver,24);
 // Cross-width carry handle, supported from the upper rear shroud.
 for(const x of [-.076,.076])cyl('handle_leg_'+x,[x,.045,.324],[x,.002,.382],.008,teal);
 cyl('handle_top_tube',[-.076,.002,.382],[.076,.002,.382],.008,teal);
 cyl('handle_grip',[-.064,.002,.382],[.054,.002,.382],.011,rubber);
 for(const y of [-.268,.272])for(const x of [-.098,.098])cyl('base_fastener_'+x+'_'+y,[x,y,.010],[x,y,.013],.0035,silver,16);
 // Collision: boxes around the visual, inside the published 254 x 611 x 393 mm envelope.
 // Housing below the console, the console under its sloping face, the reel bay and the handle.
 const span=(x,y,z)=>cb([x[1]-x[0],y[1]-y[0],z[1]-z[0]],[(x[0]+x[1])/2,(y[0]+y[1])/2,(z[0]+z[1])/2]);
 const X=[-D.w/2,D.w/2],yBay=-.044,ySlope=.216;
 links.push({name:'base_link',visual:g,collisions:[
   span(X,[yBay,V.front],[0,.212]),span(X,[yBay,ySlope],[.212,V.coverTop]),span(X,[ySlope,.303],[.212,.278]),
   span(X,[V.rear,V.spoolCenter[1]+V.spoolRadius],[0,.387]),span([-.087,.087],[-.010,.056],[V.coverTop,V.handleTop])]});
 links.push({name:'mount'});joints.push(fixed('mount_joint','base_link','mount',[0,0,0]));
 links.push({name:'torch_outlet_frame'});joints.push(fixed('torch_outlet_joint','base_link','torch_outlet_frame',torchAt,[-Math.PI/2,0,0]));
 return{name:'daihen_cm_7403',links,joints};
}
