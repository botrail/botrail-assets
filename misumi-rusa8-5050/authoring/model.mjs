/** MISUMI RUSA8-5050-W500-D400-JC — aluminium frame stand unit for a vertical
 * articulated robot's controller, in the configuration whose reference weight is
 * published (W 500, D 400, adjusters + casters: 23.4 kg).
 * Product page, outline drawing and the unit's parts list (Ver.1.1): frame of
 * HFS8-5050 — W-6 x 2 (the outer members; HFC8-5050-S caps make up the 6 mm),
 * D-100 x 2 and W-100 x 1 — so the frame is 50 mm high; adjuster pads NFJN16-100
 * (dia. 75, M16) at 75 mm from each end of W and 95 mm from each side of D; casters
 * CHJF50S (swivel, dia. 50) on dedicated foot bases HAJPRC5050; 84 mm from the floor to
 * the underside of the frame on the casters (the adjusters reach 61 to 130 mm).
 * The unit is sold by the millimetre (W 500-800, D 400-800) with four foot options;
 * only this one configuration is modelled. Foot base outline and the caster position
 * on it are read from the drawing's proportions — they are not dimensioned.
 */
import {THREE,group,dark,collisionBox as cb,fixed} from '../../authoring/tool-shapes.mjs';
import {bx,profile,caster,padAdjuster,zinc} from '../../authoring/stand-shapes.mjs';
export const D={w:.500,d:.400,section:.050,under:.084,cap:.003,adjuster:[.075,.095],pad:[.0375,.023],
  footBase:[.150,.080,.008],caster:[.090,.025],mass:23.4};
export function definition(){
 const g=group(),links=[],joints=[];
 const s=D.section,z=D.under+s/2,top=D.under+s,yo=D.d/2-s/2,xo=D.w/2-s/2;
 const ax=D.w/2-D.adjuster[0],ay=D.d/2-D.adjuster[1];
 for(const [tag,sy] of [['front',-1],['rear',1]]){
   profile(g,`outer_member_${tag}`,'x',D.w-2*D.cap,[s,s],[0,sy*yo,z],{slots:[1,1]});
   for(const sx of [-1,1]) bx(g,`cap_${tag}_${sx<0?'l':'r'}`,[D.cap,s,s],[sx*(D.w/2-D.cap/2),sy*yo,z],dark);
 }
 for(const [tag,sx] of [['l',-1],['r',1]]) profile(g,`side_member_${tag}`,'y',D.d-2*s,[s,s],[sx*xo,0,z],{slots:[1,1]});
 profile(g,'centre_member','x',D.w-2*s,[s,s],[0,0,z],{slots:[1,1]});
 for(const sx of [-1,1]) for(const sy of [-1,1]){
   const tag=`${sx<0?'l':'r'}${sy<0?'f':'b'}`;
   bx(g,`foot_base_${tag}`,D.footBase,[sx*(D.w/2-s-D.footBase[0]/2),sy*ay,D.under+D.footBase[2]/2],zinc);
   padAdjuster(g,`adjuster_${tag}`,[sx*ax,sy*ay],D.under,{pad:D.pad[0],padHeight:D.pad[1]});
   caster(g,`caster_${tag}`,[sx*D.caster[0],sy*ay,D.under],D.caster[1],{roll:'x',width:.022});
 }
 links.push({name:'base_link',visual:g,collisions:[cb([D.w,D.d,top],[0,0,top/2])]});
 links.push({name:'mount'});joints.push(fixed('mount_joint','base_link','mount',[0,0,0]));
 links.push({name:'top'});joints.push(fixed('top_joint','base_link','top',[0,0,top]));
 return{name:'misumi_rusa8_5050',links,joints};
}
