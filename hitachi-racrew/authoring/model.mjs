/** Hitachi Racrew: published overall dimensions, own geometry.
 * Facts: Hitachi Industrial Products' product listing (iPROS, updated
 * 2020-03-24): W 916 x D 990 x H 380 mm, load 500 / 750 kg (the shelf or
 * pallet included), shelf or pallet transport, lithium-ion battery (24 h),
 * fixed-marker tracking. Hitachi Review 2014-12 (Table 1, Fig. 1) and
 * Hitachi's news release of 2017-04-12: 900 x 960 x 380 mm, 500 kg, 60 m/min
 * (80 m/min unloaded), automatic charging, a lifting mechanism and a
 * turntable as standard (turntable and spin turn turn the load alone or the
 * body alone).
 * Read here as: a 960 mm body with a bumper 15 mm proud at each end (the
 * listing's 990), 916 wide, 380 high to the top of the turntable.
 * Not published, estimated from the Hitachi Review photo: the turntable
 * (Ø 0.79 m with a square opening), the 15 mm ground clearance, the bumpers,
 * the corner lights, the windows and the charge port. The lift stroke and the
 * drive wheels are not modelled (no joint). No vendor CAD, mesh or drawing is
 * read.
 */
import * as THREE from 'three';
import {addMesh,namedMaterial,roundedBox,cylinderZ,roundedRectangle} from '@botrail/authoring/geometry.mjs';

export const dimensions={length:0.990,body:0.960,width:0.916,height:0.380,clearance:0.015,corner:0.12,
  skirt:0.040,shellTop:0.372,turntable:0.395,opening:[0.20,0.14],bumper:0.025};

const white=namedMaterial('shell_white','#eceeec',0.05,0.5);
const graphite=namedMaterial('skirt_graphite','#2b2e31',0.15,0.6);
const rubber=namedMaterial('bumper_black','#151617',0.0,0.85);
const band=namedMaterial('bumper_band','#8d9196',0.2,0.5);
const disc=namedMaterial('turntable_black','#1b1c1e',0.1,0.55);
const inside=namedMaterial('turntable_inside','#55595d',0.4,0.5);
const amber=namedMaterial('corner_light','#f08a1c',0.0,0.3);
const glass=namedMaterial('sensor_window','#0e1114',0.2,0.15);
const port=namedMaterial('charge_port','#1d1e20',0.2,0.6);
const cap=namedMaterial('top_cap','#9aa0a5',0.4,0.45);

const box=(size,xyz)=>({kind:'box',size,xyz});
const fixed=(name,parent,child,xyz=[0,0,0])=>({name,type:'fixed',parent,child,xyz});
const G=()=>new THREE.Group();

/** A rounded-rectangle slab `h` tall, its underside at z = 0; `bevel` rounds its top and bottom edges. */
function slab(w,d,r,h,bevel=0) {
  const geo=new THREE.ExtrudeGeometry(roundedRectangle(w-2*bevel,d-2*bevel,r-bevel),
    {depth:h-2*bevel,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,curveSegments:10});
  geo.translate(0,0,bevel);
  return geo;
}

export function definition() {
  const d=dimensions, links=[], joints=[];
  const L=d.body, W=d.width, r=d.corner;
  const skirtTop=d.clearance+d.skirt;

  // --- the body: graphite skirt, white shell with rounded corners, bumpers fore and aft ---
  const body=G();
  addMesh(body,'skirt',slab(L-0.016,W-0.016,r-0.008,d.skirt),graphite,[0,0,d.clearance]);
  addMesh(body,'shell',slab(L,W,r,d.shellTop-skirtTop,0.008),white,[0,0,skirtTop]);
  for(const sx of [1,-1]) {
    const x=sx*(L/2+d.bumper/2-0.010), z=d.clearance+0.012+0.035;
    addMesh(body,`bumper_${sx>0?'front':'back'}`,roundedBox([d.bumper,W-2*r+0.06,0.070],0.008,2),rubber,[x,0,z]);
    addMesh(body,`bumper_${sx>0?'front':'back'}_band`,roundedBox([d.bumper+0.001,0.050,0.072],0.004,1),band,[x,0,z]);
  }
  // a light window down each rounded corner (on the corner's curve: a quadratic, a quarter of r in from the corner)
  for(const [sx,sy] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
    const a=Math.atan2(sy,sx), cx=sx*(L/2-0.25*r)+Math.cos(a)*0.0015, cy=sy*(W/2-0.25*r)+Math.sin(a)*0.0015;
    const light=addMesh(body,`light_${sx>0?'f':'b'}${sy>0?'l':'r'}`,roundedBox([0.006,0.055,0.18],0.002,1),amber,[cx,cy,0.16]);
    light.rotation.z=a;
  }
  // the charge port and a slot on the front face, a sensor window in each side near the back
  addMesh(body,'charge_port',roundedBox([0.008,0.070,0.100],0.003,1),port,[L/2+0.002,0.22,0.20]);
  addMesh(body,'front_slot',roundedBox([0.006,0.012,0.035],0.002,1),port,[L/2+0.002,0.10,0.26]);
  for(const sy of [1,-1]) addMesh(body,`side_window_${sy>0?'left':'right'}`,roundedBox([0.100,0.008,0.075],0.003,1),glass,
    [-0.30,sy*(W/2-0.003),0.24]);
  // dome caps at the top corners
  for(const [sx,sy] of [[1,1],[1,-1],[-1,1],[-1,-1]])
    addMesh(body,`cap_${sx>0?'f':'b'}${sy>0?'l':'r'}`,cylinderZ(0.014,0.003,{radial:20}),cap,
      [sx*(L/2-0.07),sy*(W/2-0.07),d.shellTop+0.0015]);
  links.push({name:'base_footprint'});
  links.push({name:'base_link',visual:body,
    collisions:[box([d.length,W,d.height-d.clearance],[0,0,(d.height+d.clearance)/2])]});
  joints.push(fixed('base_link_joint','base_footprint','base_link'));

  // --- the turntable on top: what lifts a shelf and turns it (its own link, visual only) ---
  const top=G(), t=d.height-d.shellTop, [ox,oy]=d.opening;
  const shape=new THREE.Shape(); shape.absarc(0,0,d.turntable,0,2*Math.PI,false);
  const hole=new THREE.Path();
  hole.moveTo(-ox/2,-oy/2); hole.lineTo(-ox/2,oy/2); hole.lineTo(ox/2,oy/2); hole.lineTo(ox/2,-oy/2); hole.lineTo(-ox/2,-oy/2);
  shape.holes.push(hole);
  addMesh(top,'turntable',new THREE.ExtrudeGeometry(shape,{depth:t,bevelEnabled:false,curveSegments:48}),disc);
  // the well under the opening (the mechanism's floor and walls show through it)
  addMesh(top,'well_floor',new THREE.BoxGeometry(ox,oy,0.004),inside,[0,0,-0.028]);
  for(const s of [1,-1]) {
    addMesh(top,`well_x${s>0?'p':'n'}`,new THREE.BoxGeometry(0.004,oy,0.028),inside,[s*ox/2,0,-0.014]);
    addMesh(top,`well_y${s>0?'p':'n'}`,new THREE.BoxGeometry(ox,0.004,0.028),inside,[0,s*oy/2,-0.014]);
  }
  for(let k=0;k<8;k++) {
    const a=(k+0.5)*Math.PI/4;
    addMesh(top,`bolt${k}`,cylinderZ(0.008,0.002,{radial:12}),cap,[0.31*Math.cos(a),0.31*Math.sin(a),t-0.0005]);
  }
  links.push({name:'turntable',visual:top});
  joints.push(fixed('turntable_joint','base_link','turntable',[0,0,d.shellTop]));

  // --- frame: the turntable's top, where a lifted shelf rests (lowered) ---
  links.push({name:'deck'});
  joints.push(fixed('deck_joint','base_link','deck',[0,0,d.height]));
  // No invented mass/CoG/inertia; the lift and the turntable carry no joint (strokes not published).
  return {name:'racrew_reference',links,joints};
}
