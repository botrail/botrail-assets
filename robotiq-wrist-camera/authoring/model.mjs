/** Robotiq Wrist Camera RWC-CAM-001 without the RWC-TOOL-062 tool plate: the
 * Robotiq gripper coupling bolts through the camera into the UR flange.
 * Instruction manual 2019-01-16 Fig. 7-1 / 7.1: Ø75 ring (R37.5), camera head
 * out to R50 (87.5 mm overall), 13.5 mm added height, 22.4 mm global thickness,
 * sensor at [0, 35.7, -0.1] mm of the tool flange with the line of sight 30°
 * from Z, 50° x 39° angle of view, 160 g. ISO 9409-1-50-4-M6 through holes on
 * both faces; the lens, LEDs and cable exit are placed from the figure only.
 */
import {THREE,group,silver,dark,blue,box,cylinder,plate,collisionBox as cb,collisionCylinder as cc,fixed,addMesh,namedMaterial} from '../../authoring/tool-shapes.mjs';
import {cylinderBetween} from '../../authoring/geometry.mjs';
export const dimensions={ring:.0375,height:.0135,head:.0224,headReach:.050,sensor:[0,.0357,-.0001],tilt:Math.PI/6};
const glass=namedMaterial('lens_glass','#1a2630',.2,.1);
export function definition() {
 const d=dimensions,body=group(),holes=[[0,0,.0158]];
 for(const a of [45,135,225,315]) holes.push([.025*Math.cos(a*Math.PI/180),.025*Math.sin(a*Math.PI/180),.0033]); // PCD 50, 4x M6 through
 plate(body,'ring',d.ring,d.height,holes,dark);
 box(body,'camera_head',[.046,.026,d.head],[0,d.headReach-.013,d.head/2],dark);
 cylinderBetween(body,'lens',[0,d.sensor[1]-.004,.006],[0,d.sensor[1]-.012,.0208],.006,glass,{radial:32}); // 30° line of sight
 for(const x of [-.012,.012]) cylinderBetween(body,`led_${x<0?'l':'r'}`,[x,.041,.021],[x,.041,.0224],.003,blue,{radial:16});
 cylinderBetween(body,'cable_exit',[-.023,.040,.012],[-.038,.040,.012],.0035,silver,{radial:16}); // 10 m pigtail, visual only
 const links=[{name:'mount',visual:body,collisions:[cc(d.ring,d.height,[0,0,d.height/2]),cb([.046,.026,d.head],[0,d.headReach-.013,d.head/2])]},{name:'flange'},{name:'camera_optical_frame'}];
 const joints=[fixed('flange_joint','mount','flange',[0,0,d.height]),
   fixed('camera_optical_frame_joint','mount','camera_optical_frame',d.sensor,[d.tilt,0,0])];
 return {name:'robotiq_wrist_camera_rwc_cam_001',links,joints};
}
