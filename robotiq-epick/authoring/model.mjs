/** Robotiq EPick, single-suction-cup kit configuration: one Ø40 mm 1.5-bellows
 * cup screwed into the G1/4 port on the top face. Instruction manual 2021-07-09
 * Fig. 6-1: 83 x 62 mm footprint, Ø75 coupling face with Ø71 h8 pilot and a 4 mm
 * lip, 101 mm to the top face and 102.3 mm to the Ø20 e8 manifold boss; Table 6-4:
 * TCP 113 mm (no cup) / 145 mm (one cup) from the robot flange with the GRP-CPL-062
 * coupling, i.e. the cup lip sits 32 mm above the top face. The coupling is a
 * separate asset; no vacuum state joint is invented.
 */
import {group,silver,dark,rubber,blue,box,cylinder,lathe,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
export const dimensions={top:.101,boss:.1023,cup:.032,footprint:[.083,.062]};
export function definition() {
 const d=dimensions,body=group(),links=[],joints=[];
 cylinder(body,'coupling_lip',.0375,.004,[0,0,.002],silver);                 // Ø75 x 4, Ø71 h8 pilot not cut
 box(body,'housing',[d.footprint[0],d.footprint[1],.090],[0,0,.049],dark);   // 4 .. 94
 box(body,'housing_crown',[.070,.046,.007],[0,0,.0975],dark);                // narrower crown (48 / 43 mm side widths)
 cylinder(body,'manifold_boss',.010,.0013,[0,0,d.top+.00065],silver);        // Ø20 e8 x 1.3 -> 102.3
 box(body,'connector_protector',[.024,.004,.018],[0,-.033,.078],silver);     // 4x M4 face
 box(body,'status_leds',[.012,.001,.004],[0,-.0315,.030],blue);
 links.push({name:'mount',visual:body,collisions:[cc(.0375,.004,[0,0,.002]),cb([d.footprint[0],d.footprint[1],.097],[0,0,.0525]),cc(.010,.0013,[0,0,d.top+.00065])]});
 const cup=group();
 cylinder(cup,'g14_fitting',.008,.008,[0,0,.004],silver);
 lathe(cup,'bellows_cup_40',[[.008,.008],[.010,.014],[.014,.020],[.018,.015],[.022,.020],[.026,.016],[.030,.020],[.032,.020],[.032,.010]],rubber);
 links.push({name:'cup_1',visual:cup,collisions:[cc(.008,.008,[0,0,.004]),cc(.020,.024,[0,0,.020])]});
 joints.push(fixed('cup_1_joint','mount','cup_1',[0,0,d.boss]));
 links.push({name:'cup_1_contact'});joints.push(fixed('cup_1_contact_joint','cup_1','cup_1_contact',[0,0,d.cup]));
 links.push({name:'tcp'});joints.push(fixed('tcp_joint','mount','tcp',[0,0,d.boss+d.cup]));
 return {name:'robotiq_epick_single_cup',links,joints};
}
