/** DAIHEN Welbee Inverter P350L II, WB-P352L, independent CC0 reference.
 * SI units, Z up, -Y front. Published envelope: 395 x 710 x 640 mm,
 * excluding lifting eyes. Detail measurements are photo estimates; see provenance.json.
 * No manufacturer meshes, textures or dimension drawings are embedded.
 */
import {THREE,group,namedMaterial,collisionBox as cb,fixed,addMesh} from '../../authoring/tool-shapes.mjs';
import {cylinderBetween,ringGeometry,roundedRectangle,roundedBox} from '../../authoring/geometry.mjs';
const box=(g,n,size,at,mat)=>addMesh(g,n,roundedBox(size,Math.min(...size)*.14,1),mat,at);
const navy=namedMaterial('welbee_blue_painted_steel','#155171',.25,.43);
const fascia=namedMaterial('silver_moulded_fascia','#c2c6c5',.03,.48);
const silver=namedMaterial('steel_lifting_hardware','#9ca8ad',.72,.28);
const dark=namedMaterial('charcoal_recess','#252c30',.05,.70);
const rubber=namedMaterial('rubber_tyres_and_caps','#141b1f',0,.87);
const label=namedMaterial('panel_legend_grey','#687475',.1,.66);
const blue=namedMaterial('blue_control_knobs','#2985b8',.1,.46);
const screen=namedMaterial('unlit_display_glass','#142425',.15,.23);
const brass=namedMaterial('brass_output_terminals','#aa8c45',.65,.28);
const amber=namedMaterial('safety_marker_amber','#d19b28',.05,.6);
export const D=Object.freeze({w:.395,d:.710,h:.640,caster:.025,track:[.320,.460],rearOverhang:.100,mass:54,
  bodyBottom:.060,sideOuter:.190,shellFront:-.316,front:-.355,rear:.355,skin:.003,eyeOuter:.016,eyeInner:.009,upperFasciaLean:.16,roofHeight:.612,
  louverPitch:.013,louverCount:11,louverWidth:.151,louverThickness:.006,frontRecess:.026});
export const panels=Object.freeze({control:{x:0,z:.524,w:.310,h:.180},upperLouver:{x:-.087,z:.339,w:.159,h:.150},
 lowerLouver:{x:-.087,z:.164,w:.159,h:.145},utility:{x:.091,z:.339,w:.155,h:.145},outlets:{x:.091,z:.164,w:.155,h:.145}});
const upperCorners=[[-.176,.248],[.176,.248],[.1975,.262],[.1975,.612],[.181,.631],[.120,.640],[-.120,.640],[-.181,.631],[-.1975,.612],[-.1975,.262]];
const lowerCorners=[[-.1775,.060],[.1775,.060],[.1975,.078],[.1975,.238],[.175,.247],[-.175,.247],[-.1975,.238],[-.1975,.078]];
function polygon(points){const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return s;}
function rectHole(s,x,z,w,h,r=.004){const p=roundedRectangle(w,h,r);for(const c of p.curves){for(const key of ['v0','v1','v2','v3'])if(c[key])c[key].add(new THREE.Vector2(x,z));}s.holes.push(p);}
function frontPlate(g,n,shape,y,depth,mat){const m=addMesh(g,n,new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:8}),mat,[0,y,0]);m.rotation.x=Math.PI/2;return m;}
function pin(g,n,x,y,z,r=.0022,mat=silver){return cylinderBetween(g,n,[x,y+.001,z],[x,y-.001,z],r,mat,{radial:12});}
function torus(g,n,center,major,tube,mat,rotation=[Math.PI/2,0,0]){const m=addMesh(g,n,new THREE.TorusGeometry(major,tube,12,40),mat,center);m.rotation.set(...rotation);return m;}
function frontRing(g,n,x,y,z,outer,inner,depth,mat){const m=addMesh(g,n,ringGeometry(outer,inner,depth),mat,[x,y,z]);m.rotation.x=Math.PI/2;return m;}
function louver(g,n,p){
 // Eleven rounded through slots, each with a recessed angled vane; no black decal grille.
 const skin=polygon([[p.x-p.w/2,p.z-p.h/2],[p.x+p.w/2,p.z-p.h/2],[p.x+p.w/2,p.z+p.h/2],[p.x-p.w/2,p.z+p.h/2]]);
 box(g,`${n}_interior`,[p.w+.006,.004,p.h+.006],[p.x,-.313,p.z],dark);
 for(let i=0;i<D.louverCount;i++){
  const z=p.z-(D.louverCount-1)*D.louverPitch/2+i*D.louverPitch;
  rectHole(skin,p.x,z,D.louverWidth,.0055,.0027);
  const m=box(g,`${n}_vane_${String(i).padStart(2,'0')}`,[D.louverWidth,.012,.004],[p.x,-.339,z-.005],fascia);m.rotation.x=-.25;
 }
 frontPlate(g,`${n}_slotted_face`,skin,-.344,.006,fascia);
}
function caster(g,tag,x,y){
 // Fixed caster approximation: current Hammer 420SR-R50 dimensions; exact installed part unverified.
 cylinderBetween(g,`caster_${tag}_tyre`,[x-.013,y,.025],[x+.013,y,.025],.025,rubber,{radial:48});
 for(const s of [-1,1]){
  cylinderBetween(g,`caster_${tag}_hub_${s<0?'l':'r'}`,[x+s*.013,y,.025],[x+s*.016,y,.025],.012,silver,{radial:24});
  box(g,`caster_${tag}_fork_${s<0?'l':'r'}`,[.003,.037,.041],[x+s*.020,y,.047],silver);
 }
 cylinderBetween(g,`caster_${tag}_axle`,[x-.024,y,.025],[x+.024,y,.025],.006,silver,{radial:16});
 box(g,`caster_${tag}_mount`,[.047,.070,.005],[x,y,.0675],silver);
}
function rearDetails(g){
 const first=g.children.length;
 // Catalog rear photo is a family appearance reference. Local dimensions are estimated.
 const shape=polygon([[-.171,.071],[.171,.071],[.171,.595],[-.171,.595]]);
 for(let col=0;col<2;col++)for(let row=0;row<12;row++)rectHole(shape,.036+col*.033,.294+row*.010,.026,.005,.002);
 for(let row=0;row<10;row++)rectHole(shape,.059,.102+row*.014,.098,.005,.002);
 frontPlate(g,'rear_service_sheet',shape,.335,.003,fascia);
 for(const sign of [-1,1])box(g,`rear_blue_return_${sign}`,[.021,.020,.533],[sign*.1805,.345,.3365],navy);
 box(g,'rear_blue_lower_return',[.381,.020,.010],[0,.345,.075],navy);
 box(g,'rear_louver_interior',[.134,.003,.337],[.057,.319,.269],dark);
 for(let row=0;row<10;row++){
  const v=box(g,`rear_pressed_louver_${row}`,[.098,.009,.004],[.059,.335,.105+row*.014],fascia);v.rotation.x=.23;
 }
 box(g,'rear_io_cover',[.332,.005,.151],[0,.3375,.516],fascia);
 for(const x of [.064,.126])for(const z of [.492,.550]){
  cylinderBetween(g,`rear_grommet_${x}_${z}`,[x,.340,z],[x,.353,z],.016,dark,{radial:28});
 }
 box(g,'rear_input_terminal_cover',[.085,.024,.088],[-.087,.341,.382],dark);
 box(g,'rear_input_cover_blank_label',[.065,.001,.056],[-.087,.3535,.387],fascia);
 box(g,'rear_cable_clamp',[.095,.013,.018],[-.087,.3415,.318],dark);
 for(const [i,x,z,w,h,y] of [[0,-.087,.527,.126,.082,.3405],[1,.081,.432,.118,.042,.3355],[2,-.084,.181,.120,.040,.3355]])box(g,`rear_blank_warning_plate_${i}`,[w,.001,h],[x,y,z],label);
 for(const [i,x] of [[0,-.115],[1,-.047]])cylinderBetween(g,`rear_unused_coolant_blank_${i}`,[x,.334,.100],[x,.343,.100],.009,dark,{radial:24});
 cylinderBetween(g,'rear_ground_terminal',[-.074,.334,.269],[-.074,.346,.269],.005,brass,{radial:12});
 for(const [i,x,z] of [[0,-.145,.581],[1,.147,.581],[2,-.150,.440],[3,.148,.440],[4,-.142,.253],[5,.144,.253]])pin(g,`rear_sheet_fastener_${i}`,x,.338,z,.0035,silver);
 // Rear is observed from +Y: image-right is negative world X.
 // Reflect the authored rear layout and reverse triangles to preserve outward winding.
 for(const m of g.children.slice(first)){
  m.updateMatrix();m.geometry.applyMatrix4(m.matrix);m.position.set(0,0,0);m.quaternion.identity();
  const geo=m.geometry;geo.scale(-1,1,1);
  if(geo.index){const a=geo.index.array;for(let i=0;i<a.length;i+=3)[a[i+1],a[i+2]]=[a[i+2],a[i+1]];geo.index.needsUpdate=true;}
  else for(const attr of Object.values(geo.attributes)){const a=attr.array,k=attr.itemSize;for(let i=0;i<attr.count;i+=3)for(let j=0;j<k;j++)[a[(i+1)*k+j],a[(i+2)*k+j]]=[a[(i+2)*k+j],a[(i+1)*k+j]];attr.needsUpdate=true;}
  geo.computeBoundingBox();geo.computeBoundingSphere();m.updateMatrix();
 }

}
export function definition(){
 const g=group(),links=[],joints=[];
 // Separate sheet-metal solids: there is no monolithic box behind the front apertures.
 const leftSkin=polygon([[-.266,.070],[.353,.070],[.353,.603],[-.231,.603],[-.252,.586]]);
 for(let col=0;col<4;col++)for(let row=0;row<17;row++)rectHole(leftSkin,-.175+col*.110,.125+row*.018,.098,.0048,.002);
 const leftGeo=new THREE.ExtrudeGeometry(leftSkin,{depth:D.skin,bevelEnabled:false,curveSegments:5});
 leftGeo.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,0)));
 addMesh(g,'left_side_vented_skin',leftGeo,navy,[-D.sideOuter,0,0]);
 box(g,'left_side_vent_interior',[.003,.451,.308],[-.182,-.010,.269],dark);
 for(let col=0;col<4;col++)for(let row=0;row<17;row++){
  const m=box(g,`left_side_pressed_louver_${col}_${row}`,[.008,.098,.006],[-.192,-.175+col*.110,.122+row*.018],navy);m.rotation.y=-.32;
 }
 box(g,'right_side_skin',[D.skin,.619,.533],[D.sideOuter-D.skin/2,.0435,.3365],navy);
 box(g,'roof_panel',[.386,.585,.009],[0,.0625,.6075],navy);
 rearDetails(g);
 box(g,'bottom_chassis',[.376,.616,.010],[0,.043,.075],dark);
 // Fold returns/seams are geometry. Rear internals were not measured and are not fabricated.
 for(const s of [-1,1]){
  box(g,`side_${s<0?'left':'right'}_lower_return`,[.012,.615,.015],[s*.189,.043,.079],navy);
  box(g,`side_${s<0?'left':'right'}_rear_seam`,[.004,.008,.515],[s*.193,.343,.3365],navy);
 }
 const frontStart=g.children.length;
 const upper=polygon(upperCorners),lower=polygon(lowerCorners);
 for(const [key,p] of Object.entries(panels))rectHole(['lowerLouver','outlets'].includes(key)?lower:upper,p.x,p.z,p.w,p.h,.006);
 frontPlate(g,'upper_sculpted_front_fascia',upper,-.336,.019,fascia);
 frontPlate(g,'lower_sculpted_front_fascia',lower,-.336,.019,fascia);
 // Separate mouldings with visible seam; all upper fascia pieces lean back together.

 for(const sign of [-1,1]){
  box(g,`fascia_${sign<0?'left':'right'}_upper_return`,[.018,.074,.347],[sign*.185,-.299,.427],fascia);
  box(g,`fascia_${sign<0?'left':'right'}_lower_return`,[.018,.061,.168],[sign*.185,-.3055,.152],fascia);
 }
 // Upper controls sit behind the moulded silver frame. Left black part is the USB cover,
 // not a carrying handle (the official USB illustration shows it hinged open).
 box(g,'control_panel_back',[.318,.008,.186],[0,-.330,.524],dark);
 box(g,'usb_port_cover',[.024,.010,.052],[-.138,-.340,.474],rubber);
 box(g,'usb_port_hinge',[.004,.007,.054],[-.152,-.336,.474],dark);
 // Original blank panel layout: dual LED windows, waveform area and right-hand LCD.
 box(g,'waveform_bezel',[.174,.003,.047],[-.039,-.336,.574],label);
 box(g,'waveform_face',[.167,.003,.040],[-.039,-.339,.574],dark);
 for(const [i,x] of [[0,-.084],[1,-.004]]){
  box(g,`display_${i}_bezel`,[.073,.004,.039],[x,-.337,.528],label);
  box(g,`display_${i}_glass`,[.065,.003,.031],[x,-.340,.528],screen);
 }
 box(g,'lcd_bezel',[.076,.004,.064],[.101,-.337,.555],label);
 box(g,'lcd_glass',[.067,.003,.054],[.101,-.340,.555],screen);
 for(const [i,x] of [[0,-.026],[1,.116]]){
  cylinderBetween(g,`parameter_knob_${i}_collar`,[x,-.338,.473],[x,-.344,.473],.013,dark,{radial:32});
  cylinderBetween(g,`parameter_knob_${i}`,[x,-.344,.473],[x,-.353,.473],.010,blue,{radial:32});
  box(g,`parameter_knob_${i}_index`,[.0017,.0015,.008],[x,-.354,.476],silver);
 }
 for(let i=0;i<4;i++)box(g,`mode_key_${i}`,[.012,.002,.012],[.145,-.341,.592-i*.025],label);
 for(const [i,x,z] of [[0,-.105,.575],[1,.025,.575],[2,-.060,.474],[3,.082,.474]])box(g,`function_key_${i}`,[.014,.002,.014],[x,-.341,z],label);
 for(let i=0;i<8;i++)pin(g,`status_indicator_${i}`,-.110+i*.019,-.342,.502,.0016,i===0?amber:label);
 louver(g,'upper_left_louver',panels.upperLouver);louver(g,'lower_left_louver',panels.lowerLouver);
 // Two connector bays are recessed independently, leaving deep silver framing.
 for(const [name,p] of [['utility',panels.utility],['output',panels.outlets]])box(g,`${name}_bay_back`,[p.w+.006,.007,p.h+.006],[p.x,-.3195,p.z],dark);
 // Middle right: protected small service connectors and covered switch. Placement photo-estimated.
 pin(g,'mains_indicator',.054,-.326,.368,.006,fascia);
 box(g,'utility_switch_surround',[.044,.008,.036],[.129,-.329,.365],fascia);
 box(g,'utility_switch_cap',[.029,.006,.024],[.129,-.336,.365],dark);
 for(const [i,x,z] of [[0,.052,.294],[1,.137,.291]]){
  frontRing(g,`utility_round_socket_${i}`,x,-.325,z,.021,.015,.010,silver);
  cylinderBetween(g,`utility_round_cap_${i}`,[x,-.333,z],[x,-.342,z],.0145,dark,{radial:28});
 }
 box(g,'utility_warning_strip',[.071,.0015,.009],[.115,-.324,.399],amber);
 // Lower right output terminals: real annular lips with 12 mm deep dark wells.
 for(const [i,x] of [[0,.048],[1,.136]]){
  frontRing(g,`output_${i}_insulating_ring`,x,-.325,.195,.022,.015,.013,dark);
  frontRing(g,`output_${i}_brass_lip`,x,-.338,.195,.014,.008,.006,brass);
  cylinderBetween(g,`output_${i}_well`,[x,-.322,.195],[x,-.324,.195],.008,dark,{radial:24});
  cylinderBetween(g,`output_${i}_unused_coolant_blank`,[x,-.324,.129],[x,-.328,.129],.009,dark,{radial:20});
 }
 cylinderBetween(g,'output_voltage_sense_cap',[.090,-.322,.225],[.090,-.337,.225],.006,dark,{radial:20});
 for(const [i,x,z] of [[0,-.18,.598],[1,.18,.598],[2,-.183,.433],[3,.183,.433],[4,-.182,.258],[5,.182,.258],[6,-.182,.09],[7,.182,.09]])pin(g,`fascia_fastener_${i}`,x,-.354,z,.004,dark);
 // Shear is an independent approximation of the observed upper-case rake, not a dimension from CAD.
 // Bake each front solid so normals and export keep the same shape in every consumer.
 for(const m of g.children.slice(frontStart)){
  m.updateMatrix();m.geometry.applyMatrix4(m.matrix);m.position.set(0,0,0);m.quaternion.identity();m.scale.set(1,1,1);
  const p=m.geometry.attributes.position;m.geometry.computeBoundingBox();
  const upper=m.geometry.boundingBox.max.z>.250;
  for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+(upper?D.upperFasciaLean*Math.max(0,p.getZ(i)-.250):.018));
  p.needsUpdate=true;m.geometry.computeVertexNormals();m.geometry.computeBoundingBox();m.geometry.computeBoundingSphere();m.updateMatrix();
 }
 // Independent moulded crown return, joining the tall crest to the lower blue roof.
 const cap=polygon([[-.275,.638],[-.258,.638],[-.247,.625],[-.228,.616],[-.209,.612],[-.209,.604],[-.248,.609],[-.275,.625]]);
 const capGeo=new THREE.ExtrudeGeometry(cap,{depth:.346,bevelEnabled:false,curveSegments:8});
 capGeo.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,0)));
 addMesh(g,'moulded_crown_return',capGeo,fascia,[-.173,0,0]);
 // Estimated closed lateral returns bridge the crown and narrow two-tier seam.
 const cheek=polygon([[-.285,.598],[-.299,.624],[-.282,.634],[-.258,.638],[-.247,.625],[-.228,.616],[-.209,.612],[-.206,.598]]);
 for(const sign of [-1,1]){
  const geo=new THREE.ExtrudeGeometry(cheek,{depth:.017,bevelEnabled:false,curveSegments:8});
  geo.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,0)));
  addMesh(g,`crown_side_cheek_${sign<0?'l':'r'}`,geo,fascia,[sign<0?-.191:.174,0,0]);
  box(g,`tier_seam_side_return_${sign<0?'l':'r'}`,[.016,.078,.025],[sign*.186,-.299,.2475],fascia);
 }

 // Side identification plate is blank original geometry, not a manufacturer image.
 box(g,'right_side_rating_plate',[.001,.074,.049],[.190,-.224,.526],fascia);
 for(const [i,z] of [[0,.539],[1,.531],[2,.523],[3,.515]])box(g,`rating_plate_rule_${i}`,[.001,.051,.0015],[.1905,-.224,z],label);
 box(g,'left_side_blank_identity_plate',[.001,.085,.055],[-.190,-.092,.501],fascia);
 // Two diagonal lifting eyes, not four. Opposite positions are roof fasteners.
 for(const [x,y] of [[-.156,-.204],[.156,.301]]){
  const tag=`${x<0?'l':'r'}${y<0?'f':'r'}`;
  cylinderBetween(g,`lifting_eye_${tag}_seat`,[x,y,.607],[x,y,.617],.011,silver,{radial:24});
  cylinderBetween(g,`lifting_eye_${tag}_stem`,[x,y,.612],[x,y,.625],.005,silver,{radial:20});
  torus(g,`lifting_eye_${tag}_ring`,[x,y,.6305],.0125,.0035,silver,[Math.PI/2,0,0]);
 }
 for(const [i,x,y] of [[0,-.156,.301],[1,.156,-.204]])cylinderBetween(g,`roof_fastener_${i}`,[x,y,.610],[x,y,.614],.006,silver,{radial:6});
 const yRear=D.d/2-D.rearOverhang,yFront=yRear-D.track[1];
 for(const [tag,x,y] of [['rl',-D.track[0]/2,yRear],['rr',D.track[0]/2,yRear],['fl',-D.track[0]/2,yFront],['fr',D.track[0]/2,yFront]])caster(g,tag,x,y);
 // Inherited primitive collision and frame contract: deliberately byte-identical URDF.
 links.push({name:'base_link',visual:g,collisions:[cb([D.w,D.d,.580],[0,0,.350]),cb([D.track[0]+.060,D.track[1]+.080,.060],[0,(yRear+yFront)/2,.030])]});
 links.push({name:'mount'});joints.push(fixed('mount_joint','base_link','mount',[0,0,0]));
 links.push({name:'torch_outlet'});joints.push(fixed('torch_outlet_joint','base_link','torch_outlet',[-.060,-.355,.300]));
 return{name:'daihen_wb_p352l',links,joints};
}
