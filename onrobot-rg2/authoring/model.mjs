/** OnRobot RG2 with its integrated tool-side Quick Changer and standard EPDM fingertips.
 * Independently authored CC0 procedural model. Sizes: the public datasheet v1.8 and measurements
 * taken from the official product-page STEP (303_rg2_tool.step), which was read as a measuring
 * instrument only; no CAD surface, mesh or drawing is reproduced (authoring/provenance.json).
 * `mount` is the tool face of the robot-side Quick Changer, 13.6 mm above the robot flange.
 * Joint 0 = fully open (110 mm between the bare fingers); the upper limit is where the fitted
 * pads meet. The TCP is the centre of the pads in that closed pose.
 */
import {buildRG,kinematics} from './visual-geometry.mjs';

// Millimetres in the model frame. Finger 1 is on -X; x values are magnitudes.
export const dimensions={
 qc:{spigotR:31.5,spigotTop:2.7,ringR:35.45,ringTop:4.7,baseR:35.5,baseFlat:31.0,baseTop:17.2},
 cheek:{half:20.5,footInner:22.05,footTop:9.7,gussetX:31.05,gussetTop:9.7,wallInner:31.05,wallOuter:37.5,bevel:3},
 tilt:36.2,                                   // bracket tilt axis = body frame
 disc:{r:20.5,x0:27.1,x1:30.95,boss:6},
 housing:{zb:16.2,nw:27,ea:17,eb:15,z2:89,c1:100,c2:102,hw:32.45,zh:109.5,d1:120,d2x:24,tw:8,zt:134.45,
  depth:18,wall:3,coreTop:95.5},   // datasheet 54 / 65 / 36 mm neck / head / depth
 details:{label:[0,43.2,35.2,17.2,3.3],screws:[[-18.5,30.7,2.9],[18.5,30.7,2.9],[-9.0,99.5,2.8],[9.0,99.5,2.8],[0,123.1,2.6]],m3:[[-10,123.2],[10,123.2]]},
 moment:[17.0,112.2],truss:[7.5,128.7],       // base pivots
 tip:[-25.6,48.68],                           // pivot-to-pivot arm vector, 55.0 mm
 stroke:110,bareInner:5.00,                   // bare fingers: datasheet stroke; inner face past the distal pivot
 armHalf:10.0,slotHalf:5.95,
 momentArm:{hubR:13.0,bar:[[10,-2.0,6.53],[47.2,-2.0,4.56]],lugW:[-2.0,4.5],eyeR:5.0,pinR:3.5,pinEnd:15.6,bossR:5.5,bossT:1.0},
 // The inner link's slot starts at 43 mm (STEP: 47.4 mm) so the carrier clears it at closure.
 trussArm:{hubR:5.0,bar:[[0,-2.8,2.8],[43,-2.8,2.8]],lugW:[-2.6,2.6],eyeR:4.8,pinR:2.0,pinEnd:14.9,bossR:4.0,bossT:0,socketR:4.0,switchBox:[7,37,-5.85,-2.75,8.5]},
 cover:{plate:[[20.6,-8.0],[21.2,-14.0],[22.6,-15.5],[60.5,-15.5],[62.8,-13.0],[62.8,-7.0],[60.0,-5.0],[55.0,-1.42],[45.0,-0.18],[21.8,1.24],[20.8,-1.0]],
  plateY:[10.1,11.8]},
 carrier:{half:5.8,eyeR:5.0,pinR:2.0,outline:[[5.0,31.98],[5.0,1.34],[4.87,-1.16],[3.4,-3.66],[0.51,-6.16],[-0.95,-8.66],[-2.38,-11.16],[-3.82,-13.66],
  [-13.61,-13.66],[-10.77,-11.16],[-9.33,-8.66],[-8.15,-6.16],[-6.96,-3.66],[-5.78,-1.16],[-4.6,1.34],[-3.41,3.84],[-2.28,6.34],[-2.0,8.84],[-2.0,31.98]]},
 pad:{face:9.45,depth:11.4,width:20.2,length:29.8,z0:6.50},  // datasheet EPDM 20.2 x 29.8 x 11.4 mm
};
export const motion=kinematics(dimensions);
export const definition=()=>buildRG(dimensions,'rg2_v2_gripper','onrobot_rg2_reference');
