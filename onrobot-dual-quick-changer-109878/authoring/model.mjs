/** OnRobot 109878: public Quick Changers v2.0 drawing, page 8. SI units. */
import {group, silver, dark, box, cylinder, collisionBox, collisionCylinder, fixed} from '../../authoring/tool-shapes.mjs';

export const FACE_X = (.127 - .071 * Math.cos(Math.PI / 3)) / 2;
export const FACE_Z = .0935 - .071 / 2 * Math.sin(Math.PI / 3);

export function definition() {
  const visual = group();
  cylinder(visual, 'robot_flange', .0355, .018, [0, 0, .009]);
  box(visual, 'bridge', [.052, .052, .038], [0, 0, .034]);
  const collisions = [collisionCylinder(.0355, .018, [0, 0, .009]), collisionBox([.052, .052, .038], [0, 0, .034])];
  const links = [{name: 'mount', visual, collisions}], joints = [];
  for (const [name, sign] of [['flange_a', 1], ['flange_b', -1]]) {
    const angle = sign * Math.PI / 3;
    const at = [sign * FACE_X, 0, FACE_Z];
    const back = [at[0] - .010 * Math.sin(angle), 0, at[2] - .010 * Math.cos(angle)];
    const face = group();
    cylinder(face, name + '_disc', .0355, .020, [0, 0, 0], silver);
    face.rotation.y = angle; face.position.set(...back); visual.add(face);
    box(visual, name + '_latch', [.023, .012, .008], [at[0], -.030, at[2]], dark);
    collisions.push({...collisionCylinder(.0355, .020, back), rpy: [0, angle, 0]});
    links.push({name}); joints.push(fixed(name + '_joint', 'mount', name, at, [0, angle, 0]));
  }
  return {name: 'onrobot_dual_quick_changer_109878', links, joints};
}
