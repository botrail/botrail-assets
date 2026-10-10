/** OnRobot RG2 / RG6 procedural model shared by both packages (keep the two copies identical).
 * Every size comes from the model's `dimensions` table (millimetres in, metres out). The shapes
 * are independent extrusions, discs and boxes; no vendor curve, mesh or drawing is reproduced.
 * Frame: `mount` = Quick Changer tool face, +Z towards the fingers, X = opening direction.
 */
import {THREE} from '../../authoring/tool-shapes.mjs';
import {addMesh,cylinderBetween,namedMaterial,roundedRectangle} from '../../authoring/geometry.mjs';

const silver=namedMaterial('anodized_silver','#bfc5c8',.58,.34);
const grey=namedMaterial('qc_grey','#8b9094',.45,.4);
const blue=namedMaterial('status_blue','#258cc0',.55,.33);
const cover=namedMaterial('cover_dark_grey','#3a3e41',.1,.55);
const dark=namedMaterial('housing_graphite','#444d54',.2,.48);
const pale=namedMaterial('label_pale_grey','#d7dbde',.1,.5);
const rubber=namedMaterial('epdm_contact','#202528',0,.9);
const m=v=>v/1000;
const G=()=>new THREE.Group();
const col=(size,xyz,rpy=[0,0,0])=>({kind:'box',size:size.map(up),xyz,rpy});
const cyl=(radius,length,xyz,rpy=[0,0,0])=>({kind:'cylinder',radius:up(radius),length:up(length),xyz,rpy});
const fixed=(name,parent,child,xyz=[0,0,0],rpy=[0,0,0])=>({name,type:'fixed',parent,child,xyz,rpy});
// Collision sizes round outwards to 0.1 mm.
function up(v){return Math.ceil(v*1e4-1e-6)/1e4;}

export function plate(g,name,shape,depth,y,mat,bevel=0){
 const geo=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:24});
 geo.rotateX(Math.PI/2);geo.translate(0,y+depth/2,0);return addMesh(g,name,geo,mat);
}
export function outline(points){const s=new THREE.Shape();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();return s;}
/** Slab between y0 and y1 whose x-z section is the polygon `points` ([x, z] in metres). */
function prism(g,name,points,y0,y1,mat,bevel=0){return plate(g,name,outline(points),y1-y0-2*bevel,(y0+y1)/2,mat,bevel);}
/** Cylinder along y at (x, z). */
function ycyl(g,name,x,z,r,y0,y1,mat){return cylinderBetween(g,name,[x,y0,z],[x,y1,z],r,mat,{radial:40});}
/** Plate between x0 and x1 whose y-z section is `shape` (shape x -> y, shape y -> z). */
function xplate(g,name,shape,x0,x1,mat,bevel=0){
 const geo=new THREE.ExtrudeGeometry(shape,{depth:x1-x0-2*bevel,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:32});
 geo.applyMatrix4(new THREE.Matrix4().set(0,0,1,0,1,0,0,0,0,1,0,0,0,0,0,1));geo.translate(x0+bevel,0,0);return addMesh(g,name,geo,mat);
}
/** Rectangle with a semicircular top centred at zc (y-z section of the bracket cheeks). */
function tombstone(half,z0,zc,inset=0){
 const s=new THREE.Shape(),h=half-inset;s.moveTo(-h,z0+inset);s.lineTo(h,z0+inset);s.lineTo(h,zc);s.absarc(0,zc,h,0,Math.PI,false);s.closePath();return s;
}
/** Housing outline (right half sampled, mirrored): flat bottom, elliptical corner, straight neck,
 * S-curve to the widest head section, rounded top; clipped at zTop when given. */
export function housingPoints(h,zTop=Infinity){
 const pts=[],add=(x,z)=>{if(z<=zTop+1e-12)pts.push([x,z]);};
 const n=24,bez=(p0,p1,p2,p3,t)=>p0*(1-t)**3+3*p1*t*(1-t)**2+3*p2*t*t*(1-t)+p3*t**3;
 const {nw,hw,zb,zt,ea,eb}=h;
 add(0,zb);
 for(let i=0;i<=n;i++){const a=-Math.PI/2+i*Math.PI/2/n;add(nw-ea+ea*Math.cos(a),zb+eb+eb*Math.sin(a));}
 for(let i=1;i<=n;i++){const t=i/n;add(bez(nw,nw,hw,hw,t),bez(h.z2,h.c1,h.c2,h.zh,t));}
 for(let i=1;i<=n;i++){const t=i/n;add(bez(hw,hw,h.d2x,h.tw,t),bez(h.zh,h.d1,zt,zt,t));}
 add(0,zt);
 const right=pts.filter((p,i)=>i===0||Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1])>1e-9);
 if(zTop<Infinity){const last=right.at(-1);if(last[1]<zTop-1e-9)right.push([last[0],zTop]);right.push([0,zTop]);}
 // Drop the centre points: collinear contour points leave zero-area cap triangles.
 const half=right.slice(1,-1),body=[...half,...half.slice().reverse().map(([x,z])=>[-x,z])];
 return body.filter((p,i)=>i===0||Math.hypot(p[0]-body[i-1][0],p[1]-body[i-1][1])>1e-9);
}
/** Boxes enclosing a polygon slab by slab (each box takes the widest point in its z range). */
function slabBoxes(points,cuts,yHalf,z0){
 const out=[];
 for(let i=0;i<cuts.length-1;i++){
  const a=cuts[i],b=cuts[i+1];let w=0;
  for(let j=0;j<points.length;j++){
   const p=points[j],q=points[(j+1)%points.length];
   if(p[1]>=a-1e-12&&p[1]<=b+1e-12)w=Math.max(w,Math.abs(p[0]));
   for(const c of [a,b])if((p[1]-c)*(q[1]-c)<0)w=Math.max(w,Math.abs(p[0]+(q[0]-p[0])*(c-p[1])/(q[1]-p[1])));
  }
  out.push(col([2*w+4e-5,2*yHalf,b-a+4e-5],[0,0,(a+b)/2-z0]));  // 0.02 mm margin
 }
 return out;
}
export function boot(g,name,innerX,width,length,depth,face,top,mat){
 // Round-ended elastomer sleeve. Back cavity is open at its lower end; no texture.
 const h=length,rad=width/2,s=new THREE.Shape();s.moveTo(-rad,0);s.lineTo(-rad,h-rad);s.absarc(0,h-rad,rad,Math.PI,0,true);s.lineTo(rad,0);s.closePath();
 const slab=new THREE.ExtrudeGeometry(s,{depth:face,bevelEnabled:false,curveSegments:24});
 // shape x/y become world y/z; extrusion becomes world x.
 slab.applyMatrix4(new THREE.Matrix4().set(0,0,1,0,1,0,0,0,0,1,0,0,0,0,0,1));slab.translate(innerX-face,0,top-h);addMesh(g,name+'_contact',slab,mat);
 const rim=new THREE.Shape();rim.moveTo(-rad,0);rim.lineTo(-rad,h-rad);rim.absarc(0,h-rad,rad,Math.PI,0,true);rim.lineTo(rad,0);rim.lineTo(rad-.002,0);rim.lineTo(rad-.002,h-rad);rim.absarc(0,h-rad,rad-.002,0,Math.PI,false);rim.lineTo(-rad+.002,0);rim.closePath();
 const back=new THREE.ExtrudeGeometry(rim,{depth:depth-face,bevelEnabled:false,curveSegments:24});back.applyMatrix4(new THREE.Matrix4().set(0,0,1,0,1,0,0,0,0,1,0,0,0,0,0,1));back.translate(innerX-depth,0,top-h);addMesh(g,name+'_sleeve',back,mat);
}

/** Kinematics shared by the model, its tests and docs: zero-pose arm angle for the datasheet
 * stroke between the bare fingers, and the angle at which the fitted pads meet. */
export function kinematics(d){
 const len=Math.hypot(...d.tip),phi=Math.atan2(d.tip[0],d.tip[1]);
 const offset=Math.asin(-(d.stroke/2+d.bareInner-d.truss[0])/len)-phi;
 const upper=Math.asin((d.truss[0]-d.pad.face)/len)-phi-offset;
 const tipAt=q=>[-d.truss[0]+len*Math.sin(phi+offset+q),d.truss[1]+len*Math.cos(phi+offset+q)];
 const closed=tipAt(upper);
 return {len,offset,upper,tipAt,tcp:closed[1]+d.pad.z0+d.pad.length/2,padTop:closed[1]+d.pad.z0+d.pad.length,
  padTravel:d.stroke-2*(d.pad.face-d.bareInner)};
}

/** The model. `d` is the per-gripper table (millimetres, model frame, finger 1 on -X). */
export function buildRG(d,prefix,robotName){
 const k=kinematics(d),links=[{name:'mount'}],joints=[];
 const link=(name,visual,collisions=[])=>links.push({name,visual,collisions});
 const tilt=m(d.tilt);

 // --- bracket: tool-side QC spigot, blue ring, base, two cheeks, tilt bearing discs
 const bracket=G(),q=d.qc,c=d.cheek;
 cylinderBetween(bracket,'qc_spigot',[0,0,0],[0,0,m(q.spigotTop)],m(q.spigotR),grey,{radial:72});
 cylinderBetween(bracket,'qc_blue_ring',[0,0,m(q.spigotTop)],[0,0,m(q.ringTop)],m(q.ringR),blue,{radial:72});
 const base=new THREE.Shape(),bx=m(q.baseFlat),br=m(q.baseR),ba=Math.acos(bx/br);
 base.absarc(0,0,br,ba,Math.PI-ba,false);base.absarc(0,0,br,Math.PI+ba,2*Math.PI-ba,false);base.closePath();
 const bg=new THREE.ExtrudeGeometry(base,{depth:m(q.baseTop-q.ringTop),bevelEnabled:false,curveSegments:48});bg.translate(0,0,m(q.ringTop));
 addMesh(bracket,'bracket_base',bg,silver);
 for(const s of [-1,1]){
  const xs=v=>s*m(v);
  prism(bracket,`cheek_foot_${s}`,[[xs(c.footInner),m(q.ringTop)],[xs(c.wallInner),m(q.ringTop)],[xs(c.wallInner),m(c.footTop)],[xs(c.footInner),m(c.footTop)]],-m(c.half),m(c.half),silver);
  // The cheek's inner face leans out from gussetX at the foot to the wall at gussetTop.
  if(c.gussetTop>c.footTop)prism(bracket,`cheek_gusset_${s}`,[[xs(c.gussetX),m(c.footTop)],[xs(c.wallInner+.01),m(c.footTop)],[xs(c.wallInner+.01),m(c.gussetTop)]],-m(c.half),m(c.half),silver);
  const [x0,x1]=s>0?[c.wallInner,c.wallOuter]:[-c.wallOuter,-c.wallInner];
  xplate(bracket,`tilt_cheek_${s}`,tombstone(m(c.half),m(q.ringTop),tilt,m(c.bevel)),m(x0),m(x1),silver,m(c.bevel));
  const [d0,d1]=s>0?[d.disc.x0,d.disc.x1]:[-d.disc.x1,-d.disc.x0];
  cylinderBetween(bracket,`tilt_disc_${s}`,[m(d0),0,tilt],[m(d1),0,tilt],m(d.disc.r),grey,{radial:64});
  cylinderBetween(bracket,`tilt_boss_${s}`,[xs(d.disc.x1-.01),0,tilt],[xs(c.wallInner+1.5),0,tilt],m(d.disc.boss),grey,{radial:40});
 }
 link(`${prefix}_bracket`,bracket,[cyl(m(q.baseR),m(q.baseTop),[0,0,m(q.baseTop)/2]),
  col([2*m(c.wallOuter)+4e-5,2*m(c.half)+4e-5,tilt+m(c.half)-m(q.ringTop)+2e-5],[0,0,(tilt+m(c.half)+m(q.ringTop))/2])]);
 joints.push(fixed(`${prefix}_bracket_joint`,'mount',`${prefix}_bracket`));

 // --- body (frame on the tilt axis): two cover plates, the stem core below the arm sweep, details
 const body=G(),h=d.housing,mmPts=pts=>pts.map(([x,z])=>[m(x),m(z)-tilt]);
 // Plain extrusions: a bevel folds over the dense outline's concave stretches.
 const outer=mmPts(housingPoints(h));
 for(const s of [-1,1])prism(body,`sculpted_cover_${s}`,outer,s<0?-m(h.depth):m(h.depth-h.wall),s<0?-m(h.depth-h.wall):m(h.depth),silver);
 prism(body,'stem_core',mmPts(housingPoints(h,h.coreTop)),-m(h.depth-h.wall)-1e-5,m(h.depth-h.wall)+1e-5,silver);
 // Front-face details at their measured centres: rating label, screw heads, the M3 holes.
 const face=-m(h.depth),[lx,lz,lw,lh,lr]=d.details.label;
 const label=new THREE.ExtrudeGeometry(roundedRectangle(m(lw),m(lh),m(lr)),{depth:m(.3),bevelEnabled:false,curveSegments:8});
 label.rotateX(Math.PI/2);label.translate(m(lx),face+1e-5,m(lz)-tilt);addMesh(body,'label_plate',label,pale);
 for(const [i,[x,z,r]] of d.details.screws.entries())ycyl(body,`cover_screw_${i}`,m(x),m(z)-tilt,m(r),face-m(.3),face+1e-5,dark);
 for(const [i,[x,z]] of d.details.m3.entries())ycyl(body,`m3_hole_${i}`,m(x),m(z)-tilt,m(1.25),face-m(.2),face+1e-5,dark);
 for(const side of [-1,1])for(const sy of [-1,1])ycyl(body,`truss_pivot_socket_${side}_${sy}`,side*m(d.truss[0]),m(d.truss[1])-tilt,m(d.trussArm.socketR),sy*m(d.armHalf+3),sy*m(h.depth-h.wall+.01),silver);
 const cuts=[h.zb,h.zb+h.eb,h.z2,(h.z2+h.zh)/2,h.zh,(h.zh+h.zt)/2,h.zt].map(m);
 link(`${prefix}_body`,body,slabBoxes(outer.map(([x,z])=>[x,z+tilt]),cuts,m(h.depth+.31),tilt));
 joints.push(fixed(`${prefix}_body_joint`,`${prefix}_bracket`,`${prefix}_body`,[0,0,tilt]));
 // TCP: centre of the fitted pads where they meet (the closed pose with standard fingertips).
 links.push({name:`${prefix}_grasp_frame`},{name:'tcp'});
 joints.push(fixed(`${prefix}_grasp_frame_joint`,`${prefix}_body`,`${prefix}_grasp_frame`,[0,0,m(k.tcp)-tilt]),fixed('tcp_joint',`${prefix}_grasp_frame`,'tcp'));

 // --- fingers
 const tip=[m(d.tip[0]),0,m(d.tip[1])],beta=Math.atan2(tip[0],tip[2]);
 // Arm frame: u along base->distal pivot, w across (outwards for finger 1); local x = -w, z = u.
 const U=(u,w)=>[-m(w),m(u)],armPoint=(u,w)=>[-m(w)*Math.cos(beta)+m(u)*Math.sin(beta),m(w)*Math.sin(beta)+m(u)*Math.cos(beta)];
 const armBox=(u0,u1,w0,w1,y0,y1)=>{const [x,z]=armPoint((u0+u1)/2,(w0+w1)/2);return col([m(w1-w0),m(y1-y0),m(u1-u0)],[x,m(y0+y1)/2,z],[0,beta,0]);};
 const armCyl=(u,r,y0,y1)=>{const [x,z]=armPoint(u,0);return cyl(m(r),m(y1-y0),[x,m(y0+y1)/2,z],[Math.PI/2,0,0]);};
 const A=d.armHalf,S=d.slotHalf,lugs=(g,name,u0,u1,w0,w1,eye,mat)=>{for(const s of [-1,1]){
  prism(g,`${name}_lug_${s}`,[U(u0,w0),U(u0,w1),U(u1,w1),U(u1,w0)],s<0?-m(A):m(S),s<0?-m(S):m(A),mat);
  ycyl(g,`${name}_eye_${s}`,0,m(u1),m(eye),s<0?-m(A):m(S),s<0?-m(S):m(A),mat);}};
 for(let side=1;side<=2;side++){
  const name=`${prefix}_finger_${side}`;
  links.push({name:`${name}_origin`});
  joints.push(fixed(`${name}_origin_joint`,`${prefix}_body`,`${name}_origin`,[0,0,0],[0,0,side===1?0:Math.PI]));
  for(const part of ['moment_arm','truss_arm']){
   const outerArm=part==='moment_arm',a=outerArm?d.momentArm:d.trussArm,visual=G(),arm=G();
   arm.rotation.y=beta;visual.add(arm);
   const bar=a.bar.map(([u,w0,w1])=>[u,w0,w1]),barPts=[...bar.map(([u,w0])=>U(u,w0)),...bar.slice().reverse().map(([u,,w1])=>U(u,w1))];
   prism(arm,'sculpted_link_bar',barPts,-m(A),m(A),silver);
   ycyl(arm,'sculpted_link_hub',0,0,m(a.hubR),-m(A),m(A),silver);
   const end=bar.at(-1);lugs(arm,'sculpted_link',end[0]-1,k.len,a.lugW[0],a.lugW[1],a.eyeR,silver);
   for(const s of [-1,1]){
    ycyl(arm,`pivot_axle_0_${s}`,0,0,m(a.pinR),s*m(A),s*m(a.pinEnd),silver);
    if(a.bossT>0)ycyl(arm,`pivot_boss_0_${s}`,0,0,m(a.bossR),s*m(A),s*m(A+a.bossT),silver);
    // Washers on the distal pin of the outer link only; the inner link's pins stay flush so the
    // cover plates, which lie over its faces, pass them.
    if(outerArm){ycyl(arm,`pivot_boss_1_${s}`,0,m(k.len),m(a.eyeR-1),s*m(A),s*m(A+.8),silver);
     ycyl(arm,`pivot_recess_1_${s}`,0,m(k.len),m(2.4),s*m(A+.8),s*m(A+1),dark);}
   }
   // The inner link's shapes stay within its own layer (|y| <= armHalf) apart from the base pins,
   // so the outer link's cover plates, which lie over its faces, never overlap it.
   const tipY=outerArm?A+1:A,shapes=[armCyl(0,Math.max(a.hubR,a.bossT>0?a.bossR:0),-A-a.bossT,A+a.bossT),armCyl(0,a.pinR,-a.pinEnd,a.pinEnd),armCyl(k.len,a.eyeR,-tipY,tipY),
    armBox(bar[0][0],end[0],Math.min(...bar.map(b=>b[1])),Math.max(...bar.map(b=>b[2])),-A,A),
    armBox(end[0]-1,k.len,Math.min(a.lugW[0],-a.eyeR),Math.max(a.lugW[1],a.eyeR),-A,A)];
   if(outerArm){
    // Dark safety covers over the gap between the links, one plate on each face. The real plates are
    // pinned to the carrier and slide on the outer link; here they ride on the outer link, without
    // the inner rib, which would meet the inner link as the parallelogram narrows towards closure.
    const cv=d.cover;
    for(const s of [-1,1]){
     prism(arm,`safety_switch_cover_${s}`,cv.plate.map(([u,w])=>U(u,w)),s<0?-m(cv.plateY[1]):m(cv.plateY[0]),s<0?-m(cv.plateY[0]):m(cv.plateY[1]),cover);
     const us=cv.plate.map(p=>p[0]),ws=cv.plate.map(p=>p[1]);
     shapes.push(armBox(Math.min(...us),Math.max(...us),Math.min(...ws),Math.max(...ws),s<0?-cv.plateY[1]:cv.plateY[0],s<0?-cv.plateY[0]:cv.plateY[1]));
    }
   }else{
    const sw=d.trussArm.switchBox;
    prism(arm,'safety_switch_housing',[U(sw[0],sw[2]),U(sw[0],sw[3]),U(sw[1],sw[3]),U(sw[1],sw[2])],-m(sw[4]),m(sw[4]),cover);
    shapes.push(armBox(sw[0],sw[1],sw[2],sw[3],-sw[4],sw[4]));
   }
   link(`${name}_${part}`,visual,shapes);
   const master=outerArm&&side===1,at=outerArm?d.moment:d.truss;
   joints.push({name:outerArm?`${prefix}${side===1?'':'_mirror'}_joint`:`${name}_${part}_joint`,
    type:'revolute',parent:`${name}_origin`,child:`${name}_${part}`,axis:[0,1,0],
    xyz:[-m(at[0]),0,m(at[1])-tilt],rpy:[0,k.offset,0],
    limit:{lower:0,upper:k.upper,velocity:.5,effort:10},
    ...(master?{}:{mimic:{joint:`${prefix}_joint`,multiplier:1,offset:0}})});
  }
  // Carrier: frame on the distal truss pivot, axis-aligned with the body (+x inwards for finger 1).
  const carrier=G(),cr=d.carrier,low=[d.truss[0]-d.moment[0],d.moment[1]-d.truss[1]];
  prism(carrier,'finger_carrier',cr.outline.map(([x,z])=>[m(x),m(z)]),-m(cr.half),m(cr.half),silver);
  ycyl(carrier,'carrier_web_eye',m(low[0]),m(low[1]),m(cr.eyeR),-m(cr.half),m(cr.half),silver);
  ycyl(carrier,'carrier_lower_axle',m(low[0]),m(low[1]),m(cr.pinR),-m(A-.1),m(A-.1),silver);
  ycyl(carrier,'carrier_pin',0,0,m(cr.pinR),-m(A-.1),m(A-.1),silver);
  const xs=cr.outline.map(p=>p[0]),zs=cr.outline.map(p=>p[1]);
  link(`${name}_finger_tip`,carrier,[col([m(Math.max(...xs)-Math.min(...xs,low[0]-cr.eyeR)),2*m(cr.half),m(Math.max(...zs)-(low[1]-cr.eyeR))],
   [m((Math.max(...xs)+Math.min(...xs,low[0]-cr.eyeR))/2),0,m((Math.max(...zs)+low[1]-cr.eyeR)/2)]),
   cyl(m(cr.pinR),2*m(A-.1),[m(low[0]),0,m(low[1])],[Math.PI/2,0,0]),cyl(m(cr.pinR),2*m(A-.1),[0,0,0],[Math.PI/2,0,0])]);
  joints.push({name:`${name}_finger_tip_joint`,type:'revolute',parent:`${name}_truss_arm`,child:`${name}_finger_tip`,
   xyz:tip,rpy:[0,-k.offset,0],axis:[0,-1,0],limit:{lower:0,upper:k.upper,effort:10,velocity:.5},
   mimic:{joint:`${prefix}_joint`,multiplier:1,offset:0}});
  // Standard EPDM fingertip: frame on its contact face at mid-length.
  const pad=G(),p=d.pad;
  boot(pad,'rubber_pad',0,m(p.width),m(p.length),m(p.depth),m(p.face-d.bareInner),m(p.length)/2,rubber);
  // Exact (unrounded) box: its contact face is the visible pad face.
  link(`${name}_flex_finger`,pad,[{kind:'box',size:[m(p.depth),m(p.width),m(p.length)],xyz:[-m(p.depth)/2,0,0],rpy:[0,0,0]}]);
  joints.push(fixed(`${name}_flex_finger_joint`,`${name}_finger_tip`,`${name}_flex_finger`,[m(p.face),0,m(p.z0+p.length/2)]));
 }
 return {name:robotName,links,joints};
}
