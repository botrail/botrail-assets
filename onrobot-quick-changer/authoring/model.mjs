/** QC-R v3, item 109498. Datasheet v2.0 p7: 71 mm diameter,
 * 16.10 overall, 13.60 mm robot-flange to tool interface.
 * Mechanical latch engagement is not simulated.
 */
import {group,silver,dark,box,plate,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
export function definition() {
 const body=group(),holes=[];
 for(const x of [-1,1])for(const y of [-1,1])holes.push([x*.01767766953,y*.01767766953,.00315]);
 plate(body,'qc_ring',.0355,.0136,holes,silver);
 box(body,'release_button',[.012,.02,.010],[-.041,0,.008],dark);
 box(body,'locking_bar',[.027,.008,.005],[0,.015,.0136],dark);
 return {name:'onrobot_quick_changer_109498',links:[{name:'mount',visual:body,collisions:[cc(.0355,.0136,[0,0,.0068])]},{name:'flange'}],joints:[fixed('flange_joint','mount','flange',[0,0,.0136])]};
}
