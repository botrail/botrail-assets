/** Robotiq PowerPick10 Vacuum Generation Unit (enclosure with venturi, valves and
 * filter regulator). Instruction manual 2024-02-12 Fig. 5-1: 220 wide, 160 deep (182
 * with the regulator), 260 high enclosure, 352 overall with the hanging bracket ears
 * and the bottom fittings (293 to the fitting elbows), 6.7 kg (5.2.1), 12 mm OD air
 * tubes, 24 V DC. Mount = back face centre of the enclosure (wall / column bracket),
 * +Z into the box, +Y up. Fitting and hose stubs are visual only.
 */
import {group,silver,dark,blue,box,namedMaterial,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
import {cylinderBetween} from '../../authoring/geometry.mjs';
export const D={w:.220,h:.260,d:.160,bracket:.059,regulator:.022,fitting:.033,mass:6.7};
export function definition(){
 const g=group(),links=[],joints=[];
 box(g,'enclosure',[D.w,D.h,D.d],[0,0,D.d/2],dark);
 box(g,'hanging_bracket',[.200,D.bracket+.020,.003],[0,D.h/2+D.bracket/2-.010,.0015],silver);
 for(const sx of [-1,1]) cylinderBetween(g,`bracket_slot_${sx<0?'l':'r'}`,[sx*.070,D.h/2+D.bracket-.015,0],[sx*.070,D.h/2+D.bracket-.015,.004],.004,blue,{radial:12});
 cylinderBetween(g,'filter_regulator',[.045,-.040,D.d],[.045,-.040,D.d+D.regulator],.024,silver,{radial:24});
 cylinderBetween(g,'regulator_knob',[.045,.030,D.d],[.045,.030,D.d+.018],.016,dark,{radial:24});
 cylinderBetween(g,'vacuum_switch',[-.045,-.010,D.d],[-.045,-.010,D.d+.012],.012,blue,{radial:16});
 for(const [tag,x] of [['in',.075],['out',-.075]]){
   cylinderBetween(g,`air_${tag}_fitting`,[x,-D.h/2,.050],[x,-D.h/2-D.fitting,.050],.008,silver,{radial:16});
   cylinderBetween(g,`air_${tag}_elbow`,[x,-D.h/2-D.fitting+.008,.050],[x,-D.h/2-D.fitting+.008,.090],.008,silver,{radial:16});
 }
 box(g,'label',[.070,.040,.001],[-.030,-.080,D.d+.0005],blue);
 links.push({name:'mount',visual:g,collisions:[cb([D.w,D.h,D.d],[0,0,D.d/2]),cc(.024,D.regulator,[.045,-.040,D.d+D.regulator/2]),cb([.200,D.bracket,.003],[0,D.h/2+D.bracket/2,.0015])]});
 links.push({name:'air_out'});joints.push(fixed('air_out_joint','mount','air_out',[-.075,-D.h/2-D.fitting,.050]));
 return{name:'robotiq_powerpick10_vacuum_unit',links,joints};
}
