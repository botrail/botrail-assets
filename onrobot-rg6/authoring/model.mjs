/** RG6 v2: independent shell and linkage from published numerical dimensions.
 * Community joint origins retained; no community/vendor mesh is read.
 * 262 x 212 x 42 mm and 160 mm stroke: manufacturer datasheet v2.0.
 */
import * as THREE from 'three';
import {addMesh,namedMaterial,roundedBox,cylinderBetween} from '@botrail/authoring/geometry.mjs';
export const dimensions={bracket:.0561,offset:-.49,upper:1.3,tip:[-.05503,0,.05807],bodyDepth:.042,closedLength:.262};
const silver=namedMaterial('anodized_silver','#bfc4c9',.65,.3);
const dark=namedMaterial('housing_graphite','#444d54',.2,.48);
const rubber=namedMaterial('epdm_contact','#202528',0,.9);
const blue=namedMaterial('status_blue','#69b5d7',.1,.4);
const G=()=>new THREE.Group();
const box=(g,name,size,at,mat= silver)=>addMesh(g,name,roundedBox(size,Math.min(...size)*.18,2),mat,at);
const col=(size,xyz,rpy=[0,0,0])=>({kind:'box',size,xyz,rpy});
const fixed=(name,parent,child,xyz=[0,0,0],rpy=[0,0,0])=>({name,type:'fixed',parent,child,xyz,rpy});

export function definition() {
  const links=[{name:'mount'}],joints=[],prefix='rg6_v2_gripper';
  function link(name,visual,collisions=[]) {links.push({name,visual,collisions});}
  const bracket=G();
  box(bracket,'quick_changer_envelope',[.062,.062,.012],[0,0,.006],dark);
  box(bracket,'tilting_bracket',[.082,.042,.025],[0,0,.0245]);
  box(bracket,'bracket_neck',[.06,.042,.0191],[0,0,.04655]);
  // Hole pattern and Quick Changer latch are intentionally not invented.
  link(`${prefix}_bracket`,bracket,[col([.082,.062,.0561],[0,0,.02805])]);
  joints.push(fixed(`${prefix}_bracket_joint`,'mount',`${prefix}_bracket`));
  const body=G();
  box(body,'upper_shell',[.06,.042,.078],[0,0,.036],dark);
  box(body,'drive_shell',[.084,.042,.055],[0,0,.0925],dark);
  box(body,'silver_face',[.053,.002,.065],[0,-.0212,.035]);
  box(body,'status_window',[.014,.002,.004],[0,-.0225,.02],blue);
  for (const x of [-.02,.02]) cylinderBetween(body,`body_fastener_${x<0?'l':'r'}`,[x,-.024,.09],[x,-.021,.09],.003,silver,{radial:12});
  link(`${prefix}_body`,body,[col([.06,.042,.078],[0,0,.036]),col([.084,.042,.055],[0,0,.0925])]);
  joints.push(fixed(`${prefix}_body_joint`,`${prefix}_bracket`,`${prefix}_body`,[0,0,dimensions.bracket]));
  links.push({name:`${prefix}_grasp_frame`},{name:'tcp'});
  joints.push(fixed(`${prefix}_grasp_frame_joint`,`${prefix}_body`,`${prefix}_grasp_frame`,[0,0,.212]),fixed('tcp_joint',`${prefix}_grasp_frame`,'tcp'));
  const theta=dimensions.offset+dimensions.upper;
  const tipClosedX=-.0105+Math.cos(theta)*dimensions.tip[0]+Math.sin(theta)*dimensions.tip[2];
  const tipClosedZ=.1111-Math.sin(theta)*dimensions.tip[0]+Math.cos(theta)*dimensions.tip[2];
  const innerX=-tipClosedX, endZ=dimensions.closedLength-dimensions.bracket-tipClosedZ;
  for(let side=1;side<=2;side++) {
    const name=`${prefix}_finger_${side}`;
    links.push({name:`${name}_origin`});
    joints.push(fixed(`${name}_origin_joint`,`${prefix}_body`,`${name}_origin`,[0,0,0],[0,0,side===1?0:Math.PI]));
    for (const part of ['moment_arm','truss_arm']) {
      const visual=G(), v=new THREE.Vector3(...dimensions.tip), midpoint=v.clone().multiplyScalar(.5);
      // Two side plates with a real open channel between them.
      for(const y of [-.018,.018]) {
        const mesh=box(visual,`bar_${y<0?'front':'back'}`,[.011,.005,v.length()], [midpoint.x,y,midpoint.z]);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),v.clone().normalize());
      }
      for(const [i,at] of [[0,0,0],dimensions.tip].entries()) {
        cylinderBetween(visual,`pin_${i}`,[at[0],-.023,at[2]],[at[0],.023,at[2]],.007,silver,{radial:32});
        cylinderBetween(visual,`pin_cap_${i}`,[at[0],-.024,at[2]],[at[0],-.023,at[2]],.003,dark,{radial:16});
      }
      const rpy=[0,Math.atan2(v.x,v.z),0];
      link(`${name}_${part}`,visual,[-.018,.018].map(y=>col([.011,.005,v.length()+.01],[midpoint.x,y,midpoint.z],rpy)));
      const master=part==='moment_arm'&&side===1;
      joints.push({name:part==='moment_arm'?`${prefix}${side===1?'':'_mirror'}_joint`:`${name}_${part}_joint`,
        type:'revolute',parent:`${name}_origin`,child:`${name}_${part}`,axis:[0,1,0],
        xyz:part==='moment_arm'?[-.0238,0,.088]:[-.0105,0,.1111],rpy:[0,dimensions.offset,0],
        limit:{lower:0,upper:dimensions.upper,velocity:.5,effort:10},
        ...(master?{}:{mimic:{joint:`${prefix}_joint`,multiplier:1,offset:0}})});
    }
    const tip=G();
    box(tip,'finger_carrier',[.014,.03,.027],[innerX-.01,0,endZ-.015]);
    // Carrier also joins the two ends of the parallelogram.
    cylinderBetween(tip,'carrier_bridge',[0,0,0],[-.0133,0,-.0231],.008,silver,{radial:24});
    link(`${name}_finger_tip`,tip,[col([.014,.03,.027],[innerX-.01,0,endZ-.015])]);
    joints.push({name:`${name}_finger_tip_joint`,type:'revolute',parent:`${name}_truss_arm`,child:`${name}_finger_tip`,
      xyz:dimensions.tip,rpy:[0,-dimensions.offset,0],axis:[0,-1,0],limit:{lower:0,upper:dimensions.upper,effort:10,velocity:.5},
      mimic:{joint:`${prefix}_joint`,multiplier:1,offset:0}});
    const flex=G(), padCenter=[innerX-.0042-.0098,0,endZ-.015-.0218];
    // Flat inner contact plane with an 8.4 mm thick, 30 mm wide standard pad.
    addMesh(flex,'rubber_pad',new THREE.BoxGeometry(.0084,.03,.03),rubber,padCenter);
    link(`${name}_flex_finger`,flex,[col([.0084,.03,.03],padCenter)]);
    joints.push(fixed(`${name}_flex_finger_joint`,`${name}_finger_tip`,`${name}_flex_finger`,[.0098,0,.0218]));
  }
  return {name:'onrobot_rg6_reference',links,joints};
}
