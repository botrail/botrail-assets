/** Daihen Welbee Co-R torch assembly: BLUE TORCH III automatic torch BT350RD-30D
 * (curved neck, 350 A 60 % CO2 / 35 % MAG, 3.0 m cable, 3.3 kg, Ø16 nozzle bore,
 * 1.2 mm tip — parts list 1U6818) on the Welbee Co-R torch mount TMCU-01 with its
 * free-drive handle. Daihen publishes no drawing of the mount or the neck geometry:
 * the ISO 9409-1-50-4-M6 base, bracket, clamp, 45° neck bend and 15 mm wire
 * stick-out are the author's approximation from the Welbee Co-R catalog photos.
 * TCP = wire tip. The cable is visual only.
 */
import {group,silver,dark,rubber,blue,box,cylinder,plate,addMesh,namedMaterial,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
import {cylinderBetween,tubeGeometry} from '../../authoring/geometry.mjs';
const brass=namedMaterial('brass_nozzle','#b08d57',.8,.35);
const copper=namedMaterial('copper_tip','#b87333',.9,.3);
const mountBlue=namedMaterial('mount_blue','#2f5fa8',.3,.5);
export const D={plate:.010,bracket:.050,neckStart:.090,straight:.110,bendR:.050,bendDeg:45,afterBend:.060,nozzle:.065,stickout:.015,neckR:.011,nozzleR:.012};
export function definition(){
 const g=group(),links=[],joints=[];
 const holes=[[0,0,.016],...[45,135,225,315].map(a=>[.025*Math.cos(a*Math.PI/180),.025*Math.sin(a*Math.PI/180),.0033])];
 plate(g,'iso50_base_plate',.0315,D.plate,holes,silver);
 box(g,'mount_bracket',[.070,.060,.040],[0,0,D.plate+.020],mountBlue);
 box(g,'torch_clamp',[.056,.056,.040],[0,0,D.neckStart-.020],mountBlue);
 cylinderBetween(g,'freedrive_handle',[0,.038,.035],[0,.150,.035],.012,dark,{radial:24});
 cylinder(g,'freedrive_button',.006,.006,[0,.140,.050],rubber);
 // torch: straight section along +Z, 45° bend towards +X, nozzle, contact tip, wire
 const z0=D.neckStart, z1=z0+D.straight, th=D.bendDeg*Math.PI/180;
 cylinderBetween(g,'torch_body',[0,0,z0],[0,0,z1],D.neckR,dark,{radial:32});
 const pts=[];for(let i=0;i<=12;i++){const a=th*i/12;pts.push([D.bendR*(1-Math.cos(a)),0,z1+D.bendR*Math.sin(a)]);}
 addMesh(g,'neck_bend',tubeGeometry(pts,D.neckR,{tubular:24,radial:16}),dark);
 const bx=D.bendR*(1-Math.cos(th)), bz=z1+D.bendR*Math.sin(th), dir=[Math.sin(th),0,Math.cos(th)];
 const p=(s)=>[bx+dir[0]*s,0,bz+dir[2]*s];
 cylinderBetween(g,'neck_end',p(0),p(D.afterBend),D.neckR,dark,{radial:32});
 cylinderBetween(g,'nozzle',p(D.afterBend-.010),p(D.afterBend+D.nozzle),D.nozzleR,brass,{radial:32});
 cylinderBetween(g,'contact_tip',p(D.afterBend+D.nozzle-.002),p(D.afterBend+D.nozzle+.004),.004,copper,{radial:16});
 cylinderBetween(g,'wire_stickout',p(D.afterBend+D.nozzle),p(D.afterBend+D.nozzle+D.stickout),.0006,silver,{radial:8});
 const cable=[[0,0,z0-.005],[-.03,0,z0-.04],[-.09,0,z0-.06],[-.16,0,z0-.05]];
 addMesh(g,'power_cable',tubeGeometry(cable,.012,{tubular:24,radial:12}),rubber);
 const tip=p(D.afterBend+D.nozzle+D.stickout);
 const mid=p((D.afterBend+D.nozzle)/2), seg=D.afterBend+D.nozzle;
 links.push({name:'mount',visual:g,collisions:[
   cc(.0315,D.plate,[0,0,D.plate/2]),cb([.070,.060,.040],[0,0,D.plate+.020]),cb([.056,.056,.040],[0,0,D.neckStart-.020]),
   {kind:'cylinder',radius:.012,length:.112,xyz:[0,.094,.035],rpy:[Math.PI/2,0,0]},
   cc(D.neckR,D.straight,[0,0,z0+D.straight/2]),
   {kind:'cylinder',radius:D.nozzleR,length:seg+.010,xyz:[mid[0],0,mid[2]],rpy:[0,th,0]}]});
 links.push({name:'tcp'});joints.push({name:'tcp_joint',type:'fixed',parent:'mount',child:'tcp',xyz:tip,rpy:[0,th,0]});
 links.push({name:'torch_tip'});joints.push({name:'torch_tip_joint',type:'fixed',parent:'mount',child:'torch_tip',xyz:p(D.afterBend+D.nozzle),rpy:[0,th,0]});
 return{name:'daihen_bt350rd_30d_tmcu01',links,joints};
}
