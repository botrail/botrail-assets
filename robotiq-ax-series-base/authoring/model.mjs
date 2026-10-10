/** Legacy AX Series / UR10e visual study, frozen to the existing 2334 mm contract.
 * Visual evidence: official AX/PE product sheet 2022-01, pp.2-3. No vendor CAD,
 * texture, logo, manual drawing or restricted-manual dimension is copied here.
 * D is inherited compatibility data, NOT a newly verified OEM specification.
 * All new component sizes/positions are independent visual estimates; see README.
 * Since 2026-10-11 the collisions are boxes around the drawn parts; joints and frames are unchanged.
 */
import {THREE,group,namedMaterial,addMesh,collisionBox as cb,fixed} from '../../authoring/tool-shapes.mjs';
import {cylinderBetween,roundedRectangle,ellipseHole} from '../../authoring/geometry.mjs';
export const D={base:[.809,1.370,.060],column:[.220,.160],height:2.334,columnY:-.350,stroke:1.5,plateZ0:.550,plateReach:.420,plate:[.300,.300,.020],mass:155};
export const E={railX:.073,railWidth:.014,railBack:-.269,railFront:-.249,railLow:.19,railHigh:2.16,shoeCenters:[-.095,.095],shoeHeight:.070,shoeSideGap:.001,baseRailWidth:.065,columnFootTop:.235};
const M={frame:namedMaterial('black_powder_coat','#252a2e',.22,.56),panel:namedMaterial('mast_guard_black','#181d22',.14,.47),silver:namedMaterial('guide_aluminium','#a5afb6',.72,.31),cabinet:namedMaterial('controller_gray','#a7adb0',.24,.48),rubber:namedMaterial('black_polymer','#151a1e',.03,.7),lens:namedMaterial('status_diffuser','#e0e8e7',.04,.28),blue:namedMaterial('pendant_blue_gray','#7299aa',.06,.48),screen:namedMaterial('inactive_screen','#172a33',.1,.25),red:namedMaterial('emergency_stop_red','#c0352d',.05,.45),yellow:namedMaterial('switch_yellow','#e2be38',.05,.5),sensor:namedMaterial('sensor_lens','#242e39',.12,.24)};
export const materialProperties=Object.fromEntries(Object.values(M).map(m=>[m.name,{metalness:m.metalness,roughness:m.roughness}]));
function box(g,n,size,p,mat=M.frame){return addMesh(g,n,new THREE.BoxGeometry(...size),mat,p);}
function cyl(g,n,a,b,r,mat=M.silver,radial=24){return cylinderBetween(g,n,a,b,r,mat,{radial});}
function prism(g,n,polygon,depth,at,mat=M.frame,axis='z'){
 const s=new THREE.Shape();s.moveTo(...polygon[0]);for(const p of polygon.slice(1))s.lineTo(...p);s.closePath();
 const geo=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:12});
 if(axis==='x'){geo.rotateY(Math.PI/2);geo.rotateX(Math.PI/2);} // polygon (y,z), extrude +X
 return addMesh(g,n,geo,mat,at);
}
function roundedPanel(g,n,w,h,d,p,mat){
 const s=roundedRectangle(w,h,Math.min(w,h)*.035);
 const geo=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:8});
 geo.rotateX(Math.PI/2);return addMesh(g,n,geo,mat,p); // XZ face, -Y depth
}
function boltZ(g,n,x,y,z,r=.006){cyl(g,n,[x,y,z],[x,y,z+.004],r,M.silver,6);}
function frontBolt(g,n,x,y,z){cyl(g,n,[x,y,z],[x,y+.003,z],.0035,M.silver,6);}
function base(g){
 const w=D.base[0],l=D.base[1],r=E.baseRailWidth;
 for(const s of [-1,1]){
  box(g,`base_longitudinal_${s<0?'left':'right'}`,[r,l-.008,.06],[s*(w-r)/2,0,.03]);
  // Small capped ends express fabricated rails rather than a closed slab.
  for(const t of [-1,1])box(g,`rail_end_cap_${s}_${t}`,[r-.004,.004,.053],[s*(w-r)/2,t*(l/2-.002),.031],M.rubber);
 }
 for(const [n,y,dy] of [['front',l/2-.04,.08],['rear',-l/2+.04,.08],['mast',D.columnY,.21]])
  box(g,`base_crossmember_${n}`,[w-2*r,dy,.06],[0,y,.03]);
 // The extra plate sits on the mast crossmember; no invented anchoring interface.
 box(g,'mast_baseplate',[.340,.290,.012],[0,D.columnY,.066],M.frame);
 for(const s of [-1,1])for(const t of [-1,1]){
  boltZ(g,`mast_base_bolt_${s}_${t}`,s*.143,D.columnY+t*.112,.072,.008);
  const x=s*(w/2-.045),y=t*(l/2-.045);
  const shape=roundedRectangle(.080,.070,.008);ellipseHole(shape,0,0,.008,.016);
  const geom=new THREE.ExtrudeGeometry(shape,{depth:.007,bevelEnabled:false,curveSegments:12});
  addMesh(g,`anchor_tab_${s}_${t}`,geom,M.frame,[x,y,.060]);
 }
 for(const s of [-1,1]){
  // Mast foot cheeks stop below the lowest carriage; profile estimated from photos.
  prism(g,`mast_foot_gusset_${s}`,[[-.105,0],[.09,0],[.04,.163],[-.06,.163]],.012,[s<0?-.120:.108,D.columnY,.072],M.frame,'x');
  for(const t of [-1,1]){
   const x=s*(w/2-.022),y=t*.300;
   box(g,`pallet_sensor_bracket_${s}_${t}`,[.018,.055,.060],[x,y,.089]);
   box(g,`pallet_sensor_housing_${s}_${t}`,[.025,.026,.025],[x-s*.010,y,.114],M.rubber);
   cyl(g,`pallet_sensor_window_${s}_${t}`,[x+s*.003,y,.114],[x+s*.004,y,.114],.007,M.sensor);
  }
 }
}
function mast(g){
 const bottom=.072,top=D.height-.080;
 // Guard plates and extruded edge profiles, not fictitious internal screw/belt.
 box(g,'mast_core',[.194,.144,top-bottom-.012],[0,D.columnY,(top+bottom)/2],M.panel);
 for(const s of [-1,1]){
  box(g,`mast_side_extrusion_${s}`,[.013,.160,top-bottom-.018],[s*.1035,D.columnY,(top+bottom)/2],M.silver);
  box(g,`mast_side_recess_${s}`,[.001,.105,top-bottom-.045],[s*.1101,D.columnY,(top+bottom)/2],M.panel);
  box(g,`mast_front_edge_${s}`,[.009,.003,top-bottom-.030],[s*.094,D.columnY+.0735,(top+bottom)/2],M.silver);
  const railHeight=E.railHigh-E.railLow;
  box(g,`guide_backing_${s}`,[.020,.009,railHeight],[s*E.railX,-.2735,(E.railHigh+E.railLow)/2],M.frame);
  box(g,`guide_rail_${s}`,[E.railWidth,E.railFront-E.railBack,railHeight],[s*E.railX,(E.railFront+E.railBack)/2,(E.railHigh+E.railLow)/2],M.silver);
  // Fasteners are behind the rail running faces and outside the shoe corridor.
  for(let i=0;i<9;i++)frontBolt(g,`mast_face_screw_${s}_${i}`,s*.098,D.columnY+.080,.20+i*.235);
 }
 box(g,'mast_lower_cap',[.220,.160,.010],[0,D.columnY,.077]);
 box(g,'mast_top_cap',[.220,.160,.010],[0,D.columnY,top-.005],M.silver);
 for(const s of [-1,1]){
  cyl(g,`status_light_base_${s}`,[s*.070,D.columnY,top],[s*.070,D.columnY,top+.018],.022,M.rubber);
  cyl(g,`status_light_diffuser_${s}`,[s*.070,D.columnY,top+.018],[s*.070,D.columnY,D.height-.003],.020,M.lens);
  cyl(g,`status_light_cap_${s}`,[s*.070,D.columnY,D.height-.003],[s*.070,D.columnY,D.height],.019,M.lens);
 }
}
function cabinet(g){
 const y=-.430;
 // Robotiq axis cabinet only. Gray UR robot controller and pendant in 2022
 // marketing photos are outside this asset boundary and are intentionally absent.
 // The inherited location/envelope is retained, not measured from that photograph.
 box(g,'axis_cabinet_shell',[.420,.200,.400],[0,y-.100,1.000],M.frame);
 roundedPanel(g,'axis_cabinet_door',.398,.378,.009,[0,y-.200,1.000],M.panel);
 for(const x of [-.188,.188])for(const z of [.822,1.178])cyl(g,`cabinet_door_screw_${x}_${z}`,[x,y-.2085,z],[x,y-.212,z],.004,M.silver,6);
 for(const z of [.850,1.150])box(g,`cabinet_hinge_${z}`,[.012,.017,.036],[-.207,y-.192,z],M.silver);
 box(g,'vent_recess',[.002,.123,.130],[.211,y-.094,1.065],M.rubber);
 for(let k=0;k<9;k++)box(g,`vent_louver_${k}`,[.007,.115,.004],[.215,y-.094,1.009+k*.014],M.frame);
 for(const z of [1.000,1.130])box(g,`vent_rim_h_${z}`,[.008,.137,.006],[.215,y-.094,z],M.frame);
 for(const yy of [y-.160,y-.028])box(g,`vent_rim_v_${yy}`,[.008,.006,.130],[.215,yy,1.065],M.frame);
 // External isolator is visible in dated AX photos; no electrical pinout claimed.
 cyl(g,'isolator_yellow_bezel',[-.115,y-.2085,1.112],[-.115,y-.217,1.112],.023,M.yellow);
 cyl(g,'isolator_rotary_knob',[-.115,y-.217,1.112],[-.115,y-.235,1.112],.014,M.rubber);
 box(g,'isolator_grip',[.011,.009,.036],[-.115,y-.238,1.112],M.rubber);
 for(const z of [.850,1.150])box(g,`cabinet_mount_bridge_${z}`,[.200,.022,.040],[0,y+.003,z],M.frame);
 for(const x of [-.075,.075])cyl(g,`cabinet_bottom_gland_${x}`,[x,y-.095,.782],[x,y-.095,.800],.010,M.rubber);
}
function carriage(){
 const g=group();
 // Two spaced guide shoes per rail. U-shaped saddles surround the rail without
 // penetrating it; their clearances are illustrative and not bearing tolerances.
 for(const s of [-1,1])for(const z of E.shoeCenters){
  const x=s*E.railX;
  for(const t of [-1,1])box(g,`guide_shoe_side_${s}_${z}_${t}`,[.004,.032,E.shoeHeight],[x+t*(E.railWidth/2+E.shoeSideGap+.002),.012,z],M.frame);
  box(g,`guide_shoe_front_${s}_${z}`,[.026,.008,E.shoeHeight],[x,.024,z],M.frame);
 }
 box(g,'carriage_backplate',[.260,.020,.300],[0,.037,0],M.frame);
 // Broad top deck and deep paired triangular gussets replace the unsupported bar.
 box(g,'cantilever_top_deck',[.235,D.plateReach+.150-.047,.018],[0,(.047+D.plateReach+.150)/2,.121],M.frame);
 const poly=[[.047,-.142],[.047,.112],[.565,.112],[.555,.075]];
 for(const s of [-1,1])prism(g,`cantilever_triangular_cheek_${s}`,poly,.010,[s<0?-.1125:.1025,0,0],M.frame,'x');
 box(g,'cantilever_rear_tie',[.205,.020,.225],[0,.057,-.0105],M.frame);
 // Robot interface plate remains a plain legacy envelope: unverified bolt/dowel
 // pattern is deliberately absent rather than implying verified OEM mounting fit.
 box(g,'robot_mount_plate',D.plate,[0,D.plateReach,.130+D.plate[2]/2],M.silver);
 for(const s of [-1,1])for(const z of [-.105,.105])frontBolt(g,`carriage_face_bolt_${s}_${z}`,s*.117,.047,z);
 return g;
}
// --- Collision: boxes around the drawn parts (link frame), rounded outwards to 0.1 mm. The 0.1 um
// tolerance absorbs float32 vertices, so exact faces stay exact (the robot plate top stays on robot_mount).
const up=v=>Math.ceil(v*1e4-1e-3)/1e4, down=v=>Math.floor(v*1e4+1e-3)/1e4;
const wanted=names=>n=>names.some(m=>m.endsWith('*')?n.startsWith(m.slice(0,-1)):n===m);
function partPoints(g,names){
 g.updateMatrixWorld(true);const out=[],p=new THREE.Vector3(),hit=wanted(names);
 for(const o of g.children)if(hit(o.name))o.traverse(m=>{
  if(!m.isMesh)return;const a=m.geometry.attributes.position;
  for(let i=0;i<a.count;i++)out.push(p.fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld).toArray());
 });
 if(!out.length)throw new Error(`no drawn parts named ${names}`);
 return out;
}
function boxOver(points){
 const lo=[0,1,2].map(k=>down(Math.min(...points.map(p=>p[k])))),hi=[0,1,2].map(k=>up(Math.max(...points.map(p=>p[k]))));
 return cb(hi.map((h,k)=>+(h-lo[k]).toFixed(4)),hi.map((h,k)=>+((h+lo[k])/2).toFixed(5)));
}
const around=(g,names)=>boxOver(partPoints(g,names));
/** The named parts cut into `count` slabs along an axis: per slab, the vertices inside plus every
 * triangle edge's crossing of its two planes (exact extremes of the faceted surface in that slab). */
function slabs(g,names,axis,count){
 g.updateMatrixWorld(true);const k='xyz'.indexOf(axis),tris=[],hit=wanted(names);
 for(const o of g.children)if(hit(o.name))o.traverse(m=>{
  if(!m.isMesh)return;const a=m.geometry.attributes.position,idx=m.geometry.index;
  const v=i=>new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld).toArray();
  const n=idx?idx.count:a.count;
  for(let i=0;i<n;i+=3)tris.push([0,1,2].map(j=>v(idx?idx.getX(i+j):i+j)));
 });
 const all=tris.flat(),lo=Math.min(...all.map(p=>p[k])),hi=Math.max(...all.map(p=>p[k])),step=(hi-lo)/count;
 return Array.from({length:count},(_,i)=>{
  const a=lo+i*step,b=i===count-1?hi:a+step,pts=[];
  for(const tri of tris)for(let e=0;e<3;e++){
   const p=tri[e],q=tri[(e+1)%3];
   if(p[k]>=a&&p[k]<=b)pts.push(p);
   for(const plane of [a,b])if((p[k]-plane)*(q[k]-plane)<0){const s=(plane-p[k])/(q[k]-p[k]);pts.push(p.map((c,j)=>c+s*(q[j]-c)));}
  }
  return boxOver(pts);
 });
}
function baseCollisions(g){
 const side=(s,t)=>`anchor_tab_${s}_${t}`;
 return [
  // Open base frame: two side rails and three crossmembers; the anchor tabs ride on the end members.
  around(g,['base_longitudinal_left','rail_end_cap_-1_*']),around(g,['base_longitudinal_right','rail_end_cap_1_*']),
  around(g,['base_crossmember_front',side(-1,1),side(1,1)]),around(g,['base_crossmember_rear',side(-1,-1),side(1,-1)]),
  around(g,['base_crossmember_mast']),around(g,['mast_baseplate','mast_base_bolt_*']),around(g,['mast_foot_gusset_*']),
  ...[-1,1].flatMap(s=>[-1,1].map(t=>around(g,[`pallet_sensor_bracket_${s}_${t}`,`pallet_sensor_housing_${s}_${t}`,`pallet_sensor_window_${s}_${t}`]))),
  // Mast with its face screws and caps, the guide rails in front of it, the lights on top.
  around(g,['mast_core','mast_side_*','mast_front_edge_*','mast_face_screw_*','mast_lower_cap','mast_top_cap']),
  around(g,['guide_backing_*','guide_rail_*']),around(g,['status_light_*']),
  // Axis cabinet with door, hinges, vents, mounting bridges and glands; the isolator on its own.
  around(g,['axis_cabinet_*','cabinet_*','vent_*']),around(g,['isolator_*']),
 ];
}
function carriageCollisions(g){
 return [
  around(g,['guide_shoe_*','carriage_backplate','cantilever_rear_tie','carriage_face_bolt_*']),
  // The deck and its two triangular cheeks in four slabs along the reach, following the cheeks' slope.
  ...slabs(g,['cantilever_top_deck','cantilever_triangular_cheek_*'],'y',4),
  around(g,['robot_mount_plate']),
 ];
}
export function definition(){
 const g=group();base(g);mast(g);cabinet(g);
 const c=carriage();
 const links=[{name:'base_link',visual:g,collisions:baseCollisions(g)},
 {name:'carriage',visual:c,collisions:carriageCollisions(c)},
 {name:'robot_mount'}];
 const joints=[{name:'lift_joint',type:'prismatic',parent:'base_link',child:'carriage',xyz:[0,D.columnY+D.column[1]/2+.010,D.plateZ0-.150],axis:[0,0,1],limit:{lower:0,upper:D.stroke,velocity:.3,effort:3000}},fixed('robot_mount_joint','carriage','robot_mount',[0,D.plateReach,.130+D.plate[2]])];
 return {name:'robotiq_ax_series_base',links,joints};
}
