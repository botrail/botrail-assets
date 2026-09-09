/** Ewellix LIFTKIT-UR-800-xx00-620: published numerical dimensions, own geometry.
 * PDB 81: column 875 mm retracted / 1675 extended, plates 15 mm each.
 * No source CAD/mesh is read. Cross sections 163 / 146 / 129 mm.
 */
import * as THREE from 'three';
import {addMesh,namedMaterial,roundedBox,roundedRectangle} from '@botrail/authoring/geometry.mjs';
export const dimensions={stroke:.8,retracted:.875,basePlate:.015,topPlate:.015,widths:[.163,.146,.129]};
const aluminium=namedMaterial('extruded_aluminium','#c0c5ca',.7,.3);
const dark=namedMaterial('polymer_wiper','#30373b',.05,.7);
const plate=namedMaterial('mounting_plate','#6b7176',.65,.4);
const blue=namedMaterial('product_marker','#318eb6',.1,.5);
const col=(size,xyz)=>({kind:'box',size,xyz});
const fixed=(name,parent,child,z=0)=>({name,type:'fixed',parent,child,xyz:[0,0,z]});
const G=()=>new THREE.Group();

export function definition() {
  const links=[{name:'base_link'}],joints=[];
  const bottom=G();
  addMesh(bottom,'lower_plate',roundedBox([.2,.2,.015],.003,2),plate,[0,0,.0075]);
  links.push({name:'lift_plate_link',visual:bottom,collisions:[col([.2,.2,.015],[0,0,.0075])]});
  joints.push(fixed('lift_plate_joint','base_link','lift_plate_link'));
  // Link offsets preserve the previous 905 mm installed mount datum. Correcting
  // the plate thickness to 15 mm moves 3 mm into the column's first offset.
  const heights=[.8207,.8,.838], names=['lift_base_link','lift_lower_link','lift_upper_link'];
  dimensions.widths.forEach((width,i)=>{
    const g=G(), height=heights[i],wall=.003;
    const shape=roundedRectangle(width,width,.008);
    const hole=roundedRectangle(width-2*wall,width-2*wall,.005);
    shape.holes.push(hole);
    const shell=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,curveSegments:6});
    addMesh(g,'column_sleeve',shell,aluminium);
    if(i<2) {
      const seal=roundedRectangle(width+.001,width+.001,.008);
      seal.holes.push(roundedRectangle(dimensions.widths[i+1]+.001,dimensions.widths[i+1]+.001,.007));
      addMesh(g,'wiper',new THREE.ExtrudeGeometry(seal,{depth:.009,bevelEnabled:false,curveSegments:6}),dark,[0,0,height-.009]);
    }
    if(i===0) addMesh(g,'identification_panel',roundedBox([.036,.001,.024],.0003,2),blue,[0,-width/2-.001,height-.09]);
    // Hollow walls retain telescoping gaps, unlike one solid box per stage.
    const collisions=[];
    for(const sign of [-1,1]) {
      collisions.push(col([wall,width,height],[sign*(width-wall)/2,0,height/2]));
      collisions.push(col([width-2*wall,wall,height],[0,sign*(width-wall)/2,height/2]));
    }
    links.push({name:names[i],visual:g,collisions});
  });
  joints.push(fixed('lift_base_joint','lift_plate_link','lift_base_link',.015));
  joints.push({name:'lift_lower_joint',type:'prismatic',parent:'lift_base_link',child:'lift_lower_link',xyz:[0,0,.030],axis:[0,0,1],
    limit:{lower:0,upper:.4,velocity:.04,effort:1500}});
  joints.push({name:'lift_upper_joint',type:'prismatic',parent:'lift_lower_link',child:'lift_upper_link',xyz:[0,0,.007],axis:[0,0,1],
    limit:{lower:0,upper:.4,velocity:.04,effort:1500},mimic:{joint:'lift_lower_joint',multiplier:1,offset:0}});
  const top=G();addMesh(top,'robot_fixation_plate',roundedBox([.251,.251,.015],.003,2),plate,[0,0,.0075]);
  links.push({name:'lift_mount_link',visual:top,collisions:[col([.251,.251,.015],[0,0,.0075])]},{name:'lift_mount'});
  joints.push(fixed('lift__mount_link_joint','lift_upper_link','lift_mount_link',.838),fixed('lift_mount_joint','lift_mount_link','lift_mount',.015));
  // No invented per-stage mass/CoG/inertia. The recipe carries the 26 kg catalog mass.
  return {name:'ewellix_liftkit_ur620_reference',links,joints};
}
