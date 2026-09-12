/** Side-supported OnRobot 103961. Public datasheet v1.7; see asset card.
 * Joint zero is an authored process reference, not the device's home.
 */
import {group, silver, dark, blue, box, cylinder, collisionBox, collisionCylinder, fixed, THREE, addMesh} from '../../authoring/tool-shapes.mjs';

// X nose = 308.5 - 155.4 mm. Z offset is an approximate layout datum;
// the public datasheet does not dimension the mating-plane-to-axis offset.
export const NOSE_X = .1531;
export const AXIS_Z = .080;
export const PROCESS_RECESS = .017;

function housing(visual, name, length, x, radius, material) {
  const shape = new THREE.Shape();
  shape.absarc(-.007, 0, radius, Math.PI / 2, Math.PI * 1.5, false);
  shape.absarc(.007, 0, radius, -Math.PI / 2, Math.PI / 2, false);
  shape.closePath();
  const mesh = addMesh(visual, name, new THREE.ExtrudeGeometry(shape, {depth: length, bevelEnabled: false, curveSegments: 32}), material);
  mesh.rotation.y = Math.PI / 2; mesh.position.set(x - length / 2, 0, .064);
}

export function definition(extension = 0) {
  if (![0, .050].includes(extension)) throw new Error('Only standard and genuine 109301 Type A 50 mm configurations');
  const body = group(), nose = group(), bit = group();
  cylinder(body, 'side_coupling', .032, .024, [0, 0, .012]);
  cylinder(body, 'backing_pad', .032, .024, [0, 0, .028]);
  housing(body, 'aluminium_shell', .220, -.0311, .043, silver);
  for (const x of [-.1484, .0862]) housing(body, 'end_cap_' + x, .014, x, .041, dark);
  for (const y of [-.042, .042]) {
    box(body, 'seam_' + y, [.216, .002, .002], [-.0311, y, AXIS_Z + .032]);
    box(body, 'label_' + y, [.05, .002, .028], [-.050, y, AXIS_Z - .004], blue);
  }
  // Axis-aligned cylinders in the tool's native X direction.
  const axis = [0, Math.PI / 2, 0], noseCollisions = [];
  function ring(name, radius, length, x) {
    const part = group(); cylinder(part, name, radius, length, [0, 0, 0]);
    part.rotation.y = Math.PI / 2; part.position.set(x, 0, AXIS_Z); nose.add(part);
    noseCollisions.push({...collisionCylinder(radius, length, [x, 0, AXIS_Z]), rpy: axis});
  }
  ring('nose_barrel', .0245, .033, .1097);
  for (let i = 0; i < 8; i++) {
    const length = (NOSE_X - .1262) / 8;
    ring('nose_taper_' + i, .0245 - (.0245 - .00675) * (i + .5) / 8, length, .1262 + length * (i + .5));
  }
  cylinder(bit, 'hex_bit_envelope', .003, .010, [0, 0, -.005], dark);
  const bitCollisions = [collisionCylinder(.003, .010, [0, 0, -.005])];
  if (extension) {
    cylinder(bit, 'type_a_extender_109301', .0061, extension, [0, 0, -.010 - extension / 2]);
    bitCollisions.push(collisionCylinder(.0061, extension, [0, 0, -.010 - extension / 2]));
  }
  return {
    name: 'onrobot_screwdriver_103961' + (extension ? '_a50' : ''),
    links: [{name: 'mount'}, {name: 'body', visual: body, collisions: [
      collisionCylinder(.032, .024, [0, 0, .012]),
      collisionBox([.220, .086, .100], [-.0311, 0, .064]),
      ...[-.1484, .0862].map(x => collisionBox([.014, .082, .096], [x, 0, .064])),
    ]}, {name: 'nose', visual: nose, collisions: noseCollisions}, {name: 'bit', visual: bit, collisions: bitCollisions}, {name: 'tip'}],
    joints: [fixed('body_fixed', 'mount', 'body'), fixed('nose_fixed', 'body', 'nose'),
      {name: 'shank', type: 'prismatic', parent: 'nose', child: 'bit', xyz: [NOSE_X - PROCESS_RECESS + extension, 0, AXIS_Z], rpy: axis, axis: [0, 0, 1], limit: {lower: 0, upper: .055, effort: 50, velocity: .2}},
      fixed('tip_fixed', 'bit', 'tip', [0, 0, 0], [Math.PI, 0, 0])],
  };
}
