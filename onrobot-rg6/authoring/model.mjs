/** OnRobot RG6 with its integrated tool-side Quick Changer and standard EPDM fingertips.
 * Independently authored CC0 procedural model. Sizes: the public datasheet v2.0 and measurements
 * taken from the official product-page STEP (301_rg6_tool.step), which was read as a measuring
 * instrument only; no CAD surface, mesh or drawing is reproduced (authoring/provenance.json).
 * `mount` is the tool face of the robot-side Quick Changer, 13.6 mm above the robot flange.
 * Joint 0 = fully open (160 mm between the bare fingers); the upper limit is where the fitted
 * pads meet. The TCP is the centre of the pads in that closed pose.
 */
import {buildRG,kinematics} from './visual-geometry.mjs';

// Millimetres in the model frame. Finger 1 is on -X; x values are magnitudes.
export const dimensions={
 qc:{spigotR:31.5,spigotTop:2.7,ringR:35.45,ringTop:4.7,baseR:35.5,baseFlat:32.0,baseTop:17.2},
 cheek:{half:22.5,footInner:22.7,footTop:9.7,gussetX:31.0,gussetTop:29.0,wallInner:34.7,wallOuter:41.15,bevel:3},
 tilt:39.2,                                   // bracket tilt axis = body frame
 disc:{r:22.5,x0:30.2,x1:33.9,boss:6},
 housing:{zb:17.09,nw:30,ea:20,eb:16,z2:90,c1:106,c2:110,hw:41.76,zh:122.5,d1:135,d2x:30,tw:12,zt:154.19,
  depth:21,wall:3,coreTop:103.5},  // datasheet 60 / 84 / 42 mm neck / head / depth
 details:{label:[0,51.1,35.2,17.2,3.3],screws:[[-17.8,28.6,3.45],[17.8,28.6,3.45],[-10,104.9,2.6],[10,104.9,2.6],[0,145.0,2.6]],m3:[[-10,135.2],[10,135.2]]},
 moment:[23.8,124.092],truss:[10.5,147.192],  // base pivots
 tip:[-55.03,58.07],                          // pivot-to-pivot arm vector, 80.0 mm
 stroke:160,bareInner:6.30,                   // bare fingers: datasheet stroke; inner face past the distal pivot
 armHalf:12.5,slotHalf:7.5,
 momentArm:{hubR:17.5,bar:[[12,-2.5,8.66],[65.4,-2.5,4.92]],lugW:[-2.5,5.0],eyeR:6.3,pinR:4.0,pinEnd:18.6,bossR:6.0,bossT:1.0},
 // The inner link's slot starts at 64 mm (STEP: 70 mm) so the carrier clears it at closure.
 trussArm:{hubR:5.5,bar:[[0,-3.5,3.5],[64,-3.5,3.5]],lugW:[-3.5,3.5],eyeR:5.6,pinR:2.5,pinEnd:17.9,bossR:4.0,bossT:0,socketR:4.5,switchBox:[10,52,-6.15,-3.45,10]},
 cover:{plate:[[27.5,-16.0],[28.5,-21.5],[30.0,-23.44],[85.5,-23.44],[88.2,-20.5],[88.2,-10.5],[85.0,-7.96],[80.0,-5.56],[75.0,-3.17],[70.0,-2.29],[31.5,0.40],[29.5,-1.5],[28.1,-6.3]],
  plateY:[12.6,15.0]},
 carrier:{half:7.2,eyeR:6.3,pinR:2.65,outline:[[6.3,37.98],[6.3,1.0],[6.0,-2.0],[3.9,-5.0],[0.6,-8.0],[-1.1,-11.0],[-2.8,-14.0],[-4.6,-17.0],[-6.3,-20.0],
  [-18.8,-20.0],[-15.5,-17.0],[-13.6,-14.0],[-12.2,-11.0],[-10.8,-8.0],[-9.4,-5.0],[-8.0,-2.0],[-6.6,1.0],[-5.2,4.0],[-3.8,7.0],[-2.4,10.0],[-2.1,13.0],[-2.1,37.98]]},
 pad:{face:11.30,depth:13.15,width:25,length:37,z0:6.30},  // datasheet EPDM 25 x 37 x 13.15 mm
};
export const motion=kinematics(dimensions);
export const definition=()=>buildRG(dimensions,'rg6_v2_gripper','onrobot_rg6_reference');
