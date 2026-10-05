/** Daihen Welbee Inverter P350L II (WB-P352L) welding power source. Manual 2.1.1 / 2.1.3:
 * 395 x 710 x 640 mm (W x D x H, without eyebolt), 54 kg, casters on a 320 x 460 mm
 * track with a 100 mm rear overhang, 3-phase 200/220 V, 20.1 kVA, 30-350 A, 60 %.
 * Front panel, handles and grille are placed from the outline figure; the casters
 * carry the box so the floor frame sits at z = 0 under the body centre.
 */
import {group,silver,dark,blue,box,cylinder,namedMaterial,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
import {cylinderBetween} from '../../authoring/geometry.mjs';
const navy=namedMaterial('welbee_navy','#1d3f78',.2,.5);
const panel=namedMaterial('panel_grey','#c9ced3',.3,.5);
export const D={w:.395,d:.710,h:.640,caster:.040,track:[.320,.460],rearOverhang:.100,mass:54};
export function definition(){
 const g=group(),links=[],joints=[];
 const bodyZ0=.060, bodyH=D.h-bodyZ0, housingD=D.d-.020, front=-D.d/2+.020;   // the front panel is recessed 20 mm so knobs and sockets stay inside 710
 box(g,'housing',[D.w,housingD,bodyH],[0,.010,bodyZ0+bodyH/2],navy);
 box(g,'front_panel',[D.w-.030,.004,.260],[0,front-.002,.450],panel);
 box(g,'display',[.120,.003,.060],[0,front-.005,.520],blue);
 for(const [i,x] of [[0,-.08],[1,.08]]) cylinderBetween(g,`knob_${i}`,[x,front-.004,.420],[x,front-.016,.420],.012,dark,{radial:24});
 for(const [i,x] of [[0,-.06],[1,.06]]) cylinderBetween(g,`torch_socket_${i}`,[x,front-.004,.300],[x,front-.020,.300],.014,silver,{radial:24});
 box(g,'top_cover',[D.w,.250,.020],[0,front+.125,D.h-.010],panel);
 cylinderBetween(g,'eyebolt',[0,0,D.h],[0,0,D.h+.030],.008,silver,{radial:12});
 // casters: 320 mm across, 460 mm wheelbase, rear overhang 100 mm
 const yRear=D.d/2-D.rearOverhang, yFront=yRear-D.track[1];
 for(const [tag,x,y] of [['rl',-D.track[0]/2,yRear],['rr',D.track[0]/2,yRear],['fl',-D.track[0]/2,yFront],['fr',D.track[0]/2,yFront]])
   cylinderBetween(g,`caster_${tag}`,[x-.015,y,D.caster],[x+.015,y,D.caster],D.caster,dark,{radial:24});
 links.push({name:'base_link',visual:g,collisions:[cb([D.w,D.d,bodyH],[0,0,bodyZ0+bodyH/2]),cb([D.track[0]+.06,D.track[1]+.08,bodyZ0],[0,(yRear+yFront)/2,bodyZ0/2])]});
 links.push({name:'mount'});joints.push(fixed('mount_joint','base_link','mount',[0,0,0]));
 links.push({name:'torch_outlet'});joints.push(fixed('torch_outlet_joint','base_link','torch_outlet',[-.06,front-.02,.300]));
 return{name:'daihen_wb_p352l',links,joints};
}
