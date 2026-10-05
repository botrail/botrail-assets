/** OnRobot RG2 (current body with the integral tool-side Quick Changer):
 * independent shell and linkage from published numerical dimensions.
 * Datasheet v1.8 p.2/p.9: 213 x 149 x 36 mm, 110 mm total stroke, 0.78 kg,
 * 75 mm bracket width, 14 mm fingertip adapter, 20.2 x 29.8 standard fingertip.
 * Pivot heights from the public ROS description (Osaka University Harada
 * Laboratory, MIT: outer/inner knuckle at z 125.797 / 142.297 mm), arm vector and
 * zero-pose offset from the public ROS configuration (inria rg2_v1: 55 mm arm,
 * -0.772 rad). The closing limit is solved so the pads travel exactly 110 mm.
 * No community or vendor mesh is read.
 */
import {THREE,addMesh,namedMaterial} from '../../authoring/tool-shapes.mjs';
import {roundedBox,cylinderBetween} from '../../authoring/geometry.mjs';
export const dimensions={
  bracket:.039,                       // mount (QC tool-side face) -> body origin
  moment:[-.017178,0,.125797-.039],   // outer knuckle pivot, body frame
  truss:[-.007678,0,.142297-.039],    // inner knuckle pivot, body frame
  tip:[-.0256,0,.04868],              // arm vector pivot -> fingertip carrier pivot (55.0 mm)
  offset:-.772,                       // zero-pose (open) arm angle
  upper:1.30524,                      // solved: 110.00 mm pad travel
  bodyDepth:.036,closedLength:.213,stroke:.110,
  pad:[.007,.0202,.0298],             // rubber fingertip: thickness x width x length
};
const silver=namedMaterial('anodized_silver','#bfc4c9',.65,.3);
const pale=namedMaterial('housing_pale_grey','#d7dbde',.1,.5);
const dark=namedMaterial('housing_graphite','#444d54',.2,.48);
const rubber=namedMaterial('epdm_contact','#202528',0,.9);
const blue=namedMaterial('status_blue','#69b5d7',.1,.4);
const G=()=>new THREE.Group();
const box=(g,name,size,at,mat=silver)=>addMesh(g,name,roundedBox(size,Math.min(...size)*.18,2),mat,at);
const col=(size,xyz,rpy=[0,0,0])=>({kind:'box',size,xyz,rpy});
const fixed=(name,parent,child,xyz=[0,0,0],rpy=[0,0,0])=>({name,type:'fixed',parent,child,xyz,rpy});

export function definition() {
  const d=dimensions, links=[{name:'mount'}], joints=[], prefix='rg2_v2_gripper';
  function link(name,visual,collisions=[]) {links.push({name,visual,collisions});}
  const bracket=G();
  cylinderBetween(bracket,'qc_tool_side',[0,0,0],[0,0,.012],.0355,silver,{radial:48});
  box(bracket,'tilting_bracket',[.075,.036,.014],[0,0,.019],pale);
  box(bracket,'bracket_neck',[.054,.036,.013],[0,0,.0325],pale);
  // Quick Changer latch, tilt screws and the hole pattern are intentionally not invented.
  link(`${prefix}_bracket`,bracket,[col([.075,.036,.039],[0,0,.0195])]);
  joints.push(fixed(`${prefix}_bracket_joint`,'mount',`${prefix}_bracket`));
  const body=G();
  box(body,'upper_shell',[.054,.036,.070],[0,0,.035],pale);
  box(body,'drive_shell',[.065,.036,.050],[0,0,.090],pale);
  box(body,'silver_face',[.044,.002,.056],[0,-.0182,.036]);
  box(body,'status_window',[.012,.002,.004],[0,-.0192,.016],blue);
  for (const x of [-.0152,.0152]) cylinderBetween(body,`body_fastener_${x<0?'l':'r'}`,[x,-.0205,.094],[x,-.0175,.094],.0025,silver,{radial:12});
  link(`${prefix}_body`,body,[col([.054,.036,.070],[0,0,.035]),col([.065,.036,.050],[0,0,.090])]);
  joints.push(fixed(`${prefix}_body_joint`,`${prefix}_bracket`,`${prefix}_body`,[0,0,d.bracket]));
  const graspZ=d.closedLength-d.bracket-d.pad[2]/2;   // closed-pose pad centre
  links.push({name:`${prefix}_grasp_frame`},{name:'tcp'});
  joints.push(fixed(`${prefix}_grasp_frame_joint`,`${prefix}_body`,`${prefix}_grasp_frame`,[0,0,graspZ]),fixed('tcp_joint',`${prefix}_grasp_frame`,'tcp'));
  const theta=d.offset+d.upper;
  const tipClosedX=d.truss[0]+Math.cos(theta)*d.tip[0]+Math.sin(theta)*d.tip[2];
  const tipClosedZ=d.truss[2]-Math.sin(theta)*d.tip[0]+Math.cos(theta)*d.tip[2];
  const innerX=-tipClosedX, endZ=d.closedLength-d.bracket-tipClosedZ;
  for(let side=1;side<=2;side++) {
    const name=`${prefix}_finger_${side}`;
    links.push({name:`${name}_origin`});
    joints.push(fixed(`${name}_origin_joint`,`${prefix}_body`,`${name}_origin`,[0,0,0],[0,0,side===1?0:Math.PI]));
    for (const part of ['moment_arm','truss_arm']) {
      const visual=G(), v=new THREE.Vector3(...d.tip), midpoint=v.clone().multiplyScalar(.5);
      // Two side plates with a real open channel between them (36 mm body).
      for(const y of [-.015,.015]) {
        const mesh=box(visual,`bar_${y<0?'front':'back'}`,[.009,.004,v.length()],[midpoint.x,y,midpoint.z],dark);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),v.clone().normalize());
      }
      for(const [i,at] of [[0,0,0],d.tip].entries()) {
        cylinderBetween(visual,`pin_${i}`,[at[0],-.019,at[2]],[at[0],.019,at[2]],.0055,silver,{radial:32});
        cylinderBetween(visual,`pin_cap_${i}`,[at[0],-.020,at[2]],[at[0],-.019,at[2]],.0025,dark,{radial:16});
      }
      const rpy=[0,Math.atan2(v.x,v.z),0];
      link(`${name}_${part}`,visual,[-.015,.015].map(y=>col([.009,.004,v.length()+.008],[midpoint.x,y,midpoint.z],rpy)));
      const master=part==='moment_arm'&&side===1;
      joints.push({name:part==='moment_arm'?`${prefix}${side===1?'':'_mirror'}_joint`:`${name}_${part}_joint`,
        type:'revolute',parent:`${name}_origin`,child:`${name}_${part}`,axis:[0,1,0],
        xyz:part==='moment_arm'?d.moment:d.truss,rpy:[0,d.offset,0],
        limit:{lower:0,upper:d.upper,velocity:.5,effort:10},
        ...(master?{}:{mimic:{joint:`${prefix}_joint`,multiplier:1,offset:0}})});
    }
    // Fingertip carrier: 14 mm wide adapter behind the pad, pivoting at the truss arm end.
    const tip=G(), carrier=[innerX-d.pad[0]-.004,0,endZ-d.pad[2]+.013];
    box(tip,'fingertip_adapter',[.008,.014,.026],carrier);
    cylinderBetween(tip,'carrier_pin',[0,-.011,0],[0,.011,0],.0045,silver,{radial:24});
    link(`${name}_finger_tip`,tip,[col([.008,.014,.026],carrier)]);
    joints.push({name:`${name}_finger_tip_joint`,type:'revolute',parent:`${name}_truss_arm`,child:`${name}_finger_tip`,
      xyz:d.tip,rpy:[0,-d.offset,0],axis:[0,-1,0],limit:{lower:0,upper:d.upper,effort:10,velocity:.5},
      mimic:{joint:`${prefix}_joint`,multiplier:1,offset:0}});
    // Standard EPDM fingertip (PN 100669): flat inner contact plane, 20.2 x 29.8 mm.
    const flex=G(), padCenter=[innerX-d.pad[0]/2,0,endZ-d.pad[2]/2];
    addMesh(flex,'rubber_pad',new THREE.BoxGeometry(...d.pad),rubber,[0,0,0]);
    link(`${name}_flex_finger`,flex,[col(d.pad,[0,0,0])]);
    joints.push(fixed(`${name}_flex_finger_joint`,`${name}_finger_tip`,`${name}_flex_finger`,padCenter));
  }
  return {name:'onrobot_rg2_reference',links,joints};
}
