/** Kosmek SWRZ adapter plates for the SWR0070 hand changer, ISO interface number 4
 * (ISO 9409-1-50-4-M6). Catalog SWRZ R01 p.110 / p.116A: SWRZ0070-MF4 = plate A Ø63 x 11
 * (robot side, 4-φ6.8 on p.c.d. 50, Ø31.5 boss) + plate B Ø48 x 9 (p.c.d. 39 to the master),
 * 20 mm stack, 100 g; SWRZ0070-TF4 = plate B Ø50 x 9 (p.c.d. 39 to the tool adapter) +
 * plate A Ø63 h8 x 7 (4-M6 depth 8 on p.c.d. 50, Ø31.5 H7 recess), 16 mm stack, 70 g.
 * Red anodised A2017 per the catalog; counterbores and dowels are approximate.
 */
import {group,silver,dark,plate,namedMaterial,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
import {cylinderBetween} from '../../authoring/geometry.mjs';
const red=namedMaterial('anodized_red','#b7373a',.6,.4);
const iso=r=>[[0,0,r],...[45,135,225,315].map(a=>[.025*Math.cos(a*Math.PI/180),.025*Math.sin(a*Math.PI/180),.0034])];
const pcd39=r=>[[0,0,r],...[45,135,225,315].map(a=>[.0195*Math.cos(a*Math.PI/180),.0195*Math.sin(a*Math.PI/180),.0022])];
export function mf4(){
 const g=group();
 plate(g,'plate_a_iso50',.0315,.011,iso(.0158),red);                       // 0 .. 11
 cylinderBetween(g,'pilot_boss',[0,0,-.0045],[0,0,0],.01575,silver,{radial:48}); // Ø31.5 boss into the robot flange
 const b=plate(g,'plate_b_pcd39',.024,.009,pcd39(.010),red); b.position.z=.011;  // 11 .. 20
 return {name:'kosmek_swrz0070_mf4',links:[{name:'mount',visual:g,collisions:[cc(.0315,.011,[0,0,.0055]),cc(.024,.009,[0,0,.0155])]},{name:'flange'}],
  joints:[fixed('flange_joint','mount','flange',[0,0,.020])]};
}
export function tf4(){
 const g=group();
 const b=plate(g,'plate_b_pcd39',.025,.009,pcd39(.010),red);                 // 0 .. 9 (SWR0070-T side)
 const a=plate(g,'plate_a_iso50',.0315,.007,iso(.01575),red); a.position.z=.009; // 9 .. 16, Ø31.5 H7 recess as a through bore
 return {name:'kosmek_swrz0070_tf4',links:[{name:'mount',visual:g,collisions:[cc(.025,.009,[0,0,.0045]),cc(.0315,.007,[0,0,.0125])]},{name:'flange'}],
  joints:[fixed('flange_joint','mount','flange',[0,0,.016])]};
}
