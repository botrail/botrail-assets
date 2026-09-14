/** Unitree G1 Camera/Radar fixed plates: independent visual references.
 * Millimetres during construction, metres on export. Every construction
 * dimension is an estimate: see provenance.json. No verified fastener fit.
 */
import * as THREE from 'three';
import { namedMaterial, addMesh, ellipseHole, fromMillimeters }
  from '@botrail/authoring/geometry.mjs';

export const DIM = Object.freeze({ thickness: 2, camera: [44, 60], radar: [49.6, 62.4] });
const finish = namedMaterial('black_coated_plate', 0x22282c, 0.6, 0.34);

function outline(points, scale = 1) {
  const s = new THREE.Shape();
  points.forEach(([x,y],i) => i ? s.lineTo(x*scale,y*scale) : s.moveTo(x*scale,y*scale));
  s.closePath();
  return s;
}

export function definition(kind) {
  if (!['camera', 'radar'].includes(kind)) throw new Error(`Unknown plate: ${kind}`);
  const body = new THREE.Group();
  const scale = kind === 'radar' ? .8 : 1;
  // Trapezoidal camera carrier with the open fork visible in the product photo.
  // The radar carrier has clipped corners and a single projecting rear lug.
  const shape = kind === 'camera'
    ? outline([[22,-30],[22,30],[-22,18],[-22,5],[-11,5],[-8,3],
        [-8,-3],[-11,-5],[-22,-5],[-22,-18]])
    : outline([[28,-24],[28,24],[8,39],[-21,24],[-21,8],[-34,8],
        [-34,-4],[-22,-9],[-22,-26],[5,-39]], scale);
  const holes = kind === 'camera'
    ? [[17,-25],[17,25],[-17,-11],[-17,11]]
    : [[4,-33],[7,33],[-28,2]];
  for (const [x,y] of holes) ellipseHole(shape, x*scale, y*scale, 2);
  addMesh(body, `${kind}_pressed_plate`, new THREE.ExtrudeGeometry(shape,
    {depth:DIM.thickness, bevelEnabled:true, bevelThickness:.2, bevelSize:.25,
     bevelSegments:2, curveSegments:24}), finish);
  // A shallow stamped stiffening bead around the central web. It remains
  // below the seating face; holes and slot remain genuinely open geometry.
  const web = kind === 'camera'
    ? [[14,-22],[14,22],[-5,16],[-5,-16],[14,-22]]
    : [[19,-20],[19,20],[4,29],[-13,18],[-13,-18],[4,-29],[19,-20]];
  for (let i=1;i<web.length;i++) {
    const a=new THREE.Vector3(...web[i-1].map(v=>v*scale),.1);
    const b=new THREE.Vector3(...web[i].map(v=>v*scale),.1);
    const tube=new THREE.TubeGeometry(new THREE.LineCurve3(a,b),1,.55,8,false);
    addMesh(body, `stiffening_bead_${i}`,tube,finish);
  }
  fromMillimeters(body);
  const bounds = new THREE.Box3().setFromObject(body);
  const size = bounds.getSize(new THREE.Vector3()).toArray();
  const centre = bounds.getCenter(new THREE.Vector3()).toArray();
  return {name:`g1_${kind}_fixed_plate`,slug:`${kind}-fixed-plate`,body,
    frames:{sensor_mount:[0,0,(DIM.thickness+.2)/1000]},
    // Unknown mass/CoG/inertia are deliberately not invented.
    collisions:[{kind:'box',name:'reference_web',size,at:centre}]};
}
