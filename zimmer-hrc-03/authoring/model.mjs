/** HRC-03 SKU-specific references. Drawing: 70 mm body, 91.9 mm jaw datum,
 * 12.8..32.8 mm gap, 135.4 mm overall with depicted universal jaws.
 * Fingers beyond the universal jaws are application-specific, not invented.
 */
import {group,silver,dark,blue,box,cylinder,lathe,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
export const variants=['118505','118506','116787','126895'];
export function definition(sku='118505') {
 if(!variants.includes(sku))throw Error('Unknown HRC-03 variant');
 const body=group(),links=[],joints=[];
 lathe(body,'rounded_housing',[[0,0],[0,.0345],[.0059,.0345],[.007,.035],[.033,.035],[.045,.032],[.050,.021],[.088,.021],[.0919,.018],[.0919,0]],dark);
 cylinder(body,'mount_cover',.035,.006,[0,0,.003],silver);
 box(body,'connector_housing',[.042,.056,.022],[.046,0,.011],dark);
 box(body,'jaw_guide',[.0538,.025,.014],[0,0,.088],silver);
 box(body,'status_indicator',[.003,.001,.006],[0,-.021,.054],blue);
 cylinder(body,'force_setting',.003,.002,[0,-.022,.042],silver).rotation.x=Math.PI/2;
 if(sku==='126895') box(body,'magnetic_position_sensor',[.024,.002,.003],[0,-.022,.068],silver);
 links.push({name:'mount',visual:body,collisions:[cc(.035,.043,[0,0,.0215]),cc(.021,.0489,[0,0,.06745]),cb([.042,.056,.022],[.046,0,.011])]});
 for(const [side,sign] of [['left',1],['right',-1]]) {
  const jaw=group();
  box(jaw,'universal_jaw',[.0105,.016,.0435],[sign*.01165,0,.11365],silver);
  box(jaw,'jaw_carrier',[.016,.023,.013],[sign*.0144,0,.094],silver);
  for(const z of [.1069,.1179]) {
   const head=cylinder(jaw,`finger_fixing_${z}`,.0035,.002,[sign*.01165,-.009,z],dark);head.rotation.x=Math.PI/2;
  }
  links.push({name:side+'_jaw',visual:jaw,collisions:[cb([.0105,.016,.0435],[sign*.01165,0,.11365]),cb([.016,.023,.013],[sign*.0144,0,.094])]});
  joints.push({name:side==='left'?'jaw_joint':'jaw_mirror_joint',type:'prismatic',parent:'mount',child:side+'_jaw',axis:[sign,0,0],limit:{lower:0,upper:.01,velocity:.03,effort:50},...(side==='right'?{mimic:{joint:'jaw_joint',multiplier:1,offset:0}}:{})});
  links.push({name:side+'_contact'});joints.push(fixed(side+'_contact_joint',side+'_jaw',side+'_contact',[sign*.0064,0,.126]));
 }
 links.push({name:'tcp'});joints.push(fixed('tcp_joint','mount','tcp',[0,0,.1354]));
 return {name:'zimmer_hrc_03_'+sku,links,joints};
}
