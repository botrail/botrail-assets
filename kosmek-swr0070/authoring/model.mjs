/** Kosmek robotic hand changer SWR0070 — master cylinder SWR0070-M (robot side) and
 * tool adapter SWR0070-T (tool side) as two separable bodies. Catalog SWR R09 p.25/p.28:
 * Ø47, master body 22.5 mm with a Ø20 g7 locating boss 14.4 mm below the mating plane,
 * tool adapter 16 mm, coupled stack 38.5 mm (lock) / 39.3 (released), 4-φ3.4 (master)
 * and 4-M4 (tool) on p.c.d. 39 with 2-φ4 h7 pins at ±19.5, 6x M5 air ports, 180 / 120 g,
 * 7 kg payload at 0.5 MPa, 0.003 mm repeatability. Ball lock, ports and flats are approximate.
 */
import {group,silver,dark,blue,box,cylinder,plate,namedMaterial,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
const red=namedMaterial('anodized_red','#b7373a',.6,.4);
export const D={r:.0235,master:.0225,boss:.0144,bossR:.010,tool:.016,pcd:.039};
const holes=()=>[[0,0,.007],...[45,135,225,315].map(a=>[D.pcd/2*Math.cos(a*Math.PI/180),D.pcd/2*Math.sin(a*Math.PI/180),.0018])];
export function master(){
 const g=group();
 plate(g,'master_body',D.r,D.master,holes(),silver);
 cylinder(g,'locating_boss',D.bossR,D.boss,[0,0,D.master+D.boss/2],dark);
 for(const [i,a] of [22.5,67.5,112.5,157.5,202.5,247.5].entries()) cylinder(g,`air_port_${i}`,.0025,.002,[(D.r+.001)*Math.cos(a*Math.PI/180),(D.r+.001)*Math.sin(a*Math.PI/180),.011],dark).rotation.z=a*Math.PI/180+Math.PI/2;
 for(const s of [-1,1]) cylinder(g,`pin_${s<0?'a':'b'}`,.002,.005,[0,s*.0195,-.0025],silver);   // 2-φ4 h7 pins towards the robot side plate
 box(g,'option_face',[.006,.020,D.master],[D.r-.002,0,D.master/2],silver);
 return {name:'kosmek_swr0070_master',links:[{name:'mount',visual:g,collisions:[cc(D.r,D.master,[0,0,D.master/2]),cc(D.bossR,D.boss,[0,0,D.master+D.boss/2])]},{name:'coupling'}],
  joints:[fixed('coupling_joint','mount','coupling',[0,0,D.master])]};
}
export function tool(){
 const g=group();
 plate(g,'tool_body',D.r,D.tool,[[0,0,.0101],...holes().slice(1)],silver);
 cylinder(g,'bore_ring',.0105,.002,[0,0,.001],dark);
 for(const [i,a] of [22.5,67.5,112.5,157.5,202.5,247.5].entries()) cylinder(g,`air_port_${i}`,.0025,.002,[(D.r+.001)*Math.cos(a*Math.PI/180),(D.r+.001)*Math.sin(a*Math.PI/180),.008],dark).rotation.z=a*Math.PI/180+Math.PI/2;
 for(const s of [-1,1]) cylinder(g,`pin_${s<0?'a':'b'}`,.002,.005,[0,s*.0195,D.tool+.0025],silver);   // pins towards the tool side plate
 box(g,'option_face',[.006,.020,D.tool],[D.r-.002,0,D.tool/2],silver);
 return {name:'kosmek_swr0070_tool',links:[{name:'mount',visual:g,collisions:[cc(D.r,D.tool,[0,0,D.tool/2])]},{name:'flange'}],
  joints:[fixed('flange_joint','mount','flange',[0,0,D.tool])]};
}
