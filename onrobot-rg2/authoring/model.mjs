import {plate,outline,capsule,dogbone,armPlate,boot,roundedPanel,reliefPanel} from './visual-geometry.mjs';
/** OnRobot RG2 independently authored photo-based visual.
 * Public datasheet v1.8: body and standard EPDM dimensions documented in provenance.json.
 * Legacy dimensions and complete URDF contract below are preserved, including
 * the old shoulder/bare-tip versus mount/padded-tip datum mismatch.
 * All subcomponent curves, seating and assembly geometry are estimates.
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
const silver=namedMaterial('anodized_silver','#bfc5c8',.58,.34);
const pale=namedMaterial('housing_pale_grey','#d7dbde',.1,.5);
const dark=namedMaterial('housing_graphite','#444d54',.2,.48);
const rubber=namedMaterial('epdm_contact','#202528',0,.9);
const blue=namedMaterial('status_blue','#258cc0',.55,.33);
const G=()=>new THREE.Group();
const box=(g,name,size,at,mat=silver)=>addMesh(g,name,roundedBox(size,Math.min(...size)*.18,2),mat,at);
const col=(size,xyz,rpy=[0,0,0])=>({kind:'box',size,xyz,rpy});
const fixed=(name,parent,child,xyz=[0,0,0],rpy=[0,0,0])=>({name,type:'fixed',parent,child,xyz,rpy});

export function definition() {
  const d=dimensions, links=[{name:'mount'}], joints=[], prefix='rg2_v2_gripper';
  function link(name,visual,collisions=[]) {links.push({name,visual,collisions});}
  const bracket=G();
  // Tool-side QC is an estimated visual shell, not an authored mating interface.
  cylinderBetween(bracket,'qc_blue_base',[0,0,0],[0,0,.008],0.0355,blue,{radial:64});
  for(const x of [-1,1])for(const y of [-1,1])box(bracket,`qc_open_lug_${x}_${y}`,[.014,.014,.006],[x*.017,y*.017,.009],blue);
  cylinderBetween(bracket,'bracket_base',[0,0,.012],[0,0,.019],0.0375,silver,{radial:64});
  box(bracket,'bracket_saddle',[0.056999999999999995,0.033999999999999996,.012],[0,0,.024]);
  for(const x of [-1,1]){
    const cheek=plate(bracket,`tilt_cheek_${x}`,capsule(0.006, 0.015),.004,0,silver);cheek.rotation.z=Math.PI/2;cheek.position.set(x*0.0325,0,0.027);
    cylinderBetween(bracket,`tilt_cap_${x}`,[x*0.028499999999999998,0,0.033],[x*0.0335,0,0.033],0.016999999999999998,silver,{radial:64});
  }
  for(const sign of [-1,1])for(const y of [-0.012,0.012])cylinderBetween(bracket,`tilt_recess_${sign}_${y}`,[sign*0.0335,y,0.033],[sign*0.0338,y,0.033],.0018,dark,{radial:24});
  box(bracket,'bracket_neck',[0.054,0.03,0.015],[0,0,0.0315],silver);
  link(`${prefix}_bracket`,bracket,[col([.075,.036,.039],[0,0,.0195])]);
  joints.push(fixed(`${prefix}_bracket_joint`,'mount',`${prefix}_bracket`));
  const body=G();
  const shellProfile=dogbone(0.054,0.065,0.115,0.052);
  // Separate thin covers leave the moving-link channel open behind the head.
  for(const sign of [-1,1])plate(body,`sculpted_cover_${sign}`,shellProfile,.0025,sign*0.016749999999999998,silver);
  box(body,'stem_core',[0.051,0.03,.071],[0,0,.0355],dark);
  box(body,'head_drive_core',[.020,0.028,.022],[0,0,0.083],dark);
  for(const sign of [-1,1])for(const x of [-.010,.010])cylinderBetween(body,`head_recess_${sign}_${x}`,[x,sign*0.018, 0.099],[x,sign*0.0183,0.099],.00125,dark,{radial:24});
  for(const side of [-1,1])for(const sign of [-1,1])cylinderBetween(body,`truss_pivot_socket_${side}_${sign}`,[side*-0.007678,sign*0.009,0.103297],[side*-0.007678,sign*0.0178,0.103297],0.003,silver,{radial:40});
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
      // Distinct outer cast link and inner tie plates, with rounded pivot eyes.
      const outer=part==='moment_arm';
      const layer=outer?0.0139:0.009;
      for(const sign of [-1,1])armPlate(visual,`sculpted_link_${sign}`,d.tip,sign*layer,0.003,0.0042,silver);
      for(const [i,at] of [[0,0,0],d.tip].entries()){
        for(const sign of [-1,1])cylinderBetween(visual,`pivot_axle_${i}_${sign}`,[at[0],sign*(layer-.0015),at[2]],[at[0],sign*(layer+.0015),at[2]],0.0035,silver,{radial:40});
        for(const sign of [-1,1]){
          cylinderBetween(visual,`pivot_boss_${i}_${sign}`,[at[0],sign*(layer+.001),at[2]],[at[0],sign*(layer+0.0025),at[2]],0.0037439999999999995,silver,{radial:40});
          cylinderBetween(visual,`pivot_recess_${i}_${sign}`,[at[0],sign*(layer+0.0025),at[2]],[at[0],sign*(layer+0.0027),at[2]],0.001768,dark,{radial:24});
        }
      }
      if(!outer){
        for(const sign of [-1,1]){
          const guard=plate(visual,`safety_switch_cover_${sign}`,reliefPanel(0.016,v.length()*.61,.002,-.0025),.002,sign*(layer+.001),dark);
          guard.rotation.y=Math.atan2(v.x,v.z);guard.position.copy(v.clone().multiplyScalar(.19)).add(new THREE.Vector3(v.z,0,-v.x).normalize().multiplyScalar(-0.003));
        }
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
    box(tip,'fingertip_adapter',[.004,.0116,.027],[innerX-.007,0,endZ+.019-.018]);
    for(const sign of [-1,1])plate(tip,`carrier_web_${sign}`,outline([[-.015,-.020],[-.006,-.024],[innerX-.003,endZ-.005],[innerX-.006,endZ],[innerX-.012,endZ-.001],[-.017,-.014]]),.0025,sign*.005,silver);
    cylinderBetween(tip,'carrier_pin',[0,-.011,0],[0,.011,0],.0045,silver,{radial:24});
    cylinderBetween(tip,'carrier_lower_axle',[-0.0095,-0.0139,-0.0165],[-0.0095,0.0139,-0.0165],0.003,silver,{radial:40});
    link(`${name}_finger_tip`,tip,[col([.008,.014,.026],carrier)]);
    joints.push({name:`${name}_finger_tip_joint`,type:'revolute',parent:`${name}_truss_arm`,child:`${name}_finger_tip`,
      xyz:d.tip,rpy:[0,-d.offset,0],axis:[0,-1,0],limit:{lower:0,upper:d.upper,effort:10,velocity:.5},
      mimic:{joint:`${prefix}_joint`,multiplier:1,offset:0}});
    // Standard EPDM external envelope; old contact box is preserved separately.
    const flex=G(), padCenter=[innerX-d.pad[0]/2,0,endZ-d.pad[2]/2];
    boot(flex,'rubber_pad',d.pad[0]/2,.0202,.0298,.0114,.00445,d.pad[2]/2+.019,rubber);
    link(`${name}_flex_finger`,flex,[col(d.pad,[0,0,0])]);
    joints.push(fixed(`${name}_flex_finger_joint`,`${name}_finger_tip`,`${name}_flex_finger`,padCenter));
  }
  return {name:'onrobot_rg2_reference',links,joints};
}
