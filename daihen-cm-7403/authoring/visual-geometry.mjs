/** Target-local, independently authored SI geometry. No vendor mesh or texture. */
import {THREE} from '../../authoring/tool-shapes.mjs';
export function profile(points,depth,holes=[]){
 const shape=new THREE.Shape();shape.moveTo(...points[0]);for(const p of points.slice(1))shape.lineTo(...p);shape.closePath();
 for(const pts of holes){const h=new THREE.Path();h.moveTo(...pts[0]);for(const p of pts.slice(1))h.lineTo(...p);h.closePath();shape.holes.push(h);}
 return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:32});
}
export function ring(ro,ri,depth){
 const s=new THREE.Shape();s.absarc(0,0,ro,0,Math.PI*2,false);const h=new THREE.Path();h.absarc(0,0,ri,0,Math.PI*2,true);s.holes.push(h);
 return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:48});
}
