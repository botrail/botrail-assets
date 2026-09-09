/** VGC10 102844, four supplied 30 mm cups directly on the body; no adaptor
 * plate or extension pipe installed. Two independent channel frame groups.
 * No fictional joint is introduced for the electrical vacuum on/off state.
 */
import {THREE,group,silver,dark,blue,box,cylinder,lathe,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
export function definition() {
 const body=group(),links=[],joints=[];
 // Coordinates measured from the tool-side QC mounting interface. The
 // manufacturer dimension 101.5 starts below that integral QC: +12 mm here.
 cylinder(body,'integral_tool_side_qc',.0355,.012,[0,0,.006],silver);
 box(body,'upper_shell',[.100,.100,.035],[0,0,.0295],dark);
 box(body,'lower_shell',[.086,.090,.040],[0,0,.067],dark);
 box(body,'shell_seam',[.100,.100,.003],[0,0,.047],silver);
 box(body,'channel_a_mark',[.012,.001,.006],[0,-.0455,.077],blue);
 box(body,'channel_b_mark',[.012,.001,.006],[0,.0455,.077],blue);
 links.push({name:'mount',visual:body,collisions:[cc(.0355,.012,[0,0,.006]),cb([.100,.100,.035],[0,0,.0295]),cb([.086,.090,.040],[0,0,.067])]});
 for(const [ch,y] of [['a',-.018],['b',.018]])for(const [i,x] of [[1,-.018],[2,.018]]) {
  const cup=group(),name=`cup_${ch}${i}`;
  cylinder(cup,'fitting',.006,.010,[0,0,.005],silver);
  lathe(cup,'silicone_bellows',[[.007,.006],[.013,.012],[.018,.015],[.021,.009],[.024,.015],[.0265,.015],[.0265,.013],[.024,.012],[.022,.007],[.017,.012],[.014,.010],[.008,.004]],blue);
  links.push({name,visual:cup,collisions:[cc(.006,.010,[0,0,.005]),cc(.015,.0195,[0,0,.01675])]});
  joints.push(fixed(name+'_joint','mount',name,[x,y,.087]));
  links.push({name:name+'_contact'});joints.push(fixed(name+'_contact_joint',name,name+'_contact',[0,0,.0265]));
 }
 for(const [name,y] of [['channel_a',-.018],['channel_b',.018],['tcp',0]]) {
  links.push({name});joints.push(fixed(name+'_joint','mount',name,[0,y,.1135]));
 }
 return {name:'onrobot_vgc10_102844',links,joints};
}
