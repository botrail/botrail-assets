/** OnRobot Type A 50 mm reach extender 109301; coupling internals omitted. */
import {group, cylinder, collisionCylinder, fixed} from '../../authoring/tool-shapes.mjs';
export function definition() {
  const visual = group();
  cylinder(visual, 'extender', .0061, .050, [0, 0, .025]);
  return {name: 'onrobot_bit_extender_109301',
    links: [{name: 'mount', visual, collisions: [collisionCylinder(.0061, .050, [0, 0, .025])]}, {name: 'flange'}],
    joints: [fixed('flange_fixed', 'mount', 'flange', [0, 0, .050])]};
}
