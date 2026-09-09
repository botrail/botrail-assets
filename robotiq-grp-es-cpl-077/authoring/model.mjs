/** ES-077 reference housing, not a conversion of vendor CAD.
 * PCD50 mounting is documented. 75 x 16.9 mm housing and 13.9 mm seating
 * are family-reference approximations; ES-077 dimensional fit is unverified.
 */
import {group,silver,dark,box,cylinder,plate,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
export function definition() {
 const body=group(),holes=[];
 for(const x of [-1,1])for(const y of [-1,1]) holes.push([x*.01767766953,y*.01767766953,.0032]);
 plate(body,'housing',.0375,.0139,holes,dark);
 for(const x of [-.027,.027])for(const y of [-.016,.016]) cylinder(body,`hand_screw_seat_${x}_${y}`,.0035,.001,[x,y,.0144],silver);
 // Electrical contacts/cable and protector are deliberately BOM-only.
 return {name:'robotiq_grp_es_cpl_077',links:[{name:'mount',visual:body,collisions:[cc(.0375,.0139,[0,0,.00695])]},{name:'flange'}],joints:[fixed('flange_joint','mount','flange',[0,0,.0139])]};
}
