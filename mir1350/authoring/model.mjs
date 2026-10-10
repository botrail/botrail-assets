/** MiR1350 current black base AMR, independently authored from public product
 * facts and the official product PNG/animation, inspected 2026-10-09.
 * No manufacturer CAD, drawing, image texture or manual is used as geometry.
 * Published envelope/load surface are exact; cosmetic details are photo estimates.
 * The legacy 192 mm deck and wheel layout are compatibility assumptions, NOT
 * manufacturer-confirmed mounting geometry. See provenance.json and README.
 */
import * as THREE from 'three';
import {addMesh,namedMaterial,roundedBox,roundedRectangle,cylinderZ} from '@botrail/authoring/geometry.mjs';

export const dimensions={length:1.350,width:0.910,height:0.322,clearance:0.027,deck:0.192,
  loadSurface:[1.304,0.864],driveWheelRadius:0.100,casterRadius:0.050,
  driveTrack:0.360,casterX:0.520,casterY:0.330};
export const appearance={lowerTop:.171,upperBottom:.216,deckUnderside:.306,cornerRadius:.066,
  scannerCenters:[[.608,.388],[-.608,-.388]],scannerWindow:[.175,.190],signalCount:8};
const M={
 shell:namedMaterial('jet_black_shell','#252728',.10,.47),
 skirt:namedMaterial('lower_black_moulding','#202223',.05,.58),
 seam:namedMaterial('recess_shadow','#0b0e10',.02,.73),
 deck:namedMaterial('load_surface_grey','#737777',.25,.49),
 pad:namedMaterial('deck_grip_pad','#424647',.03,.84),
 steel:namedMaterial('fastener_steel','#616a6e',.65,.34),
 drive:namedMaterial('drive_polyurethane_green','#087955',.0,.72),
 caster:namedMaterial('caster_polyurethane_brown','#795e52',.0,.76),
 hub:namedMaterial('wheel_hub','#b4b7b4',.65,.36),
 signal:namedMaterial('corner_signal_diffuser','#e2eceb',.04,.28),
 blue:namedMaterial('status_light_blue','#148ca6',.07,.32),
 lens:namedMaterial('scanner_optical_window','#344248',.25,.17),
 camera:namedMaterial('camera_optical_glass','#17262e',.35,.16),
 bezel:namedMaterial('camera_bezel','#80898a',.55,.33),
 red:namedMaterial('emergency_stop_red','#d54425',.02,.39),
 yellow:namedMaterial('emergency_stop_yellow','#d7ac27',.04,.43),
};
const box=(size,xyz)=>({kind:'box',size,xyz});
const fixed=(name,parent,child,xyz=[0,0,0])=>({name,type:'fixed',parent,child,xyz});
const G=()=>new THREE.Group();
const slab=(w,h,r,depth)=>new THREE.ExtrudeGeometry(roundedRectangle(w,h,r),{depth,bevelEnabled:false,curveSegments:12});
const rb=(g,name,size,r,mat,xyz)=>addMesh(g,name,roundedBox(size,r,2),mat,xyz);
const deckSlab=(g,name,w,h,r,z0,z1,mat)=>addMesh(g,name,slab(w,h,r,z1-z0),mat,[0,0,z0]);
function cornerShape(sx,sy){
 const x0=.513,y0=.296,x1=.675,y1=.455,r=.066;
 const s=new THREE.Shape();s.moveTo(x0,y0);s.lineTo(x1,y0);s.lineTo(x1,y1-r);
 s.absarc(x1-r,y1-r,r,0,Math.PI/2,false);s.lineTo(x0,y1);s.closePath();
 const geo=new THREE.ExtrudeGeometry(s,{depth:.138,bevelEnabled:false,curveSegments:12});
 // Rotate, rather than negative scaling, so outward triangle winding stays intact.
 if(sx===-1&&sy===-1)geo.rotateZ(Math.PI);

 // The mixed corners are reflected with explicit winding reversal below.
 if(sx*sy===-1){
  // Rebuild from the original quadrant and reflect the requested axis.
  const out=new THREE.ExtrudeGeometry(s,{depth:.138,bevelEnabled:false,curveSegments:12});
  out.scale(sx,sy,1);const p=out.attributes.position,n=out.attributes.normal,uv=out.attributes.uv;
  for(let i=0;i<p.count;i+=3)for(const a of [p,n,uv])for(let k=0;k<a.itemSize;k++){
   const v=a.array[(i+1)*a.itemSize+k];a.array[(i+1)*a.itemSize+k]=a.array[(i+2)*a.itemSize+k];a.array[(i+2)*a.itemSize+k]=v;
  }
  return out;
 }
 return geo;
}
function disk(g,name,r,depth,mat,at,axis='z'){
 const geo=cylinderZ(r,depth,{radial:32});if(axis==='x')geo.rotateY(Math.PI/2);if(axis==='y')geo.rotateX(Math.PI/2);
 return addMesh(g,name,geo,mat,at);
}
function screw(g,name,x,y,z){disk(g,name+'_head',.0031,.001,M.steel,[x,y,z]);rb(g,name+'_slot',[.0034,.0008,.00035],.00015,M.seam,[x,y,z+.00055]);}

export function definition(){
 const d=dimensions,links=[],joints=[],L=d.length,W=d.width;
 const chassis=G();
 // Recessed inner chassis supports separate long skins and curved corner pods.
 deckSlab(chassis,'recessed_chassis_core',1.312,.872,.065,.027,.158,M.seam);
 for(const sy of [-1,1]){
  rb(chassis,`lower_side_panel_${sy}`,[1.018,.022,.135],.003,M.shell,[0,sy*.4435,.0985]);
  rb(chassis,`lower_side_top_return_${sy}`,[1.018,.051,.009],.003,M.skirt,[0,sy*.429,.167]);
 }
 for(const sx of [-1,1]){
  if(sx<0)rb(chassis,`lower_end_panel_${sx}`,[.022,.584,.135],.003,M.shell,[sx*.6635,0,.0985]);
  else for(const sy of [-1,1])rb(chassis,`front_lower_wing_${sy}`,[.022,.171,.135],.003,M.shell,[.6635,sy*.2065,.0985]);
  rb(chassis,`lower_end_top_return_${sx}`,[.055,.584,.009],.003,M.skirt,[sx*.647,0,.167]);
 }
 for(const [tag,sx,sy] of [['fl',1,1],['fr',1,-1],['bl',-1,1],['br',-1,-1]]){
  addMesh(chassis,`lower_corner_pod_${tag}`,cornerShape(sx,sy),M.skirt,[0,0,.029]);
  // A discrete seam and shallow top return remain below the scanning gap.
  const lip=cornerShape(sx,sy);lip.scale(1,1,.008/.138);
  addMesh(chassis,`corner_top_return_${tag}`,lip,M.shell,[0,0,.167]);

 }
 // Real silhouette cue: two low smoked optical turrets, never yellow cubes.
 for(const [i,[x,y]] of appearance.scannerCenters.entries()){
  disk(chassis,`scanner_${i}_foot`,.051,.006,M.seam,[x,y,.176]);
  const hood=new THREE.CylinderGeometry(.043,.051,.015,48);hood.rotateX(Math.PI/2);
  addMesh(chassis,`scanner_${i}_window`,hood,M.lens,[x,y,.1835]);
  disk(chassis,`scanner_${i}_cap`,.044,.003,M.skirt,[x,y,.192]);
 }
 // Preserve the legacy removable-cover interface; its height is not certified.
 deckSlab(chassis,'legacy_interface_plate',1.250,.800,.042,.188,.192,M.seam);
 // Central sculpted camera bay, with two independently authored vertical optics.
 rb(chassis,'front_camera_recess',[.009,.234,.112],.004,M.seam,[.649,0,.104]);
 for(const sy of [-1,1]){
  const pod=rb(chassis,`front_camera_moulding_${sy}`,[.024,.108,.101],.011,M.skirt,[.649,sy*.051,.106]);
  pod.rotation.z=sy*.12;
  const bezel=rb(chassis,`front_3d_camera_${sy}_bezel`,[.003,.019,.082],.0014,M.bezel,[.666,sy*.044,.108]);
  const face=rb(chassis,`front_3d_camera_${sy}_glass`,[.0034,.014,.076],.0015,M.camera,[.669,sy*.044,.108]);
  for(const [k,z] of [.079,.094,.119,.137].entries())disk(chassis,`front_camera_${sy}_lens_${k}`,k===2?.0055:.004,.001,M.lens,[.672,sy*.044,z],'x');
 }
 // Rear cover is kept restrained where the public hero view does not show details.
 rb(chassis,'rear_service_panel_seam',[.002,.252,.095],.0008,M.seam,[-.674,0,.098]);
 rb(chassis,'rear_service_panel',[.002,.246,.089],.0008,M.shell,[-.674,0,.098]);
 links.push({name:'base_footprint'});
 links.push({name:'base_link',visual:chassis,collisions:[box([L,W,d.deck-d.clearance],[0,0,(d.deck+d.clearance)/2])]});
 joints.push(fixed('base_link_joint','base_footprint','base_link'));

 const cover=G(),z=v=>v-d.deck;
 // Narrower upper body under the overhanging deck, with a genuine open reveal.
 deckSlab(cover,'upper_recessed_body',1.290,.850,.065,z(.215),z(.307),M.shell);
 for(const sy of [-1,1]){
  rb(cover,`recess_inner_side_wall_${sy}`,[1.040,.008,.042],.002,M.seam,[0,sy*.407,z(.197)]);
  rb(cover,`upper_side_panel_${sy}`,[1.036,.013,.077],.003,M.shell,[0,sy*.4225,z(.2625)]);
  rb(cover,`status_recess_side_${sy}`,[1.040,.011,.012],.002,M.seam,[0,sy*.432,z(.202)]);
  rb(cover,`status_light_side_${sy}`,[1.024,.003,.005],.001,M.blue,[0,sy*.438,z(.203)]);
 }
 for(const sx of [-1,1]){
  rb(cover,`upper_end_panel_${sx}`,[.013,.595,.077],.003,M.shell,[sx*.6425,0,z(.2625)]);
  rb(cover,`status_recess_end_${sx}`,[.011,.584,.012],.002,M.seam,[sx*.646,0,z(.202)]);
  rb(cover,`status_light_end_${sx}`,[.003,.568,.005],.001,M.blue,[sx*.652,0,z(.203)]);
 }
 for(const [tag,sx,sy] of [['fl',1,1],['fr',1,-1],['bl',-1,1],['br',-1,-1]]){
  rb(cover,`corner_signal_housing_${tag}`,[.139,.142,.079],.027,M.skirt,[sx*.587,sy*.366,z(.2665)]);
  rb(cover,`signal_${tag}_end`,[.002,.017,.049],.0009,M.signal,[sx*.6575,sy*.325,z(.265)]);
  rb(cover,`signal_${tag}_side`,[.017,.002,.049],.0009,M.signal,[sx*.548,sy*.4375,z(.265)]);
  // The public front-quarter view shows red/yellow stops on the long-side corners.
  disk(cover,`stop_${tag}_backplate`,.017,.003,M.yellow,[sx*.591,sy*.439,z(.265)],'y');
  disk(cover,`stop_${tag}_neck`,.009,.006,M.red,[sx*.591,sy*.441,z(.265)],'y');
  disk(cover,`stop_${tag}_head`,.0135,.009,M.red,[sx*.591,sy*.446,z(.265)],'y');
 }
 deckSlab(cover,'overhanging_black_deck_rim',L,W,.068,z(.306),z(.319),M.skirt);
 deckSlab(cover,'load_surface',d.loadSurface[0],d.loadSurface[1],.052,z(.318),z(.321),M.deck);
 // Eight broad grip islands visible in the official product photograph.
 for(const x of [-.558,-.185,.185,.558])for(const sy of [-1,1])
  addMesh(cover,`deck_grip_${x}_${sy}`,slab(.123,.094,.012,.001),M.pad,[x,sy*.329,z(.321)]);
 for(const sy of [-1,1]){
  addMesh(cover,`deck_access_seam_${sy}`,slab(.170,.128,.008,.0005),M.seam,[0,sy*.159,z(.321)]);
  addMesh(cover,`deck_access_lid_${sy}`,slab(.166,.124,.007,.0005),M.deck,[0,sy*.159,z(.3215)]);
 }
 // Shallow screw-head marks, not drilled mounting geometry or a claimed pattern.
 for(const x of [-.485,0,.485])for(const y of [-.235,.235])screw(cover,`deck_screw_${x}_${y}`,x,y,z(.3205));
 // The recessed body's side reveals reach below the deck plane; the box follows the visual down to them.
 const coverLow=Math.floor(new THREE.Box3().setFromObject(cover).min.z*1e4)/1e4;
 links.push({name:'top_cover',visual:cover,collisions:[box([L,W,d.height-d.deck-coverLow],[0,0,(d.height-d.deck+coverLow)/2])]});
 joints.push(fixed('top_cover_joint','base_link','top_cover',[0,0,d.deck]));
 const wheel=(name,parent,radius,width,xyz)=>{
  const g=G(),mat=radius>.075?M.drive:M.caster;
  const tyre=cylinderZ(radius,width,{radial:64});tyre.rotateX(Math.PI/2);addMesh(g,`${name}_tyre`,tyre,mat);
  const cap=cylinderZ(radius*.64,width+.003,{radial:48});cap.rotateX(Math.PI/2);addMesh(g,`${name}_hub`,cap,M.hub);
  for(const sy of [-1,1])disk(g,`${name}_axle_${sy}`,radius*.20,.003,M.steel,[0,sy*(width/2+.003),0],'y');
  links.push({name,visual:g});joints.push({name:`${name}_joint`,type:'continuous',parent,child:name,xyz,axis:[0,1,0],limit:{effort:100,velocity:12}});
 };
 wheel('left_wheel_link','base_link',d.driveWheelRadius,.060,[0,d.driveTrack,d.driveWheelRadius]);
 wheel('right_wheel_link','base_link',d.driveWheelRadius,.060,[0,-d.driveTrack,d.driveWheelRadius]);
 for(const [tag,sx,sy] of [['fl',1,1],['fr',1,-1],['bl',-1,1],['br',-1,-1]])
  wheel(`${tag}_caster_wheel_link`,'base_link',d.casterRadius,.040,[sx*d.casterX,sy*d.casterY,d.casterRadius]);
 links.push({name:'deck'},{name:'cover_top'});
 joints.push(fixed('deck_joint','base_link','deck',[0,0,d.deck]));
 joints.push(fixed('cover_top_joint','base_link','cover_top',[0,0,d.height]));
 return {name:'mir1350_reference',links,joints};
}
