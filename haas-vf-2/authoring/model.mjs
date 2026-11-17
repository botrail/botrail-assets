/** Haas VF-2 vertical machining centre: published dimensions, own geometry.
 *
 * Facts (Haas "Machine Layout Drawing VF-2/VF-2SS/VF-2TR", 1/17/2023, six
 * pages — the numbers only, the drawing itself is not reproduced): shipping
 * width 2316, operating height 2724, levelling pad 76, enclosure height with
 * the umbrella changer 1742 + 76; travels 762 x 406 x 508, spindle nose 102
 * to 610 over the table; table 914 x 368 with three 16 mm T-slots 125 apart;
 * front door opening 939 wide from 817 up; side door 677 wide, from 818, its
 * top at 1413; the dark base to 544; pendant at 1411; cabinet top 2247, its
 * doors 906 and 339 wide; the umbrella changer — carousel centre 522 from
 * the spindle, tools on a 585 circle, radius 331, 230 of travel, its lowest
 * points 476 and 444 over the table.
 * Catalog (the measured figures of the public pack haas/vf/vf-2, CC0): depth
 * 1984 from the enclosure's front to the cabinet's back, table top 853 over
 * the floor, spindle 101 behind the chamber's middle, side walls 1199 long,
 * the sheet-metal front opening 1129, front door 954 high, side opening 749
 * high and 50 behind the chamber's middle, machine home with the table 381
 * left and 211.5 in front of the spindle.
 * Estimated (README): everything else — wall thickness, the castings, the
 * head and its covers, the changer's hood, the cabinet's depth, the pendant.
 * No vendor CAD, mesh, drawing, texture or logo.
 *
 * Lengths here are millimetres, as the drawing prints them, in the machine's
 * own frame: the middle of the footprint on the floor, the front on -Y, the
 * operator's right on +X. Each link's picture is built where it stands at
 * machine home and handed over in metres, in the link's frame.
 */
import * as THREE from 'three';
import {addMesh,cylinderBetween,cylinderZ,fromMillimeters,namedMaterial,ringGeometry} from '@botrail/authoring/geometry.mjs';

export const dimensions={
  // ---- published (layout drawing, mm as printed) ----
  width:2316,height:2724,pad:76,enclosureTop:1742+76,
  travel:[762,406,508],rapid:25.4/60,                 // m/s (25.4 m/min, 2013 catalogue)
  table:[914,368],slotPitch:125,
  slot:{throat:15.95,wide:26.92,throatDepth:10.67,wideDepth:16.26},   // 0.628, 1.06, 0.420, 0.640 in
  nose:[102,610],
  frontOpening:939,frontSill:817,
  sideDoor:{width:677,bottom:818,top:1413},
  baseTop:544,pendantHeight:1411,cabinetTop:2247,cabinetDoors:[906,339],
  changer:{centre:522,toolCircle:585,radius:331,travel:230,low:[476,444],pockets:20},
  // ---- catalog (haas/vf/vf-2: figures measured off the maker's model, published as numbers) ----
  depth:1984,tableTop:853,spindleBehind:101,chamber:1139,envelopeWall:60,sideWall:1199,
  sheetOpening:1129,frontHeight:954,sideHeight:749,sideBehind:50,homeTable:[-381,-211.5],
  // ---- estimated ----
  wall:40,skin:12,pocket:[-980,-912],          // side wall thickness; front skins and the door pocket between them
  doorLeaf:600,doorSlab:[-950,-925],
  sideLeaf:[10,50],sideOver:50,                // the lifting window rides outside the wall, as the catalog's envelope has it
  bedTop:600,saddle:[631,750],guide:18,tableThick:83,
  headBelow:98,headHalf:165,headBack:163,headFront:170,
  hood:{x:[-905,-195],y:[-645,125],z:[1575,1975],chamfer:90},
  cabinet:{depth:470,bottom:520},column:{half:250,back:700,top:2100},
  pads:[[-420,-560],[420,-560],[-330,720],[330,720]],
};

// ---- finishes: plain colours, nobody's livery ----
const M=(name,color,metal,rough)=>namedMaterial(name,color,metal,rough);
const sheet=M('enclosure_light_grey','#d5d7d8',0.1,0.55);
const base=M('base_charcoal','#34373b',0.1,0.6);
const cover=M('cover_charcoal','#27292c',0.1,0.5);
const casting=M('casting_grey','#7f8589',0.3,0.6);
const steel=M('machined_steel','#b8bcc0',0.8,0.35);
const way=M('way_cover_steel','#c9cccf',0.7,0.4);
const dark=M('black_oxide','#1b1c1e',0.4,0.5);
const trim=M('trim_grey','#5a5e63',0.2,0.5);
const rubber=M('seal_black','#131415',0.0,0.8);
const glass=Object.assign(M('window_glass','#9fc0bd',0.0,0.1),{transparent:true,opacity:0.3});
const pendantGrey=M('pendant_grey','#3d4045',0.1,0.5);
const screen=M('screen_black','#0b1016',0.2,0.15);
const key=M('key_grey','#c6c8ca',0.0,0.6);
const green=M('button_green','#2e9d48',0.0,0.4);
const red=M('button_red','#c8102e',0.0,0.4);
const amber=M('lamp_amber','#f2a900',0.0,0.4);
const yellow=M('plate_yellow','#f2c200',0.0,0.5);

// ---- construction ----
const G=()=>new THREE.Group();
/** An axis-aligned box by its extents. */
function bx(g,name,mat,x,y,z){
  return addMesh(g,name,new THREE.BoxGeometry(Math.abs(x[1]-x[0]),Math.abs(y[1]-y[0]),Math.abs(z[1]-z[0])),mat,
    [(x[0]+x[1])/2,(y[0]+y[1])/2,(z[0]+z[1])/2]);
}
function outline(points){
  const s=new THREE.Shape();points.forEach(([u,v],i)=>i?s.lineTo(u,v):s.moveTo(u,v));s.closePath();return s;
}
const flat={bevelEnabled:false,curveSegments:8};
const basis=(a,b,c)=>new THREE.Matrix4().makeBasis(new THREE.Vector3(...a),new THREE.Vector3(...b),new THREE.Vector3(...c));
/** A (y, z) profile swept along X from x0 to x1. */
function prismX(g,name,mat,points,x0,x1){
  const geometry=new THREE.ExtrudeGeometry(outline(points),{...flat,depth:x1-x0});
  geometry.applyMatrix4(basis([0,1,0],[0,0,1],[1,0,0]));
  return addMesh(g,name,geometry,mat,[x0,0,0]);
}
/** An (x, z) profile swept along Y from y0 to y1. */
function prismY(g,name,mat,points,y0,y1){
  const geometry=new THREE.ExtrudeGeometry(outline(points),{...flat,depth:y1-y0});
  geometry.applyMatrix4(basis([1,0,0],[0,0,1],[0,-1,0]));
  return addMesh(g,name,geometry,mat,[0,y1,0]);
}
/** A +Z cylinder from z0 to z1. */
function cyl(g,name,mat,r,x,y,z0,z1,radial=32){
  return addMesh(g,name,cylinderZ(r,z1-z0,{radial}),mat,[x,y,(z0+z1)/2]);
}
/** A cylinder along X or Y, between a0 and a1 on that axis. */
function rod(g,name,mat,r,axis,a0,a1,p,q,radial=24){
  const m=addMesh(g,name,cylinderZ(r,Math.abs(a1-a0),{radial}),mat,axis==='x'?[(a0+a1)/2,p,q]:[p,(a0+a1)/2,q]);
  if(axis==='x')m.rotateY(Math.PI/2);else m.rotateX(Math.PI/2);
  return m;
}
/** The four strips of a frame around a window, in the plane across `normal`. */
function frame(g,name,mat,normal,at,u,v,width){
  const strips=[['lower',u,[v[0]-width,v[0]]],['upper',u,[v[1],v[1]+width]],
    ['front',[u[0]-width,u[0]],[v[0]-width,v[1]+width]],['rear',[u[1],u[1]+width],[v[0]-width,v[1]+width]]];
  for(const [tag,a,b] of strips)normal==='x'?bx(g,`${name}_${tag}`,mat,at,a,b):bx(g,`${name}_${tag}`,mat,a,at,b);
}
/** A picture built in the machine's frame (mm), as a link's visual: metres, in the link's frame. */
function visual(group,origin){
  const inner=G();group.position.set(-origin[0],-origin[1],-origin[2]);inner.add(group);
  return fromMillimeters(inner);
}
const m=v=>Number((v/1000).toFixed(6));
/** A collision box by its extents (mm, machine frame), in the frame of a link at `origin`. */
const cbox=(x,y,z,origin=[0,0,0])=>({kind:'box',size:[m(x[1]-x[0]),m(y[1]-y[0]),m(z[1]-z[0])],
  xyz:[m((x[0]+x[1])/2-origin[0]),m((y[0]+y[1])/2-origin[1]),m((z[0]+z[1])/2-origin[2])]});

/** Where things stand, from the numbers above (mm, machine frame, machine home). */
export function layout(){
  const d=dimensions,X=d.width/2,yF=-d.depth/2,yB=d.depth/2;
  const yChamber=yF+d.envelopeWall+d.chamber/2;                  // the chamber's middle: -362.5
  const ySpindle=yChamber+d.spindleBehind;                       // -261.5
  const nose=d.tableTop+d.nose[1];                               // the spindle nose at machine home: 1463
  return {X,yF,yB,yChamber,ySpindle,nose,
    yWall:yF+d.sideWall,                                         // where the side walls end: 207
    yWindow:yChamber+d.sideBehind,                               // the side opening's middle: -312.5
    table:[d.homeTable[0],ySpindle+d.homeTable[1],d.tableTop],   // the table top's middle at home
    saddle:[0,ySpindle+d.homeTable[1],d.saddle[0]],
    head:[0,ySpindle,nose],
    carousel:[-d.changer.centre,ySpindle,nose],                  // the tools' gauge plane is the nose's
    frontTop:d.frontSill+d.frontHeight-1,                        // 1770 (816 + 954 in the catalog)
    sideTop:d.sideDoor.bottom+d.sideHeight,                      // 1567
  };
}

function bodyVisual(L){
  const d=dimensions,{X,yF,yB,yWall,yWindow}=L,g=G(),Xi=X-d.wall,half=d.sideDoor.width/2;
  const zB=d.baseTop,zT=d.enclosureTop,[w0,w1]=[d.sideDoor.bottom,L.sideTop];
  // Levelling pads under the casting.
  d.pads.forEach(([x,y],i)=>{
    cyl(g,`pad_${i}_foot`,dark,62,x,y,0,22);cyl(g,`pad_${i}_stud`,steel,17,x,y,22,d.pad+12,20);
  });
  // The dark base: the skirt under the enclosure, the casting's foot under the column.
  bx(g,'base_skirt',base,[-X+12,X-12],[yF+12,yWall],[58,zB]);
  bx(g,'base_rear',base,[-560,560],[yWall,yB-90],[58,d.bedTop]);
  // Side walls, each with its window opening.
  for(const s of [-1,1]){
    const tag=s>0?'right':'left',x=[s*Xi,s*X];
    bx(g,`wall_${tag}_sill`,sheet,x,[yF,yWall],[zB,w0]);
    bx(g,`wall_${tag}_head`,sheet,x,[yF,yWall],[w1,zT]);
    bx(g,`wall_${tag}_front`,sheet,x,[yF,yWindow-half],[w0,w1]);
    bx(g,`wall_${tag}_rear`,sheet,x,[yWindow+half,yWall],[w0,w1]);
    // The lifting window's guides: two posts up to where the lifted leaf ends, a bar across.
    const lift=d.sideDoor.top-d.sideDoor.bottom,over=d.sideOver,zr=[w0,w1+over+lift];
    const xr=[s*X,s*(X+d.sideLeaf[1]+6)];
    for(const [side,y] of [['front',yWindow-half-over-20],['rear',yWindow+half+over+20]])
      bx(g,`window_rail_${tag}_${side}`,trim,xr,[y-20,y+20],zr);
    bx(g,`window_rail_${tag}_top`,trim,[s*(X+d.sideLeaf[0]),s*(X+d.sideLeaf[1])],
      [yWindow-half-over,yWindow+half+over],[zr[1]-30,zr[1]]);
  }
  // The front: apron and header through the wall, two skins beside the opening
  // with the doors' pocket between them.
  const [p0,p1]=d.pocket,jamb=d.sheetOpening/2,zS=d.frontSill,zH=L.frontTop;
  bx(g,'front_apron',sheet,[-Xi,Xi],[yF,p1],[zB,zS]);
  bx(g,'front_header',sheet,[-Xi,Xi],[yF,p1],[zH,zT]);
  for(const s of [-1,1]){
    const tag=s>0?'right':'left',x=[s*jamb,s*Xi];
    bx(g,`front_skin_${tag}`,sheet,x,[yF,p0],[zS,zH]);
    bx(g,`front_liner_${tag}`,sheet,x,[p1-8,p1],[zS,zH]);
    bx(g,`front_jamb_${tag}`,trim,[s*jamb,s*(jamb+6)],[yF-2,p0+4],[zS,zH]);
  }
  bx(g,'front_kick',base,[-X+12,X-12],[yF+4,yF+12],[zB-90,zB]);
  // The chamber's back wall beside the column, the chip pan, the Y ways' cover.
  for(const s of [-1,1])bx(g,`rear_wall_${s>0?'right':'left'}`,sheet,[s*d.column.half,s*Xi],[yWall-20,yWall],[d.bedTop,zT]);
  bx(g,'chip_pan',way,[-Xi,Xi],[p1,yWall-20],[d.bedTop-25,d.bedTop]);
  bx(g,'y_way_cover',way,[-300,300],[p1+60,yWall-20],[d.bedTop,d.saddle[0]-1]);
  for(const s of [-1,1])prismY(g,`pan_slope_${s>0?'right':'left'}`,way,
    [[s*Xi,d.bedTop],[s*(Xi-260),d.bedTop],[s*Xi,d.bedTop+110]],p1,yWall-20);
  // The column with its Z ways and motor.
  const c=d.column;
  bx(g,'column',casting,[-c.half,c.half],[yWall,c.back],[d.bedTop,c.top]);
  for(const s of [-1,1])bx(g,`z_way_${s>0?'right':'left'}`,steel,[s*150,s*185],[d.headBack,yWall-20],[950,c.top-10]);
  bx(g,'column_cap',casting,[-c.half+30,c.half-30],[yWall+40,c.back-40],[c.top,c.top+28]);
  cyl(g,'z_motor',dark,68,0,yWall+170,c.top+28,2213);
  // Lubrication and air on the column's left.
  bx(g,'lube_panel',sheet,[-520,-c.half],[330,640],[950,1500]);
  for(const [i,z] of [1320,1180].entries())rod(g,`lube_gauge_${i}`,dark,34,'x',-528,-520,420+i*130,z);
  bx(g,'lube_tank',trim,[-500,-300],[360,520],[820,950]);
  // The control cabinet on the back, its door seam, hinges, disconnect and vents.
  const cab={x:[X-d.cabinetDoors[0],X],y:[yB-d.cabinet.depth,yB],z:[d.cabinet.bottom,d.cabinetTop]};
  bx(g,'cabinet',sheet,cab.x,cab.y,cab.z);
  bx(g,'cabinet_plinth',base,[cab.x[0]+40,X-40],[cab.y[0]+40,yB-40],[58,cab.z[0]]);
  frame(g,'cabinet_door',trim,'y',[yB,yB+3],[cab.x[0]+40,cab.x[1]-40],[cab.z[0]+50,cab.z[1]-50],6);
  for(const [i,z] of [cab.z[0]+220,(cab.z[0]+cab.z[1])/2,cab.z[1]-220].entries())cyl(g,`cabinet_hinge_${i}`,trim,9,X-22,yB+8,z-45,z+45,12);
  bx(g,'cabinet_latch',dark,[cab.x[0]+60,cab.x[0]+90],[yB,yB+22],[1250,1400]);
  bx(g,'disconnect_plate',yellow,[X,X+3],[yB-200,yB-90],[1500,1610]);
  rod(g,'disconnect_knob',red,26,'x',X+3,X+30,yB-145,1555);
  frame(g,'cabinet_side_door',trim,'x',[X,X+3],[cab.y[0]+40,cab.y[0]+40+d.cabinetDoors[1]-80],[cab.z[0]+50,cab.z[1]-50],6);
  for(const i of [0,1,2,3,4,5])bx(g,`cabinet_vent_${i}`,dark,[X,X+3],[cab.y[0]+90,cab.y[0]+250],[1900+i*26,1912+i*26]);
  // The umbrella changer's carrier and hood (the carousel and its shuttle are links of their own).
  const h=d.hood;
  prismY(g,'changer_hood',cover,[[h.x[0],h.z[0]],[h.x[1],h.z[0]],[h.x[1],h.z[1]-h.chamfer],[h.x[1]-h.chamfer,h.z[1]],
    [h.x[0]+h.chamfer,h.z[1]],[h.x[0],h.z[1]-h.chamfer]],h.y[0],h.y[1]);
  bx(g,'changer_arm',casting,[-620,-500],[h.y[1],yWall],[h.z[0]+60,h.z[0]+190]);
  bx(g,'changer_arm_foot',casting,[-660,-460],[yWall-40,yWall-20],[h.z[0]+20,h.z[0]+230]);
  bx(g,'changer_seam',trim,[h.x[0]+h.chamfer+20,h.x[1]-h.chamfer-20],[h.y[0]-2,h.y[0]],[h.z[0]+60,h.z[0]+66]);
  // The pendant on its arm, its screen, keys and the four buttons a cell reaches for.
  const pz=d.pendantHeight,px=[628,988],py=[-1045,-994];
  bx(g,'pendant',pendantGrey,px,py,[pz-240,pz+240]);
  bx(g,'pendant_screen',screen,[660,956],[py[0]-2,py[0]],[pz+10,pz+210]);
  bx(g,'pendant_keys',cover,[660,956],[py[0]-2,py[0]],[pz-215,pz-20]);
  for(let r=0;r<4;r++)for(let k=0;k<7;k++)
    bx(g,`pendant_key_${r}_${k}`,key,[672+k*30,694+k*30],[py[0]-5,py[0]-2],[pz-205+r*30,pz-183+r*30]);
  const zButton=pz-54;                                      // 1357: the row the catalog's envelope reaches for
  for(const [name,x,mat] of [['cycle_start',740.5,green],['feed_hold',785.5,red],['reset',830.5,key]])
    rod(g,`pendant_${name}`,mat,13,'y',py[0]-9,py[0]-2,x,zButton,20);
  rod(g,'pendant_estop_collar',yellow,24,'y',py[0]-5,py[0]-2,875.5,zButton,24);
  rod(g,'pendant_estop',red,18,'y',py[0]-22,py[0]-5,875.5,zButton,24);
  rod(g,'pendant_jog',dark,30,'y',py[0]-16,py[0]-2,925,pz-150,28);
  bx(g,'pendant_post',trim,[790,826],[-1034,-1004],[pz+240,zT-40]);
  bx(g,'pendant_arm',trim,[790,Xi],[-1034,-1004],[zT-76,zT-40]);
  bx(g,'pendant_bracket',trim,[Xi-40,Xi],[-1034,yF+12],[zT-90,zT-26]);
  // The beacon on the enclosure's top.
  cyl(g,'beacon_mast',trim,14,1008,-842,zT,1918,16);
  for(const [i,mat] of [green,amber,red].entries())cyl(g,`beacon_${['green','amber','red'][i]}`,mat,30,1008,-842,1918+i*60,1978+i*60,24);
  cyl(g,'beacon_cap',trim,30,1008,-842,2098,2108,24);
  return g;
}

function bodyCollisions(L){
  const d=dimensions,{X,yF,yB,yWall,yWindow}=L,Xi=X-d.wall,half=d.sideDoor.width/2,zT=d.enclosureTop,out=[];
  out.push(cbox([-Xi,Xi],[yF,yWall],[0,d.bedTop]));                                      // bed and base
  for(const s of [-1,1]){
    const x=s>0?[Xi,X]:[-X,-Xi];
    out.push(cbox(x,[yF,yWall],[d.bedTop,d.sideDoor.bottom]),cbox(x,[yF,yWall],[L.sideTop,zT]),
      cbox(x,[yF,yWindow-half],[d.sideDoor.bottom,L.sideTop]),cbox(x,[yWindow+half,yWall],[d.sideDoor.bottom,L.sideTop]));
    const jamb=d.sheetOpening/2,xf=s>0?[jamb,Xi]:[-Xi,-jamb];
    out.push(cbox(xf,[yF,d.pocket[1]],[d.frontSill,L.frontTop]));
  }
  out.push(cbox([-Xi,Xi],[yF,d.pocket[1]],[d.bedTop,d.frontSill]),cbox([-Xi,Xi],[yF,d.pocket[1]],[L.frontTop,zT]));
  out.push(cbox([-d.column.half,d.column.half],[yWall,d.column.back],[0,2213]));       // column
  out.push(cbox([X-d.cabinetDoors[0],X],[yB-d.cabinet.depth,yB],[0,d.cabinetTop]));    // cabinet on its plinth
  out.push(cbox(d.hood.x,d.hood.y,d.hood.z));                                           // changer hood
  out.push(cbox([628,988],[-1045,-994],[d.pendantHeight-240,d.pendantHeight+240]));    // pendant
  return out;
}

function saddleVisual(L){
  const d=dimensions,g=G(),[,y]=L.saddle,[z0,z1]=d.saddle;
  bx(g,'saddle',casting,[-320,320],[y-210,y+210],[z0,z1]);
  for(const s of [-1,1])bx(g,`x_way_${s>0?'rear':'front'}`,steel,[-320,320],[y+s*130-14,y+s*130+14],[z1,z1+d.guide]);
  bx(g,'x_screw_cover',dark,[-320,320],[y-22,y+22],[z1,z1+12]);
  rod(g,'x_motor',dark,48,'x',320,455,y,z1-52);
  bx(g,'x_motor_mount',casting,[320,345],[y-70,y+70],[z0+10,z1]);
  return g;
}

/** The table in its own frame: the middle of its top, X along its length. */
function tableVisual(){
  const d=dimensions,g=G(),[len,wid]=d.table,hw=wid/2,t=d.tableThick,s=d.slot,deep=s.throatDepth+s.wideDepth;
  const profile=[[-hw,-t],[hw,-t],[hw,-1.5],[hw-1.5,0]];
  for(const c of [d.slotPitch,0,-d.slotPitch])profile.push([c+s.throat/2,0],[c+s.throat/2,-s.throatDepth],
    [c+s.wide/2,-s.throatDepth],[c+s.wide/2,-deep],[c-s.wide/2,-deep],[c-s.wide/2,-s.throatDepth],
    [c-s.throat/2,-s.throatDepth],[c-s.throat/2,0]);
  profile.push([-hw+1.5,0],[-hw,-1.5]);
  prismX(g,'table',steel,profile,-len/2,len/2);
  // The X ways' covers: three leaves stepping down from each end.
  for(const e of [-1,1])for(let i=0;i<3;i++)
    bx(g,`way_cover_${e>0?'right':'left'}_${i}`,way,[e*(len/2+60*i),e*(len/2+60*(i+1))],[-(hw-14-8*i),hw-14-8*i],[-(36+12*i),-(30+12*i)]);
  for(const e of [-1,1])bx(g,`table_end_${e>0?'right':'left'}`,trim,[e*(len/2-1),e*(len/2+4)],[-hw+6,hw-6],[-t+4,-30]);
  return g;
}

function headVisual(L){
  const d=dimensions,g=G(),[,ys,N]=L.head,z0=N+d.headBelow,hx=d.headHalf,yf=ys-d.headFront,yb=d.headBack;
  // The spindle: nose ring with its taper bore and drive keys, the cartridge above it.
  addMesh(g,'spindle_nose',ringGeometry(44.45,22.2,18),steel,[0,ys,N]);
  cyl(g,'spindle_bore',dark,22.2,0,ys,N+12,N+18,24);
  for(const s of [-1,1])bx(g,`drive_key_${s>0?'right':'left'}`,dark,[s*26,s*42],[ys-8,ys+8],[N-7,N+2]);
  cyl(g,'spindle_cartridge',casting,82,0,ys,N+18,z0,40);
  cyl(g,'cartridge_flange',steel,96,0,ys,z0-14,z0,40);
  // The head: casting below, sheet-metal cover above, the motor's cover on top.
  prismX(g,'head_casting',casting,[[yf+80,z0],[yb,z0],[yb,z0+140],[yf,z0+140],[yf,z0+80]],-hx,hx);
  bx(g,'head_cover',cover,[-hx-15,hx+15],[yf-10,yb],[z0+140,2120]);
  bx(g,'head_cover_band',trim,[-hx-17,hx+17],[yf-12,yf-10],[z0+300,z0+316]);
  bx(g,'head_plate',way,[-90,90],[yf-12,yf-10],[z0+360,z0+470]);
  rod(g,'tool_release',green,11,'y',yf-18,yf-10,hx-40,z0+200,16);
  bx(g,'motor_cover',cover,[-125,125],[ys-120,60],[2120,2560]);
  cyl(g,'motor_fan',dark,100,0,ys+100,2560,2590,32);
  for(const i of [0,1,2,3])bx(g,`motor_vent_${i}`,dark,[-127,-125],[ys-60,20],[2200+i*60,2224+i*60]);
  // Coolant nozzles beside the nose.
  for(const s of [-1,1])cylinderBetween(g,`coolant_nozzle_${s>0?'right':'left'}`,[s*100,yf+60,z0+10],[s*62,ys-70,N+30],6,dark,{radial:12});
  // The cable carrier: up the head's right side and over to the column.
  // Its top is the machine's: the published operating height. A flat chain,
  // drawn as the band it bends into.
  const x=hx+15+25,r=22,ya=ys-130,yb2=ys+165,R=(yb2-ya)/2,yc=(ya+yb2)/2,zc=d.height-r-R,band=[[ya-r,2130],[ya-r,zc]];
  for(let i=1;i<12;i++){const a=Math.PI-i*Math.PI/12;band.push([yc+(R+r)*Math.cos(a),zc+(R+r)*Math.sin(a)]);}
  band.push([yb2+r,zc],[yb2+r,2260],[yb2-r,2260],[yb2-r,zc]);
  for(let i=1;i<12;i++){const a=i*Math.PI/12;band.push([yc+(R-r)*Math.cos(a),zc+(R-r)*Math.sin(a)]);}
  band.push([ya+r,zc],[ya+r,2130]);
  prismX(g,'cable_carrier',dark,band,x-r,x+r);
  return g;
}

/** A front door leaf: `s` = -1 the left one, standing shut. */
function frontDoorVisual(L,s){
  const d=dimensions,g=G(),w=d.doorLeaf,y=d.doorSlab,z=[d.frontSill+2,L.frontTop-2],tag=s>0?'right':'left';
  const pane={x:[s*70,s*(w-55)],z:[z[0]+185,z[1]-90]};
  bx(g,'lower_panel',sheet,[0,s*w],y,[z[0],pane.z[0]]);
  bx(g,'upper_rail',sheet,[0,s*w],y,[pane.z[1],z[1]]);
  bx(g,'meeting_stile',sheet,[0,s*70],y,pane.z);
  bx(g,'outer_stile',sheet,[s*(w-55),s*w],y,pane.z);
  bx(g,'pane',glass,pane.x,[y[0]+9,y[0]+16],pane.z);
  bx(g,'seal',rubber,[0,s*5],[y[0]-2,y[1]+2],z);
  frame(g,'pane_gasket',rubber,'y',[y[0]-1,y[0]],[Math.min(...pane.x),Math.max(...pane.x)],pane.z,7);
  // The handle: a bar off the leaf's face, clear of the skin it slides behind.
  const hy=y[0]-17;
  cyl(g,'handle',steel,8,s*36,hy,z[0]+330,z[0]+630,16);
  for(const [i,hz] of [z[0]+360,z[0]+600].entries())rod(g,`handle_stub_${i}`,steel,6,'y',hy,y[0],s*36,hz,12);
  g.name=`front_door_${tag}`;
  return g;
}

/** A side window leaf: `s` = +1 the right one, standing shut. */
function sideDoorVisual(L,s){
  const d=dimensions,g=G(),{X,yWindow}=L,half=d.sideDoor.width/2,over=d.sideOver;
  const x=[s*(X+d.sideLeaf[0]),s*(X+d.sideLeaf[1])],y=[yWindow-half-over,yWindow+half+over],z=[d.sideDoor.bottom+1,L.sideTop+over];
  const pane={y:[y[0]+60,y[1]-60],z:[z[0]+60,z[1]-60]};
  bx(g,'lower_rail',sheet,x,y,[z[0],pane.z[0]]);
  bx(g,'upper_rail',sheet,x,y,[pane.z[1],z[1]]);
  bx(g,'front_stile',sheet,x,[y[0],pane.y[0]],pane.z);
  bx(g,'rear_stile',sheet,x,[pane.y[1],y[1]],pane.z);
  bx(g,'pane',glass,[s*(X+d.sideLeaf[0]+16),s*(X+d.sideLeaf[0]+24)],pane.y,pane.z);
  // The handle a gripper closes on: a bar 90 mm off the leaf at its front edge, 200 mm over the sill.
  const hx=s*(X+d.sideLeaf[1]+90),hy=y[0]+over,hz=d.sideDoor.bottom+200;
  cyl(g,'handle',steel,10,hx,hy,hz-100,hz+100,16);
  for(const [i,dz] of [-50,50].entries())rod(g,`handle_stub_${i}`,steel,7,'x',x[1],hx,hy,hz+dz,12);
  return g;
}

/** The changer's shuttle: the hub's cover and its drive, on the carriage that runs under the hood. */
function shuttleVisual(L){
  const d=dimensions,g=G(),[cx,cy,N]=L.carousel;
  cyl(g,'hub_cover',cover,195,cx,cy,N-4,N+82,48);
  cyl(g,'hub_shaft',steel,45,cx,cy,N+82,d.hood.z[0]+4,24);
  cyl(g,'drive_motor',dark,58,cx-112,cy+40,N+82,d.hood.z[0]+4,24);
  return g;
}

/** The carousel: a disc with a U-shaped pocket for each tool, open to the rim. */
function carouselVisual(L){
  const d=dimensions,c=d.changer,g=G(),[cx,cy,N]=L.carousel,R=c.radius,Rp=c.toolCircle/2,w=23,n=c.pockets;
  const points=[],edge=Math.sqrt(R*R-w*w),half=Math.asin(w/R),step=2*Math.PI/n;
  for(let k=0;k<n;k++){
    const a=k*step,u=[Math.cos(a),Math.sin(a)],v=[-u[1],u[0]];
    points.push([u[0]*edge-v[0]*w,u[1]*edge-v[1]*w]);                    // into the pocket
    for(let i=0;i<=8;i++){                                                  // around its closed end
      const b=a-Math.PI/2-i*Math.PI/8;points.push([u[0]*Rp+w*Math.cos(b),u[1]*Rp+w*Math.sin(b)]);
    }
    points.push([u[0]*edge+v[0]*w,u[1]*edge+v[1]*w]);                    // and out again
    for(let i=1;i<3;i++){                                                   // the rim to the next pocket
      const b=a+half+(step-2*half)*i/3;points.push([R*Math.cos(b),R*Math.sin(b)]);
    }
  }
  const disc=new THREE.ExtrudeGeometry(outline(points),{...flat,depth:20});
  addMesh(g,'carousel_disc',disc,dark,[cx,cy,N-24]);
  for(let k=0;k<n;k++){
    const a=(k+0.5)*step;cyl(g,`pocket_key_${k}`,steel,12,cx+245*Math.cos(a),cy+245*Math.sin(a),N-4,N+8,12);
  }
  // The hub under the disc, down to the drawing's lowest points over the table.
  cyl(g,'hub_drum',casting,105,cx,cy,d.tableTop+c.low[0],N-24,40);
  cyl(g,'hub_boss',steel,60,cx,cy,d.tableTop+c.low[1],d.tableTop+c.low[0],32);
  return g;
}

export function definition(){
  const d=dimensions,L=layout(),links=[],joints=[],{X,yWindow}=L;
  const speed=Number(d.rapid.toFixed(5));
  const slide=(name,parent,child,origin,axis,lower,upper,velocity)=>joints.push({name,type:'prismatic',parent,child,
    xyz:origin.map(m),axis,limit:{lower:m(lower),upper:m(upper),velocity,effort:0}});

  // --- body: everything that stands still. Its frame is the machine's. ---
  links.push({name:'body',visual:visual(bodyVisual(L),[0,0,0]),collisions:bodyCollisions(L)});

  // --- the axes: joint values are machine coordinates, 0 at home and negative from there ---
  const [sz0,sz1]=d.saddle;
  links.push({name:'saddle',visual:visual(saddleVisual(L),L.saddle),
    collisions:[cbox([-320,320],[L.saddle[1]-210,L.saddle[1]+210],[sz0,sz1+d.guide],L.saddle)]});
  slide('y','body','saddle',L.saddle,[0,-1,0],-d.travel[1],0,speed);
  // The table's frame is the middle of its top.
  const table=fromMillimeters(tableVisual());
  links.push({name:'table',visual:table,collisions:[{kind:'box',size:[m(d.table[0]),m(d.table[1]),m(d.tableThick)],xyz:[0,0,m(-d.tableThick/2)]}]});
  slide('x','saddle','table',[L.table[0]-L.saddle[0],L.table[1]-L.saddle[1],L.table[2]-L.saddle[2]],[-1,0,0],-d.travel[0],0,speed);
  // The head's frame is the middle of the spindle nose.
  const z0=L.nose+d.headBelow,yf=L.ySpindle-d.headFront;
  links.push({name:'head',visual:visual(headVisual(L),L.head),collisions:[
    cbox([-d.headHalf-15,d.headHalf+15],[yf-10,d.headBack],[z0,2120],L.head),
    cbox([-125,125],[L.ySpindle-120,60],[2120,2590],L.head),
    {kind:'cylinder',radius:m(96),length:m(d.headBelow),xyz:[0,0,m(d.headBelow/2)]}]});
  slide('z','body','head',L.head,[0,0,1],-d.travel[2],0,speed);

  // --- the front doors: two leaves parting from the middle, each half the opening ---
  const fz=[d.frontSill+2,L.frontTop-2],fy=(d.doorSlab[0]+d.doorSlab[1])/2;
  for(const s of [-1,1]){
    const name=`front_door_${s>0?'right':'left'}`,origin=[s*d.doorLeaf/2,fy,(fz[0]+fz[1])/2];
    links.push({name,visual:visual(frontDoorVisual(L,s),origin),
      collisions:[cbox(s>0?[1,d.doorLeaf]:[-d.doorLeaf,-1],d.doorSlab,fz,origin)]});   // a hair apart where they meet
    slide(name,'body',name,origin,[s,0,0],0,d.frontOpening/2,0.4);
  }
  // --- the side windows: each lifts by the height of its passage ---
  const half=d.sideDoor.width/2,sy=[yWindow-half-d.sideOver,yWindow+half+d.sideOver],sz=[d.sideDoor.bottom+1,L.sideTop+d.sideOver];
  for(const s of [-1,1]){
    const name=`side_door_${s>0?'right':'left'}`,sx=s>0?[X+d.sideLeaf[0],X+d.sideLeaf[1]]:[-X-d.sideLeaf[1],-X-d.sideLeaf[0]];
    const origin=[(sx[0]+sx[1])/2,yWindow,(sz[0]+sz[1])/2];
    links.push({name,visual:visual(sideDoorVisual(L,s),origin),collisions:[cbox(sx,sy,sz,origin)]});
    slide(name,'body',name,origin,[0,0,1],0,d.sideDoor.top-d.sideDoor.bottom,0.4);
  }

  // --- the umbrella changer: the shuttle carries the carousel to the spindle, the carousel turns ---
  const c=d.changer,reach=c.centre-c.toolCircle/2;        // 229.5: the printed 230 to the drawing's rounding
  links.push({name:'tool_shuttle',visual:visual(shuttleVisual(L),L.carousel),
    collisions:[{kind:'cylinder',radius:m(195),length:m(86),xyz:[0,0,m(39)]}]});
  slide('tool_shuttle','body','tool_shuttle',L.carousel,[1,0,0],0,reach,0.3);
  links.push({name:'tool_carousel',visual:visual(carouselVisual(L),L.carousel),
    collisions:[{kind:'cylinder',radius:m(c.radius),length:m(20),xyz:[0,0,m(-14)]}]});
  joints.push({name:'tool_carousel',type:'continuous',parent:'tool_shuttle',child:'tool_carousel',xyz:[0,0,0],axis:[0,0,1],
    limit:{velocity:3.0,effort:0}});
  // No invented mass, centre of gravity or inertia.
  return {name:'haas_vf_2_reference',links,joints};
}
