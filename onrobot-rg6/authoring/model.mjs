import {plate,outline,capsule,dogbone,armPlate,boot,roundedPanel,reliefPanel} from './visual-geometry.mjs';
/** OnRobot RG6 independently authored photo-based visual.
 * Public datasheet v2.0: body and standard EPDM dimensions documented in provenance.json.
 * Legacy dimensions and complete URDF contract below are preserved, including
 * the old shoulder/bare-tip versus mount/padded-tip datum mismatch.
 * All subcomponent curves, seating and assembly geometry are estimates.
 */
import {THREE} from '../../authoring/tool-shapes.mjs';
import {addMesh,namedMaterial,roundedBox,cylinderBetween} from '../../authoring/geometry.mjs';
export const dimensions={bracket:.0561,offset:-.49,upper:1.3,tip:[-.05503,0,.05807],bodyDepth:.042,closedLength:.262};
const silver=namedMaterial('anodized_silver','#bfc5c8',.58,.34);
const dark=namedMaterial('housing_graphite','#444d54',.2,.48);
const rubber=namedMaterial('epdm_contact','#202528',0,.9);
const blue=namedMaterial('status_blue','#258cc0',.55,.33);
const G=()=>new THREE.Group();
const box=(g,name,size,at,mat= silver)=>addMesh(g,name,roundedBox(size,Math.min(...size)*.18,2),mat,at);
const col=(size,xyz,rpy=[0,0,0])=>({kind:'box',size,xyz,rpy});
const fixed=(name,parent,child,xyz=[0,0,0],rpy=[0,0,0])=>({name,type:'fixed',parent,child,xyz,rpy});

export function definition() {
  const links=[{name:'mount'}],joints=[],prefix='rg6_v2_gripper';
  function link(name,visual,collisions=[]) {links.push({name,visual,collisions});}
  const bracket=G();
  // Tool-side QC is an estimated visual shell, not an authored mating interface.
  cylinderBetween(bracket,'qc_blue_base',[0,0,0],[0,0,.008],0.031,blue,{radial:64});
  for(const x of [-1,1])for(const y of [-1,1])box(bracket,`qc_open_lug_${x}_${y}`,[.014,.014,.006],[x*.017,y*.017,.009],blue);
  cylinderBetween(bracket,'bracket_base',[0,0,.012],[0,0,.019],0.041,silver,{radial:64});
  box(bracket,'bracket_saddle',[0.064,0.04,.012],[0,0,.024]);
  for(const x of [-1,1]){
    const cheek=plate(bracket,`tilt_cheek_${x}`,capsule(0.013, 0.018),.004,0,silver);cheek.rotation.z=Math.PI/2;cheek.position.set(x*0.036000000000000004,0,0.03);
    cylinderBetween(bracket,`tilt_cap_${x}`,[x*0.032,0,0.0501],[x*0.037,0,0.0501],0.02,silver,{radial:64});
  }
  for(const sign of [-1,1])for(const y of [-0.014,0.014])cylinderBetween(bracket,`tilt_recess_${sign}_${y}`,[sign*0.037,y,0.0501],[sign*0.0373,y,0.0501],.0018,dark,{radial:24});
  box(bracket,'bracket_neck',[0.06,0.036000000000000004,0.0321],[0,0,0.04005],silver);
  link(`${prefix}_bracket`,bracket,[col([.082,.062,.0561],[0,0,.02805])]);
  joints.push(fixed(`${prefix}_bracket_joint`,'mount',`${prefix}_bracket`));
  const body=G();
  const shellProfile=dogbone(0.06,0.084,0.12,0.053);
  // Separate thin covers leave the moving-link channel open behind the head.
  for(const sign of [-1,1])plate(body,`sculpted_cover_${sign}`,shellProfile,.0025,sign*0.01975,silver);
  box(body,'stem_core',[0.057,0.036,.071],[0,0,.0355],dark);
  box(body,'head_drive_core',[.032,0.034,.022],[0,0,0.085],dark);
  for(const sign of [-1,1])for(const x of [-.010,.010])cylinderBetween(body,`head_recess_${sign}_${x}`,[x,sign*0.021, 0.104],[x,sign*0.021300000000000003,0.104],.00125,dark,{radial:24});
  for(const side of [-1,1])for(const sign of [-1,1])cylinderBetween(body,`truss_pivot_socket_${side}_${sign}`,[side*-0.0105,sign*0.012,0.1111],[side*-0.0105,sign*0.0208,0.1111],0.004,silver,{radial:40});
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
      // Distinct outer cast link and inner tie plates, with rounded pivot eyes.
      const outer=part==='moment_arm';
      const layer=outer?0.0164:0.012;
      for(const sign of [-1,1])armPlate(visual,`sculpted_link_${sign}`,dimensions.tip,sign*layer,0.004,0.0055,silver);
      for(const [i,at] of [[0,0,0],dimensions.tip].entries()){
        for(const sign of [-1,1])cylinderBetween(visual,`pivot_axle_${i}_${sign}`,[at[0],sign*(layer-.0015),at[2]],[at[0],sign*(layer+.0015),at[2]],0.0048,silver,{radial:40});
        for(const sign of [-1,1]){
          cylinderBetween(visual,`pivot_boss_${i}_${sign}`,[at[0],sign*(layer+.001),at[2]],[at[0],sign*(layer+0.003),at[2]],0.004895999999999999,silver,{radial:40});
          cylinderBetween(visual,`pivot_recess_${i}_${sign}`,[at[0],sign*(layer+0.003),at[2]],[at[0],sign*(layer+0.0031999999999999997),at[2]],0.0023120000000000003,dark,{radial:24});
        }
      }
      if(!outer){
        for(const sign of [-1,1]){
          const guard=plate(visual,`safety_switch_cover_${sign}`,reliefPanel(0.022,v.length()*.61,.002,-.004),.002,sign*(layer+.0011),dark);
          guard.rotation.y=Math.atan2(v.x,v.z);guard.position.copy(v.clone().multiplyScalar(.19)).add(new THREE.Vector3(v.z,0,-v.x).normalize().multiplyScalar(-0.004));
        }
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
    const bootTop=endZ+.029;
    box(tip,'finger_carrier',[.005,.0144,.033],[innerX-.0085,0,bootTop-.021]);
    // Broad carrier webs connect both parallelogram endpoints to the seated boot.
    for(const sign of [-1,1])plate(tip,`carrier_web_${sign}`,outline([[-.019,-.027],[-.008,-.031],[innerX-.003,endZ-.006],[innerX-.007,endZ],[innerX-.016,endZ-.002],[-.021,-.017]]),.003,sign*.0065,silver);
    cylinderBetween(tip,'carrier_bridge',[0,-.012,0],[0,.012,0],.005,silver,{radial:40});
    cylinderBetween(tip,'carrier_lower_axle',[-0.0133,-0.0164,-0.0231],[-0.0133,0.0164,-0.0231],0.0035,silver,{radial:40});
    link(`${name}_finger_tip`,tip,[col([.014,.03,.027],[innerX-.01,0,endZ-.015])]);
    joints.push({name:`${name}_finger_tip_joint`,type:'revolute',parent:`${name}_truss_arm`,child:`${name}_finger_tip`,
      xyz:dimensions.tip,rpy:[0,-dimensions.offset,0],axis:[0,-1,0],limit:{lower:0,upper:dimensions.upper,effort:10,velocity:.5},
      mimic:{joint:`${prefix}_joint`,multiplier:1,offset:0}});
    const flex=G(), padCenter=[innerX-.0042-.0098,0,endZ-.015-.0218];
    // Actual EPDM external envelope; X contact plane retains legacy stroke.
    boot(flex,'rubber_pad',innerX-.0098,.025,.037,.01315,.005,endZ+.029-.0218,rubber);
    link(`${name}_flex_finger`,flex,[col([.0084,.03,.03],padCenter)]);
    joints.push(fixed(`${name}_flex_finger_joint`,`${name}_finger_tip`,`${name}_flex_finger`,[.0098,0,.0218]));
  }
  return {name:'onrobot_rg6_reference',links,joints};
}
