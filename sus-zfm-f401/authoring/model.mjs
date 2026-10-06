/** SUS ZFM-F401 — dedicated cart A (with outriggers) for FANUC CRX-10iA / CRX-10iA/L,
 * built from ZF high-rigidity aluminium structural members.
 * Maker's product page and dimension drawing (service/cad/ZFM-F401.pdf): body
 * 850 x 700 mm, deck 700 mm above the floor, robot mounting face 720 mm, handle 178 mm
 * above the deck, 1127.7 x 977.1 mm over the outriggers, lower storage 686 x 536 mm,
 * a (528.5) x (388.5) mm front opening, cable inlet 80 x 100 mm in the deck, 113 kg.
 * The robot plate is centred 205 mm from one end of the 850 mm length and on the
 * centre line of the 700 mm width (350 mm).
 * Member section (82 mm, which leaves the published 686 x 536 mm storage), robot plate
 * outline (220 x 190 mm), caster size / positions, handle tube and the outrigger arms
 * are read from the drawing's proportions — they are not dimensioned. The four sides
 * are closed with panels; the front opening and the controller inside are not modelled.
 */
import {THREE,group,dark,namedMaterial,collisionBox as cb,fixed} from '../../authoring/tool-shapes.mjs';
import {cylinderBetween} from '../../authoring/geometry.mjs';
import {bx,profile,caster,knobAdjuster,uHandle} from '../../authoring/stand-shapes.mjs';
const panel=namedMaterial('painted_panel','#e4e6e8',.2,.55);
const plateMat=namedMaterial('robot_plate','#c9ced3',.55,.4);
const lobe=.68*Math.sin(Math.PI/3)+.32;   // how far the six-lobed knob reaches across its lobes, in knob radii
export const D={l:.850,w:.700,deck:.700,deckT:.010,under:.138,post:.082,plate:[.220,.190,.020],plateFromEnd:.205,
  handle:[.178,.017],overall:[1.1277,.9771],knob:.030,inlet:[.080,.100,-.033],caster:[.330,.270,.050],mass:113};
export function definition(){
 const g=group(),links=[],joints=[];
 const px=D.l/2-D.post/2,py=D.w/2-D.post/2,z0=D.under,frameTop=D.deck-D.deckT,clearX=D.l-2*D.post,clearY=D.w-2*D.post;
 const zb=z0+D.post/2,zt=frameTop-D.post/2,panelH=frameTop-z0-2*D.post,panelZ=z0+D.post+panelH/2;
 const knobX=D.overall[0]/2-D.knob,knobY=D.overall[1]/2-D.knob*lobe,armZ=z0+D.post-.020;
 for(const sx of [-1,1]) for(const sy of [-1,1]){
   const tag=`${sx<0?'h':'r'}${sy<0?'l':'r'}`;   // h = handle end, r = robot end
   profile(g,`post_${tag}`,'z',frameTop-z0,[D.post,D.post],[sx*px,sy*py,(z0+frameTop)/2],{slots:[1,1]});
   cylinderBetween(g,`outrigger_${tag}`,[sx*px,sy*py,armZ],[sx*knobX,sy*knobY,armZ],.018,dark,{radial:16});
   knobAdjuster(g,`adjuster_${tag}`,[sx*knobX,sy*knobY],armZ+.020,{knob:D.knob});
   caster(g,`caster_${tag}`,[sx*D.caster[0],sy*D.caster[1],z0],D.caster[2],{roll:'x',width:.032});
 }
 for(const [tag,s] of [['l',-1],['r',1]]){
   profile(g,`bottom_rail_${tag}`,'x',clearX,[D.post,D.post],[0,s*py,zb],{slots:[1,1]});
   profile(g,`top_rail_${tag}`,'x',clearX,[D.post,D.post],[0,s*py,zt],{slots:[1,1]});
   bx(g,`panel_${tag}`,[clearX,.003,panelH],[0,s*py,panelZ],panel);
 }
 for(const [tag,s] of [['handle_end',-1],['robot_end',1]]){
   profile(g,`bottom_rail_${tag}`,'y',clearY,[D.post,D.post],[s*px,0,zb],{slots:[1,1]});
   profile(g,`top_rail_${tag}`,'y',clearY,[D.post,D.post],[s*px,0,zt],{slots:[1,1]});
   bx(g,`panel_${tag}`,[.003,clearY,panelH],[s*px,0,panelZ],panel);
 }
 bx(g,'storage_floor',[clearX,clearY,.006],[0,0,z0+D.post+.003],panel);
 // T-slot deck over the whole top, with the cable inlet and the robot plate on it
 profile(g,'deck','x',D.l,[D.w,D.deckT],[0,0,D.deck-D.deckT/2],{slots:[14,1]});
 bx(g,'cable_inlet',[D.inlet[0],D.inlet[1],.0008],[D.inlet[2],0,D.deck+.0004],dark);
 const plateX=D.l/2-D.plateFromEnd;
 bx(g,'robot_plate',D.plate,[plateX,0,D.deck+D.plate[2]/2],plateMat);
 const hx=-px;
 uHandle(g,'handle',[hx,-.300,D.deck],[hx,.300,D.deck],[0,0,1],D.handle[0]-D.handle[1],D.handle[1]);
 const collisions=[cb([D.l,D.w,D.deck],[0,0,D.deck/2]),cb(D.plate,[plateX,0,D.deck+D.plate[2]/2]),
   cb([2*D.handle[1]+.006,.640,D.handle[0]],[hx,0,D.deck+D.handle[0]/2])];
 for(const sx of [-1,1]) for(const sy of [-1,1]){
   const ox=D.overall[0]/2-D.l/2,oy=D.overall[1]/2-D.w/2;   // how far the outrigger reaches past the body
   collisions.push(cb([ox,oy,armZ+.050],[sx*(D.l/2+ox/2),sy*(D.w/2+oy/2),(armZ+.050)/2]));
 }
 links.push({name:'base_link',visual:g,collisions});
 links.push({name:'mount'});joints.push(fixed('mount_joint','base_link','mount',[0,0,0]));
 links.push({name:'robot_mount'});joints.push(fixed('robot_mount_joint','base_link','robot_mount',[plateX,0,D.deck+D.plate[2]]));
 return{name:'sus_zfm_f401',links,joints};
}
