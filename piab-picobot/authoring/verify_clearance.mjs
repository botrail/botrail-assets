/** Visual/collision coverage audit, not OEM interference certification. */
import * as THREE from '../../authoring/node_modules/three/build/three.module.js';
import {definition} from './model.mjs';
function outside(p,c){const q=p.clone().sub(new THREE.Vector3(...c.xyz));if(c.kind==='box'){return Math.hypot(...q.toArray().map((v,i)=>Math.max(0,Math.abs(v)-c.size[i]/2)));}return Math.hypot(Math.max(0,Math.hypot(q.x,q.y)-c.radius),Math.max(0,Math.abs(q.z)-c.length/2));}
const report=[];for(const l of definition().links){if(!l.visual)continue;l.visual.updateMatrixWorld(true);let max=0,count=0,total=0,part='';l.visual.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){const p=new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);const d=Math.min(...l.collisions.map(c=>outside(p,c)));if(d>1e-6)count++;if(d>max){max=d;part=o.name;}total++;}});report.push({link:l.name,vertices:total,outside_collision_vertices:count,max_outside_mm:max*1000,maximum_part:part});}
console.log(JSON.stringify({fixed_only:true,motion_sweep:'not applicable; manual adjustment intentionally fixed',collision_coverage:report},null,2));
