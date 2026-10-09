/** CC0 authored shells for the FANUC M-410iC/185 (pedestal type base).
 * Numeric datasheet dimensions only; no imported CAD, meshes or drawings. */
import * as THREE from 'three';
import {addMesh, namedMaterial, roundedBox, cylinderZ, cylinderBetween, tubeGeometry, ellipseHole, roundedRectangle}
  from '@botrail/authoring/geometry.mjs';
import {casting,profile} from './casting.mjs';

const deg = Math.PI / 180;

// FANUC America M-410iC/185 public data sheet, operating-space
// drawing (pedestal type base): J1-J2 offset 390, J2 height 1110, J2-J3 1220,
// J3-wrist 1300, wrist-faceplate 255 forward and 159 down. Reach 3143 mm.
export const DIM = Object.freeze({
  j2x: 0.390, j2z: 1.110, lower: 1.220, upper: 1.300, wristX: 0.255, wristZ: -0.159,
  j1z: 0.615, // J1 bearing plane: authored split between base and turret
});
// Motion ranges 360 / 144 / 136 / 720 deg. The split of J2 and J3 is fitted to
// the drawing's operating space: faceplate top 2397 (J2 0, J3 +10), bottom
// -561 (J2 +100, J3 -90). The published figures give only each axis's span.
// J3 is the upper arm's angle from horizontal (the parallelogram's absolute angle).
export const limitsDeg = [[-180, 180], [-44, 100], [-126, 10], [-360, 360]];
export const speedsDeg = [140, 140, 140, 305];
// The parallel links, read off the drawing's proportions (authored, not published):
// the J3 drive crank / upper-arm rear lever, and the two wrist-levelling offsets.
export const CRANK = [-0.51, 0, 0.27];
export const LEVEL_LOWER = [-0.26, 0, 0.10];
export const LEVEL_UPPER = [0.485, 0, 0.279];
const CRANK_Y = -0.34, ROD_Y = -0.40, LEVEL_Y = 0.21;

const yellow = namedMaterial('fanuc_yellow', '#f2d000', 0.08, 0.42);
const graphite = namedMaterial('base_graphite', '#3b3e41', 0.25, 0.72);
const motor = namedMaterial('motor_black', '#1c1e20', 0.3, 0.55);
const red = namedMaterial('motor_cover_red', '#d4271b', 0.08, 0.45);
const steel = namedMaterial('faceplate_steel', '#9ea4a9', 0.8, 0.34);
const sleeve = namedMaterial('cable_sleeve', '#7d705f', 0.0, 0.85);

const G = () => new THREE.Group();
const box = (size, xyz, rpy = [0, 0, 0]) => ({kind: 'box', size, xyz, rpy});
const cyl = (radius, length, xyz, rpy = [0, 0, 0]) => ({kind: 'cylinder', radius, length, xyz, rpy});
const Y = [Math.PI / 2, 0, 0]; // a URDF cylinder (+Z) laid along Y

function shell(g, name, size, at, material = yellow, radius = 0.03) {
  return addMesh(g, name, roundedBox(size, Math.min(radius, Math.min(...size) / 2 - 1e-4), 3), material, at);
}
function disc(g, name, at, radius, length, axis, material = yellow) {
  const d = {x: [length / 2, 0, 0], y: [0, length / 2, 0], z: [0, 0, length / 2]}[axis];
  return cylinderBetween(g, name, at.map((v, i) => v - d[i]), at.map((v, i) => v + d[i]), radius, material, {radial: 48});
}
/** A beam between a and b in the link's XZ plane: `w` across (along Y) and
 * `h` in-plane, tapering from the first pair to the second. Flat faces. */
function beam(g, name, a, b, [w0, h0], [w1, h1], material = yellow, y = 0) {
  const A = new THREE.Vector3(a[0], y, a[2]), B = new THREE.Vector3(b[0], y, b[2]);
  const u = B.clone().sub(A).normalize(), W = new THREE.Vector3(0, 1, 0), H = u.clone().cross(W).normalize();
  const corner = (P, w, h, s, t) => P.clone().addScaledVector(W, s * w / 2).addScaledVector(H, t * h / 2);
  const c = [];
  for (const [P, w, h] of [[A, w0, h0], [B, w1, h1]])
    for (const [s, t] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) c.push(corner(P, w, h, s, t));
  const quads = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
  const positions = [];
  for (const [p, q, r, s] of quads) for (const i of [p, q, r, p, r, s]) positions.push(...c[i].toArray());
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  // Winding follows the corner order; make every face point away from the axis.
  const mid = A.clone().add(B).multiplyScalar(0.5), n = geometry.attributes.normal, pos = geometry.attributes.position;
  const v = new THREE.Vector3(), m = new THREE.Vector3();
  for (let f = 0; f < 6; f++) {
    v.fromBufferAttribute(pos, f * 6); m.fromBufferAttribute(n, f * 6);
    if (m.dot(v.clone().sub(mid)) < 0) {
      for (let k = 0; k < 6; k += 3) {
        const i = f * 6 + k;
        const tmp = [pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1)];
        pos.setXYZ(i + 1, pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2));
        pos.setXYZ(i + 2, ...tmp);
      }
    }
  }
  geometry.computeVertexNormals();
  return addMesh(g, name, geometry, material);
}
/** A plate in the XZ plane through the points (x, z) — or a Shape drawn in
 * (x, z) — `t` thick about y. */
function prism(g, name, points, t, material = yellow, y = 0) {
  const shape = points instanceof THREE.Shape ? points : new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, z)));
  const geometry = new THREE.ExtrudeGeometry(shape, {depth: t, bevelEnabled: false});
  geometry.rotateX(Math.PI / 2); // (x, s, d) -> (x, -d, s)
  geometry.translate(0, y + t / 2, 0);
  return addMesh(g, name, geometry, material);
}

/** Front-face profile in Y/Z, extruded toward +X; all dimensions authored. */
function frontProfile(g,name,shape,depth,x,material=yellow,bevel=.008){
  const geo=new THREE.ExtrudeGeometry(shape,{depth:depth-2*bevel,bevelEnabled:bevel>0,
    bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:16});
  const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const u=p.getX(i),v=p.getY(i),d=p.getZ(i);p.setXYZ(i,x+bevel+d,u,v);}
  geo.computeVertexNormals();return addMesh(g,name,geo,material);
}
function outline(points){const v=points.map(p=>new THREE.Vector2(...p));if(THREE.ShapeUtils.isClockWise(v))v.reverse();return new THREE.Shape(v);}
function baseVisual() {
  const g=G();
  // Open pedestal frame and separate service cabinet, rather than a solid box.
  // Retained 1094 x 945 overall footprint is an inherited visual estimate.
  for(const side of [-1,1])shell(g,`pedestal_foot_${side}`,[1.094,.14,.055],[-.07,side*.4025,.0275],graphite,.014);
  const portal=()=>{
    const s=outline([[-.43,.055],[-.37,.15],[-.30,.505],[.30,.505],[.37,.15],[.43,.055]]);
    ellipseHole(s,0,.16,.135,.065);ellipseHole(s,0,.365,.125,.074);return s;
  };
  frontProfile(g,'pedestal_front_portal',portal(),.085,.355,graphite,.012);
  frontProfile(g,'pedestal_rear_portal',portal(),.085,-.585,graphite,.012);
  shell(g,'pedestal_top_casting',[.94,.82,.075],[-.07,0,.5375],graphite,.027);
  // The cabinet sits between structural portal legs. Service-side and opposite
  // side differ; these panels and openings are photo-guided approximations.
  shell(g,'pedestal_cabinet',[.73,.18,.425],[-.07,-.19,.27],graphite,.015);
  shell(g,'service_door',[.69,.018,.38],[-.07,-.294,.27],motor,.008);
  shell(g,'service_vent_panel',[.34,.025,.17],[-.20,-.308,.34],steel,.008);
  for(let i=0;i<7;i++)shell(g,`service_louver_${i}`,[.28,.008,.006],[-.20,-.324,.28+i*.02],motor,.001);
  shell(g,'service_connector_cover',[.17,.040,.10],[.15,-.31,.14],motor,.008);
  addMesh(g,'j1_bearing_lower',cylinderZ(.335,.04,{radial:64}),motor,[0,0,.588]);
  addMesh(g,'j1_bearing_rim',cylinderZ(.355,.012,{radial:64}),steel,[0,0,.609]);
  return g;
}

function turretVisual() {
  const g=G(),zj2=DIM.j2z-DIM.j1z;
  addMesh(g,'turret_turntable',cylinderZ(.36,.05,{radial:64}),yellow,[0,0,.025]);
  casting(g,'turret_casting',[[.04,-.04,0,.35,.29,3],[.08,-.03,0,.38,.29,3],
    [.20,.00,0,.37,.26,3],[.33,.11,0,.27,.23,3]],yellow);
  for(const side of [-1,1]){
    const name=side>0?'l':'r';
    const cheek=outline([[-.14,.08],[.53,.08],[.62,.23],[.61,.49],[.50,.68],[.27,.68],[.10,.43],[-.14,.22]]);
    profile(g,`j2_cast_cheek_${name}`,cheek,.085,side*.245,yellow,.012);
    disc(g,`j2_reducer_${name}`,[DIM.j2x,side*.294,zj2],.235,.06,'y');
    disc(g,`j2_rim_${name}`,[DIM.j2x,side*.328,zj2],.217,.014,'y');
    disc(g,`j2_drive_face_${name}`,[DIM.j2x,side*.34,zj2],.172,.013,'y',yellow);
    shell(g,`motor_${name}`,[.215,.18,.205],[DIM.j2x,side*.435,zj2],motor,.016);
    disc(g,`motor_cover_${name}`,[DIM.j2x,side*.539,zj2],.096,.027,'y',red);
    // Visual fasteners only: circle is estimated and is not a mounting interface.
    for(let i=0;i<16;i++){const t=i*Math.PI/8;
      disc(g,`reducer_fastener_${name}_${i}`,[DIM.j2x+.192*Math.cos(t),side*.343,zj2+.192*Math.sin(t)],.010,.01,'y',motor);
    }
  }
  shell(g,'rear_service_casting',[.18,.40,.25],[-.24,0,.17],yellow,.024);
  return g;
}

export const POCKETS=Object.freeze({z:[.39,.65,.91],radiusY:.045,radiusZ:.079,wallThickness:.075});
function lowerArmVisual() {
  const g=G();
  disc(g,'j2_hub',[0,0,0],.208,.37,'y');
  // Rounded, bent casting with a front perforated wall and a separate recessed
  // backing mass. The three holes have real walls and floors, never black decals.
  casting(g,'lower_arm_back',[[.10,-.025,0,.11,.171,3],[.20,-.02,0,.108,.165,3],
    [.28,-.023,0,.103,.139,3],[.96,-.047,0,.099,.126,3],
    [1.06,-.066,0,.128,.154,3],[1.15,-.046,0,.14,.154,3]],yellow);
  const face=outline([[-.17,.13],[-.158,.23],[-.132,.31],[-.125,.94],[-.153,1.025],
    [-.153,1.13],[.153,1.13],[.153,1.025],[.125,.94],[.132,.31],[.158,.23],[.17,.13]]);
  for(const z of POCKETS.z)ellipseHole(face,0,z,POCKETS.radiusY,POCKETS.radiusZ);
  const wall=frontProfile(g,'lower_arm_front_pocket_wall',face,POCKETS.wallThickness,.055,yellow,.009);
  // Small profile lean is an authored surface contour, separate from joint axes.
  const pos=wall.geometry.attributes.position;
  for(let i=0;i<pos.count;i++)pos.setX(i,pos.getX(i)-.035*Math.max(0,Math.min(1,(pos.getZ(i)-.25)/.72)));
  wall.geometry.computeVertexNormals();
  // The backing casting terminates each pocket about 44–48 mm behind its rim.
  disc(g,'elbow_boss',[0,0,DIM.lower],.157,.35,'y');
  for(const side of [-1,1])disc(g,`elbow_bearing_seal_${side}`,[0,side*.185,DIM.lower],.117,.025,'y',motor);
  return g;
}

function elbowPlateVisual() {
  const g = G(), [lx, , lz] = LEVEL_LOWER, [ux, , uz] = LEVEL_UPPER;
  prism(g, 'level_plate', [[-0.04, -0.06], [lx, lz - 0.05], [lx - 0.02, lz + 0.05], [ux, uz + 0.05], [ux + 0.05, uz - 0.03]],
    0.06, yellow, 0);
  disc(g, 'level_pin_lower', [lx, LEVEL_Y / 2, lz], 0.035, LEVEL_Y + 0.05, 'y', steel);
  disc(g, 'level_pin_upper', [ux, 0, uz], 0.045, 0.10, 'y', steel);
  return g;
}

function upperArmVisual() {
  const g=G(),[cx,,cz]=CRANK;
  disc(g,'elbow_hub',[0,0,0],.17,.45,'y');
  for(const side of [-1,1])disc(g,`elbow_outer_cap_${side}`,[0,side*.238,0],.124,.023,'y',motor);
  // Cast upper arm: radiused shoulder transitions, modest sweep and a narrower
  // distal section. Section dimensions are original visual estimates.
  casting(g,'upper_arm_casting',[[.04,0,.026,.157,.154,3],[.12,0,.044,.155,.164,3],
    [.27,0,.055,.144,.144,3],[.44,0,.012,.126,.111,3],[.83,0,-.008,.106,.090,3],
    [1.11,0,-.018,.09,.078,3],[1.245,0,-.002,.101,.073,3]],yellow,'x');
  const lever=outline([[.14,-.085],[-.11,-.11],[-.28,.065],[cx-.055,cz-.03],
    [cx-.035,cz+.075],[-.22,.30],[.03,.185]]);
  profile(g,'rear_lever_casting',lever,.29,0,yellow,.016);
  disc(g,'rear_pin',[cx,(ROD_Y-.1)/2,cz],.06,Math.abs(ROD_Y)+.12,'y',steel);
  disc(g,'rear_pin_cap',[cx,ROD_Y-.067,cz],.052,.02,'y',motor);
  disc(g,'wrist_boss',[DIM.upper,0,0],.103,.265,'y');
  for(const side of [-1,1])disc(g,`wrist_bearing_cap_${side}`,[DIM.upper,side*.148,0],.084,.025,'y',motor);
  shell(g,'upper_service_cover',[.22,.018,.13],[-.04,-.153,.066],yellow,.008);
  return g;
}

function wristVisual() {
  const g=G(),[ux,,uz]=LEVEL_UPPER,x4=DIM.wristX;
  const shape=()=>{const s=outline([[-.065,-.048],[x4+.135,-.053],[ux+.065,uz-.012],
    [ux+.047,uz+.052],[ux-.034,uz+.06],[x4-.045,.085],[-.045,.044]]);
    const h=new THREE.Path();h.moveTo(x4+.017,.063);h.lineTo(ux-.027,uz-.025);h.lineTo(ux-.097,uz-.025);h.lineTo(x4-.005,.12);h.closePath();s.holes.push(h);return s;};
  for(const side of [-1,1])profile(g,`wrist_fork_cheek_${side}`,shape(),.038,side*.115,yellow,.009);
  disc(g,'level_pin_front',[ux,0,uz],.045,.305,'y',steel);
  for(const side of [-1,1])disc(g,`level_pin_front_cap_${side}`,[ux,side*.162,uz],.039,.018,'y',yellow);
  shell(g,'wrist_cast_bridge',[.27,.275,.085],[x4,0,-.037],yellow,.025);
  addMesh(g,'j4_housing',cylinderZ(.153,.075,{radial:64}),yellow,[x4,0,-.081]);
  addMesh(g,'j4_reducer',cylinderZ(.131,.055,{radial:64}),motor,[x4,0,DIM.wristZ+.040]);
  shell(g,'j4_motor',[.144,.15,.205],[x4-.034,0,.120],motor,.013);
  disc(g,'j4_motor_cover',[x4-.034,0,.232],.066,.026,'z',red);
  // One-sided connector plate and short protected lead, estimated from the
  // official wrist detail; no connector pinout or mounting dimensions claimed.
  shell(g,'wrist_connector_panel',[.12,.022,.16],[x4+.068,.094,.137],yellow,.006);
  for(const [i,z] of [.10,.162].entries())disc(g,`wrist_connector_${i}`,[x4+.068,.115,z],.018,.022,'y',motor);
  addMesh(g,'wrist_motor_lead',cappedTube([[x4-.03,.045,.23],[x4+.05,.07,.235],[x4+.08,.13,.185]],.009),motor);
  return g;
}

function flangeVisual() {
  const g = G();
  addMesh(g, 'faceplate', cylinderZ(0.125, 0.024, {radial: 64}), steel, [0, 0, 0.012]);
  return g;
}

function crankVisual() {
  const g = G(), [cx, , cz] = CRANK;
  disc(g, 'crank_hub', [0, 0, 0], 0.11, 0.07, 'y');
  beam(g, 'crank_lever', [0, 0, 0], [cx, 0, cz], [0.07, 0.20], [0.07, 0.13]);
  disc(g, 'crank_pin', [cx, (ROD_Y - CRANK_Y) / 2, cz], 0.055, 0.14, 'y', steel);
  return g;
}

function cappedTube(points,radius){
  const g=tubeGeometry(points,radius,{tubular:24,radial:16}),p=g.attributes.position;
  const values=Array.from(p.array),indices=Array.from(g.index.array);
  for(const [start,reverse] of [[0,false],[24*17,true]]){
    const center=values.length/3,point=[0,0,0];
    for(let k=0;k<16;k++)for(let c=0;c<3;c++)point[c]+=values[(start+k)*3+c]/16;
    values.push(...point);
    for(let k=0;k<16;k++){const a=start+k,b=start+(k+1)%16;
      indices.push(...(reverse?[center,b,a]:[center,a,b]));}
  }
  g.setAttribute('position',new THREE.Float32BufferAttribute(values,3));g.setIndex(indices);g.deleteAttribute('normal');g.deleteAttribute('uv');g.computeVertexNormals();return g;
}
function rodVisual() {
  const g = G();
  profile(g,'j3_cast_rod',outline([[-.055,.02],[-.10,.25],[-.115,.55],[-.075,1.12],[-.045,1.22],[.046,1.22],[.024,.57],[.028,.24],[.055,.02]]),.08,0,yellow,.011);
  for (const [k, z] of [0, DIM.lower].entries()) disc(g, `j3_rod_eye${k}`, [0, 0, z], 0.075, 0.09, 'y');
  addMesh(g, 'cable_sleeve', cappedTube([[-0.10, 0.02, 0.10], [-0.13, 0.03, 0.62], [-0.10, 0.02, 1.12]], 0.045), sleeve);
  for(const [i,p] of [[-.10,.02,.10],[-.10,.02,1.12]].entries())addMesh(g,`sleeve_end_${i}`,new THREE.SphereGeometry(.045,16,12),sleeve,p);
  return g;
}

function levelRodVisual(name, length, along) {
  const g = G(), b = along === 'z' ? [0, 0, length] : [length, 0, 0];
  beam(g, name, [0, 0, 0], b, [0.05, 0.06], [0.05, 0.06]);
  return g;
}

const fixed = (name, parent, child, xyz = [0, 0, 0], rpy = [0, 0, 0]) => ({name, type: 'fixed', parent, child, xyz, rpy});
const turn = (name, parent, child, xyz, axis, i) => ({name, type: 'revolute', parent, child, xyz, axis,
  limit: {lower: limitsDeg[i][0] * deg, upper: limitsDeg[i][1] * deg, velocity: speedsDeg[i] * deg}});
// A passive joint of the parallelogram: follows a commanded axis. Continuous so
// the importer needs no limits of its own; the source joint carries them.
const follow = (name, parent, child, xyz, axis, joint, multiplier) =>
  ({name, type: 'continuous', parent, child, xyz, axis, limit: {velocity: 10}, mimic: {joint, multiplier, offset: 0}});

export function definition() {
  const zj2 = DIM.j2z - DIM.j1z;
  const [cx, , cz] = CRANK, [lx, , lz] = LEVEL_LOWER, [ux, , uz] = LEVEL_UPPER;
  const links = [
    {name: 'base_link', visual: baseVisual(), collisions: [box([1.02, 0.90, 0.57], [-0.07, 0, 0.285])]},
    {name: 'J1_link', visual: turretVisual(), collisions: [
      box([0.80, 0.62, 0.40], [0.00, 0, 0.20]), box([0.34, 0.50, 0.30], [-0.36, 0, 0.20]),
      cyl(0.25, 0.62, [DIM.j2x, 0, zj2], Y), box([0.24, 1.10, 0.24], [0.22, 0, 0.30])]},
    {name: 'J2_link', visual: lowerArmVisual(), collisions: [box([0.30, 0.36, 1.40], [0, 0, 0.62])]},
    // The parallel links are bodies too: primitives along each, kept clear
    // of the arms they run beside (a link without one would collide as its mesh).
    {name: 'elbow_link', visual: elbowPlateVisual(), collisions: [box([0.10, 0.06, 0.10], [0, 0, 0])]},
    {name: 'J3_link', visual: upperArmVisual(), collisions: [
      box([1.36, 0.30, 0.27], [0.62, 0, 0]), box([0.42, 0.30, 0.30], [-0.24, 0, 0.13])]},
    {name: 'wrist_link', visual: wristVisual(), collisions: [
      box([0.50, 0.22, 0.44], [0.14, 0, 0.07]), cyl(0.15, 0.13, [DIM.wristX, 0, -0.09])]},
    {name: 'J4_link', visual: flangeVisual(), collisions: [cyl(0.125, 0.024, [0, 0, 0.012])]},
    {name: 'crank_link', visual: crankVisual(), collisions: [
      box([Math.hypot(cx, cz), 0.07, 0.16], [cx / 2, 0, cz / 2], [0, -Math.atan2(cz, cx), 0])]},
    {name: 'rod_pivot_link'},
    {name: 'rod_link', visual: rodVisual(), collisions: [box([0.13, 0.08, DIM.lower], [0, 0, DIM.lower / 2])]},
    {name: 'level_lower_link', visual: levelRodVisual('level_rod_lower', DIM.lower, 'z'),
      collisions: [box([0.06, 0.05, DIM.lower], [0, 0, DIM.lower / 2])]},
    {name: 'level_upper_link', visual: levelRodVisual('level_rod_upper', DIM.upper, 'x'),
      collisions: [box([DIM.upper - 0.30, 0.05, 0.06], [DIM.upper / 2, 0, 0])]},
    {name: 'flange'}, {name: 'tool0'},
  ];
  const joints = [
    turn('J1', 'base_link', 'J1_link', [0, 0, DIM.j1z], [0, 0, 1], 0),
    turn('J2', 'J1_link', 'J2_link', [DIM.j2x, 0, zj2], [0, 1, 0], 1),
    // The lower arm's top holds a level frame: J3 is the upper arm's angle to it.
    follow('J2_level', 'J2_link', 'elbow_link', [0, 0, DIM.lower], [0, 1, 0], 'J2', -1),
    turn('J3', 'elbow_link', 'J3_link', [0, 0, 0], [0, -1, 0], 2),
    follow('J3_level', 'J3_link', 'wrist_link', [DIM.upper, 0, 0], [0, -1, 0], 'J3', -1),
    turn('J4', 'wrist_link', 'J4_link', [DIM.wristX, 0, DIM.wristZ], [0, 0, -1], 3),
    fixed('J4_flange', 'J4_link', 'flange', [0, 0, 0], [Math.PI, 0, 0]),
    fixed('flange_tool0', 'flange', 'tool0'),
    // Presentation of the two parallelograms (no collision): the J3 crank and
    // drive rod, and the wrist-levelling rods on either side of the elbow plate.
    follow('J3_crank', 'J1_link', 'crank_link', [DIM.j2x, CRANK_Y, zj2], [0, -1, 0], 'J3', 1),
    follow('J3_rod_unturn', 'crank_link', 'rod_pivot_link', [cx, ROD_Y - CRANK_Y, cz], [0, -1, 0], 'J3', -1),
    follow('J3_rod', 'rod_pivot_link', 'rod_link', [0, 0, 0], [0, 1, 0], 'J2', 1),
    follow('level_lower', 'J1_link', 'level_lower_link', [DIM.j2x + lx, LEVEL_Y, zj2 + lz], [0, 1, 0], 'J2', 1),
    follow('level_upper', 'elbow_link', 'level_upper_link', [ux, 0, uz], [0, -1, 0], 'J3', 1),
  ];
  return {name: 'fanuc_m410ic_185_reference', links, joints};
}
