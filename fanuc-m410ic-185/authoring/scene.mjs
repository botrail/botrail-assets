import {referenceScene} from '@botrail/authoring/reference-model.mjs';
import {definition} from './model.mjs';
export const poses=Object.freeze({zero:[0,0,0,0],reach:[30,79,0,40],low:[-20,100,-90,0],folded:[0,-44,-26,0]});
export const poseValues=name=>Object.fromEntries(poses[name].map((v,i)=>[`J${i+1}`,v*Math.PI/180]));
export const createScene=()=>referenceScene(definition());
