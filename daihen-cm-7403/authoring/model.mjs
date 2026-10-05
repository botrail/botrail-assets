/** Daihen wire feeder CM-7403 (air-cooled, for the WB-M/P series; Welbee Co-R
 * configuration). Manual 10.1 / 10.4: W x D x H 254 x 611 x 393 mm, 14 kg, spool up
 * to Ø300 x 103 mm / 25 kg on a 15° tilted holder, wire 0.9-1.2 (1.6) mm, 22 m/min,
 * mounted through 4 x M6 on a 185 x 475 mm pattern. The mounting face is the base
 * (z = 0, pattern centre at the origin, +Z up through the housing, +Y towards the
 * housing front). The housing (363 high, 393 with the top cover) takes the front
 * 370 mm of the 611 mm length and the spool holder the rear 241 mm; the spool
 * hangs on the +X side of the holder. Spool position, holder height and the cover
 * are placed from the outline figure, not published numbers.
 */
import {group,silver,dark,blue,box,namedMaterial,collisionBox as cb,fixed} from '../../authoring/tool-shapes.mjs';
import {cylinderBetween} from '../../authoring/geometry.mjs';
const navy=namedMaterial('welbee_navy','#1d3f78',.2,.5);
const steel=namedMaterial('painted_steel','#4a5159',.3,.6);
export const D={w:.254,d:.611,h:.393,housingD:.370,housingH:.363,holder:[.239,.241,.290],pattern:[.185,.475],spoolR:.150,spoolW:.103,spoolTilt:15*Math.PI/180,spoolHub:[-.215,.180],mass:14};
export function definition(){
 const g=group(),links=[],joints=[];
 const yFront=D.pattern[1]/2+.080;                       // holes sit 80 mm behind the front edge (10.4)
 const yHousing=yFront-D.housingD/2, yHolder=yFront-D.housingD-D.holder[1]/2;
 box(g,'housing',[D.w,D.housingD,D.housingH],[0,yHousing,D.housingH/2],navy);
 box(g,'top_cover',[D.w,.200,D.h-D.housingH],[0,yFront-.100,D.housingH+(D.h-D.housingH)/2],navy);
 box(g,'side_window',[.002,.200,.120],[D.w/2+.001,yHousing,.230],dark);
 cylinderBetween(g,'torch_outlet',[0,yFront-.004,.200],[0,yFront+.012,.200],.018,silver,{radial:24});
 box(g,'status_lamp',[.012,.002,.012],[.080,yFront+.001,.300],blue);
 box(g,'spool_holder',D.holder,[0,yHolder,D.holder[2]/2],steel);
 for(const sx of [-1,1]) for(const sy of [-1,1]) cylinderBetween(g,`m6_${sx<0?'l':'r'}${sy<0?'r':'f'}`,[sx*D.pattern[0]/2,sy*D.pattern[1]/2,0],[sx*D.pattern[0]/2,sy*D.pattern[1]/2,.004],.0055,dark,{radial:12});
 // spool on the +X side of the holder, axis tilted 15° from X (top leans outward)
 const [hy,hz]=D.spoolHub, ax=[Math.cos(D.spoolTilt),0,Math.sin(D.spoolTilt)];
 const along=(x0,s)=>[x0+ax[0]*s,hy+ax[1]*s,hz+ax[2]*s];
 const x0=D.holder[0]/2;
 cylinderBetween(g,'spool_shaft',along(x0,0),along(x0,.150),.025,silver,{radial:24});
 cylinderBetween(g,'wire_spool',along(x0,.025),along(x0,.025+D.spoolW),D.spoolR,dark,{radial:48});
 cylinderBetween(g,'spool_lock_nut',along(x0,.025+D.spoolW+.004),along(x0,.025+D.spoolW+.022),.030,silver,{radial:12});
 cylinderBetween(g,'wire_conduit',[.090,yHolder+.060,D.holder[2]],[.090,yFront-D.housingD+.010,D.housingH-.040],.008,dark,{radial:12});
 const spoolMid=along(x0,.025+D.spoolW/2);
 links.push({name:'base_link',visual:g,collisions:[
   cb([D.w,D.housingD,D.housingH],[0,yHousing,D.housingH/2]),cb([D.w,.200,D.h-D.housingH],[0,yFront-.100,D.housingH+(D.h-D.housingH)/2]),
   cb(D.holder,[0,yHolder,D.holder[2]/2]),
   {kind:'cylinder',radius:D.spoolR,length:D.spoolW+.030,xyz:spoolMid,rpy:[0,Math.PI/2-D.spoolTilt,0]}]});
 links.push({name:'mount'});joints.push(fixed('mount_joint','base_link','mount',[0,0,0]));
 links.push({name:'torch_outlet_frame'});joints.push(fixed('torch_outlet_joint','base_link','torch_outlet_frame',[0,yFront+.012,.200],[-Math.PI/2,0,0]));
 return{name:'daihen_cm_7403',links,joints};
}
