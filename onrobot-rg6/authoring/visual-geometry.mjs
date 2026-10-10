/** Target-local independent visual primitives. Dimensions are SI estimates unless documented. */
import {THREE} from '../../authoring/tool-shapes.mjs';
import {addMesh,cylinderBetween,roundedBox} from '../../authoring/geometry.mjs';
export function plate(g,name,shape,depth,y,mat,bevel=0){
 const geo=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:24});
 geo.rotateX(Math.PI/2);geo.translate(0,y+depth/2,0);return addMesh(g,name,geo,mat);
}
export function outline(points){const s=new THREE.Shape();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();return s;}
export function capsule(length,r){const s=new THREE.Shape();s.moveTo(-r,0);s.absarc(0,0,r,Math.PI,2*Math.PI,false);s.lineTo(r,length);s.absarc(0,length,r,0,Math.PI,false);s.closePath();return s;}
export function dogbone(w,head,h,stemEnd){const s=new THREE.Shape(),a=w/2,b=head/2;
 s.moveTo(-a+.009,0);s.quadraticCurveTo(-a,0,-a,.010);s.lineTo(-a,stemEnd);
 s.bezierCurveTo(-a,stemEnd+.020,-b,stemEnd+.024,-b,h-.025);
 s.bezierCurveTo(-b,h-.008,-b+.014,h,0,h);s.bezierCurveTo(b-.014,h,b,h-.008,b,h-.025);
 s.bezierCurveTo(b,stemEnd+.024,a,stemEnd+.020,a,stemEnd);s.lineTo(a,.010);s.quadraticCurveTo(a,0,a-.009,0);s.closePath();return s;
}
export function armPlate(g,name,tip,y,depth,r,mat){const len=Math.hypot(tip[0],tip[2]),mesh=plate(g,name,capsule(len,r),depth,y,mat);mesh.rotation.y=Math.atan2(tip[0],tip[2]);return mesh;}
export function boot(g,name,innerX,width,length,depth,face,top,mat){
 // Round-ended elastomer sleeve. Back cavity is open at its lower end; no texture.
 const h=length,rad=width/2,s=new THREE.Shape();s.moveTo(-rad,0);s.lineTo(-rad,h-rad);s.absarc(0,h-rad,rad,Math.PI,0,true);s.lineTo(rad,0);s.closePath();
 const slab=new THREE.ExtrudeGeometry(s,{depth:face,bevelEnabled:false,curveSegments:24});
 // shape x/y become world y/z; extrusion becomes world x.
 slab.applyMatrix4(new THREE.Matrix4().set(0,0,1,0,1,0,0,0,0,1,0,0,0,0,0,1));slab.translate(innerX-face,0,top-h);addMesh(g,name+'_contact',slab,mat);
 const rim=new THREE.Shape();rim.moveTo(-rad,0);rim.lineTo(-rad,h-rad);rim.absarc(0,h-rad,rad,Math.PI,0,true);rim.lineTo(rad,0);rim.lineTo(rad-.002,0);rim.lineTo(rad-.002,h-rad);rim.absarc(0,h-rad,rad-.002,0,Math.PI,false);rim.lineTo(-rad+.002,0);rim.closePath();
 const back=new THREE.ExtrudeGeometry(rim,{depth:depth-face,bevelEnabled:false,curveSegments:24});back.applyMatrix4(new THREE.Matrix4().set(0,0,1,0,1,0,0,0,0,1,0,0,0,0,0,1));back.translate(innerX-depth,0,top-h);addMesh(g,name+'_sleeve',back,mat);
}

export function roundedPanel(w,h,r){const s=new THREE.Shape(),a=w/2;s.moveTo(-a+r,0);s.lineTo(a-r,0);s.quadraticCurveTo(a,0,a,r);s.lineTo(a,h-r);s.quadraticCurveTo(a,h,a-r,h);s.lineTo(-a+r,h);s.quadraticCurveTo(-a,h,-a,h-r);s.lineTo(-a,r);s.quadraticCurveTo(-a,0,-a+r,0);s.closePath();return s;}

export function reliefPanel(w,h,r,leftTop){const s=new THREE.Shape(),a=w/2;s.moveTo(-a+r,0);s.lineTo(a-r,0);s.quadraticCurveTo(a,0,a,r);s.lineTo(a,h-r);s.quadraticCurveTo(a,h,a-r,h);s.lineTo(leftTop+r,h);s.quadraticCurveTo(leftTop,h,leftTop,h-r);s.lineTo(leftTop,h*.70);s.bezierCurveTo(leftTop,h*.60,-a,h*.60,-a,h*.45);s.lineTo(-a,r);s.quadraticCurveTo(-a,0,-a+r,0);s.closePath();return s;}
