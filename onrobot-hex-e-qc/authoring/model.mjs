/** OnRobot HEX-E QC 6-axis force/torque sensor with its mounting adapter plate
 * and integral robot-side Quick Changer. Datasheet v1.5 p.2/p.7: 50 mm from the
 * robot flange interface to the OnRobot tool interface, 72 mm diameter, 93 mm
 * overall with the M12 12-pin connector housing, adapter plate holes on a
 * 35.36 mm square (ISO 9409-1-50-4-M6, PCD 50), 0.347 kg with the plates.
 * The strain body, seam and latch are shaped from the figure only.
 */
import {group,silver,dark,blue,box,cylinder,plate,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';
import {cylinderBetween} from '../../authoring/geometry.mjs';
export const dimensions={height:.050,radius:.036,overall:.093};
export function definition() {
 const d=dimensions,body=group(),holes=[[0,0,.0158]];
 for(const x of [-1,1])for(const y of [-1,1])holes.push([x*.01767766953,y*.01767766953,.0033]);
 plate(body,'adapter_plate',d.radius,.006,holes,silver);                    // 0 .. 6 robot-side mounting adapter plate
 cylinder(body,'sensor_body',d.radius,.024,[0,0,.018],dark);                // 6 .. 30 strain body
 cylinder(body,'seam',d.radius+.0005,.002,[0,0,.031],silver);
 cylinder(body,'qc_robot_side',.0355,.018,[0,0,.041],silver);               // 32 .. 50 integral QC-R ring
 box(body,'release_button',[.012,.020,.010],[-.041,0,.045],dark);
 box(body,'connector_housing',[.022,.021,.020],[0,-(d.radius+.0105),.016],dark); // radial M12 box out to 57 mm
 cylinderBetween(body,'m12_connector',[0,-(d.radius+.021),.016],[0,-(d.radius+.030),.016],.007,silver,{radial:24});
 box(body,'index_mark',[.004,.001,.003],[0,d.radius-.002,.049],blue);
 const links=[{name:'mount',visual:body,collisions:[cc(d.radius,d.height,[0,0,d.height/2]),cb([.022,.030,.020],[0,-(d.radius+.015),.016])]},{name:'flange'},{name:'ft_frame'}];
 const joints=[fixed('flange_joint','mount','flange',[0,0,d.height]),fixed('ft_frame_joint','mount','ft_frame',[0,0,d.height])];
 return {name:'onrobot_hex_e_qc',links,joints};
}
