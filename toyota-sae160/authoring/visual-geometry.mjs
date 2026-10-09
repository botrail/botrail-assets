/** Toyota-local visual construction. SI units, independent geometry; no CAD/texture input. */
import * as THREE from 'three';
import {roundedRectangle} from '@botrail/authoring/geometry.mjs';
export function prism(points,depth){
 const s=new THREE.Shape();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();
 return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:12});
}
export function channelGeometry(cx,cy,h,t,side=1){
 // C cross-section: outward web, two flanges and an inward-facing open throat.
 const q=[[-cx/2,-cy/2],[-cx/2,cy/2],[cx/2,cy/2],[cx/2,-cy/2],[cx/2-t,-cy/2],[cx/2-t,cy/2-t],[-cx/2+t,cy/2-t],[-cx/2+t,-cy/2]];
 const g=prism(q,h);if(side<0)g.rotateZ(Math.PI);return g;
}
export function forkGeometry(l,e,s,holeX){
 const shape=new THREE.Shape();shape.moveTo(0,-e/2);shape.lineTo(l-e/2,-e/2);
 shape.absarc(l-e/2,0,e/2,-Math.PI/2,Math.PI/2,false);shape.lineTo(0,e/2);shape.closePath();
 const hole=new THREE.Path();const h=.052,xa=holeX-.105,xb=holeX+.105;
 hole.moveTo(xa,-h);hole.lineTo(xa,h);hole.lineTo(xb,h);hole.lineTo(xb,-h);hole.closePath();shape.holes.push(hole);
 const g=new THREE.ExtrudeGeometry(shape,{depth:s,bevelEnabled:false,curveSegments:16});
 const p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  // Flat contact deck; the separate closed U sidewalls carry the toe ramp.
  p.setZ(i,p.getZ(i)>s/2?0:-.012);
 }
 g.computeVertexNormals();return g;
}
export function loopGeometry(w,h,wall,depth){
 const shape=roundedRectangle(w,h,Math.min(w,h)*.28),hole=roundedRectangle(w-2*wall,h-2*wall,Math.min(w-2*wall,h-2*wall)*.28);
 const path=new THREE.Path(hole.getPoints(12).reverse());shape.holes.push(path);
 return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:12});
}
export function loft(rings){
 // rings: [z, centreX, centreY, length, width, corner radius]
 const contours=rings.map(([z,x,y,l,w,r])=>roundedRectangle(l,w,r).getPoints(8).slice(0,-1).map(p=>new THREE.Vector3(p.x+x,p.y+y,z)));
 const N=contours[0].length;for(const c of contours)if(c.length!==N)throw new Error('Inconsistent loft rings');
 const flat=contours.flat(),faces=[];
 for(let k=0;k<contours.length-1;k++)for(let j=0;j<N;j++){
  const a=k*N+j,b=k*N+(j+1)%N,c=(k+1)*N+(j+1)%N,d=(k+1)*N+j;faces.push(a,b,c,a,c,d);
 }
 const cap=THREE.ShapeUtils.triangulateShape(contours[0].map(p=>new THREE.Vector2(p.x,p.y)),[]);
 const baseCap=flat.length;flat.push(...contours[0].map(p=>p.clone()));const topCap=flat.length;flat.push(...contours.at(-1).map(p=>p.clone()));
 for(const [a,b,c] of cap){faces.push(baseCap+c,baseCap+b,baseCap+a);faces.push(topCap+a,topCap+b,topCap+c);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(flat.flatMap(p=>p.toArray()),3));g.setIndex(faces);g.computeVertexNormals();return g;
}

export function armGeometry(length,width,height,holeX,holeY){
 const shape=roundedRectangle(length,width,.016),hole=new THREE.Path();
 const xa=holeX-.058,xb=holeX+.058,ya=holeY-.054,yb=holeY+.054;
 hole.moveTo(xa,ya);hole.lineTo(xa,yb);hole.lineTo(xb,yb);hole.lineTo(xb,ya);hole.closePath();shape.holes.push(hole);
 return new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,curveSegments:12});
}

/** Open-backed U shell below the load deck. Real cavity for the fixed arms. */
export function forkWallGeometry(l,e,s,wall=.011,deck=.012){
 const r=e/2,ri=r-wall,N=32;
 const path=rr=>[[0,-rr],[l-.24,-rr],...Array.from({length:N+1},(_,i)=>{const a=-Math.PI/2+i*Math.PI/N;return[l-r+rr*Math.cos(a),rr*Math.sin(a)];}),[l-.24,rr],[0,rr]];
 const outer=path(r),inner=path(ri),n=outer.length,verts=[],indices=[];
 const bottom=x=>-(s*(1-Math.max(0,Math.min(1,(x-(l-.24))/.24)))+.022*Math.max(0,Math.min(1,(x-(l-.24))/.24)));
 for(const points of [outer,inner])for(const ztop of [false,true])for(const [x,y] of points)verts.push(x,y,ztop?-deck:bottom(x));
 const ob=i=>i,ot=i=>n+i,ib=i=>2*n+i,it=i=>3*n+i;
 const quad=(a,b,c,d)=>indices.push(a,b,c,a,c,d);
 for(let i=0;i<n-1;i++){
  quad(ob(i),ob(i+1),ot(i+1),ot(i));quad(ib(i+1),ib(i),it(i),it(i+1));
  quad(ot(i),ot(i+1),it(i+1),it(i));quad(ob(i+1),ob(i),ib(i),ib(i+1));
 }
 quad(ob(0),ot(0),it(0),ib(0));quad(ob(n-1),ib(n-1),it(n-1),ot(n-1));
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
