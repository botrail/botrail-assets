/** NIC Autotec AK-R-FKT10 — box-type aluminium frame cart for collaborative robots of
 * 10 kg payload or less (UR10e / UR16e, TM5 / TM12 / TM14 with the FK10 robot base sets).
 * Maker's product page and specification drawing: 650 x 840 x 800 mm, 64 kg; frame of
 * AFSF-6060-6 with ABLD-60-6-N brackets and 3 mm aluminium composite panels on four
 * sides; top deck of AFS-3090-6 (30 mm slot pitch) with a usable area of 590 x 630 mm
 * and a 90 mm cable opening behind it; panel openings 530 / 720 mm wide and 548 mm
 * high; 132 mm from the floor to the underside of the frame; outriggers 120 mm out on
 * each side; a 585 x 240 mm bottom plate.
 * How the deck overlaps the top rails, the caster / handle positions and the wheel
 * size are an arrangement that satisfies those dimensions — they are not dimensioned.
 * The robot base set (t 20, sold per robot) bolts anywhere along the deck slots and is
 * not modelled; `robot_mount` is the centre of the usable deck area.
 */
import {THREE,group,namedMaterial,collisionBox as cb,fixed} from '../../authoring/tool-shapes.mjs';
import {bx,profile,caster,knobAdjuster,uHandle} from '../../authoring/stand-shapes.mjs';
const panel=namedMaterial('aluminium_composite_panel','#d9dcdf',.25,.55);
export const D={w:.650,d:.840,h:.800,under:.132,post:.060,rail:.030,deck:[.590,.630,.030],opening:.090,
  panel:[.003,.548],outrigger:.120,knob:.030,shelf:[.585,.240],caster:[.240,.0375],mass:64};
export function definition(){
 const g=group(),links=[],joints=[];
 const px=D.w/2-D.post/2,py=D.d/2-D.post/2,z0=D.under,z1=z0+D.post,frameTop=D.h-D.deck[2],zt=frameTop-D.rail/2;
 const clearX=D.w-2*D.post,clearY=D.d-2*D.post;
 for(const sx of [-1,1]) for(const sy of [-1,1]){
   const tag=`${sx<0?'l':'r'}${sy<0?'f':'b'}`;
   profile(g,`post_${tag}`,'z',frameTop-z0,[D.post,D.post],[sx*px,sy*py,(z0+frameTop)/2],{slots:[2,2]});
   // outrigger arm with its knob adjuster, 120 mm out to the side
   bx(g,`outrigger_${tag}`,[D.outrigger,D.post,.030],[sx*(D.w/2+D.outrigger/2),sy*py,z1-.015]);
   knobAdjuster(g,`adjuster_${tag}`,[sx*(D.w/2+D.outrigger-D.knob),sy*py],z1,{knob:D.knob});
   caster(g,`caster_${tag}`,[sx*D.caster[0],sy*(D.d/2-.035),z0],D.caster[1],{roll:'x'});   // its 70 mm plate stays inside the 840 mm depth
 }
 for(const [tag,s] of [['f',-1],['b',1]]){
   profile(g,`bottom_rail_${tag}`,'x',clearX,[D.post,D.post],[0,s*py,(z0+z1)/2],{slots:[2,2]});
   profile(g,`top_rail_${tag}`,'x',clearX,[D.post,D.rail],[0,s*py,zt],{slots:[2,1]});
   bx(g,`panel_${tag}`,[clearX,D.panel[0],D.panel[1]],[0,s*py,z1+D.panel[1]/2],panel);
   profile(g,`deck_end_rail_${tag}`,'x',D.w,[D.post,D.deck[2]],[0,s*py,D.h-D.deck[2]/2],{slots:[2,1]});
 }
 for(const [tag,s] of [['l',-1],['r',1]]){
   profile(g,`bottom_rail_${tag}`,'y',clearY,[D.post,D.post],[s*px,0,(z0+z1)/2],{slots:[2,2]});
   profile(g,`top_rail_${tag}`,'y',clearY,[D.post,D.rail],[s*px,0,zt],{slots:[2,1]});
   bx(g,`panel_${tag}`,[D.panel[0],clearY,D.panel[1]],[s*px,0,z1+D.panel[1]/2],panel);
   // the 30 mm margin either side of the 590 mm usable deck width
   profile(g,`deck_side_rail_${tag}`,'y',clearY,[(D.w-D.deck[0])/2,D.deck[2]],[s*(D.w/2-(D.w-D.deck[0])/4),0,D.h-D.deck[2]/2],{slots:[1,1]});
 }
 // deck: 30 x 90 slats across the width, from the front end rail back to the cable opening
 const slat=.090,deckY0=-D.d/2+D.post,count=Math.round(D.deck[1]/slat);
 for(let i=0;i<count;i++) profile(g,`deck_slat_${i}`,'x',D.deck[0],[slat,D.deck[2]],[0,deckY0+(i+.5)*slat,D.h-D.deck[2]/2],{slots:[3,1]});
 bx(g,'bottom_plate',[D.shelf[0],D.shelf[1],.015],[0,deckY0+D.shelf[1]/2,z1+.0075]);
 for(const sx of [-1,1]) uHandle(g,`handle_${sx<0?'l':'r'}`,[sx*.150-.050,py,D.h],[sx*.150+.050,py,D.h],[0,0,1],.045);
 const collisions=[cb([D.w,D.d,D.h],[0,0,D.h/2]),cb([.420,.020,.055],[0,py,D.h+.0275])];
 for(const sx of [-1,1]) for(const sy of [-1,1]) collisions.push(cb([D.outrigger,D.post+.004,z1+.030],[sx*(D.w/2+D.outrigger/2),sy*py,(z1+.030)/2]));
 links.push({name:'base_link',visual:g,collisions});
 links.push({name:'mount'});joints.push(fixed('mount_joint','base_link','mount',[0,0,0]));
 links.push({name:'robot_mount'});joints.push(fixed('robot_mount_joint','base_link','robot_mount',[0,deckY0+D.deck[1]/2,D.h]));
 return{name:'nic_ak_r_fkt10',links,joints};
}
