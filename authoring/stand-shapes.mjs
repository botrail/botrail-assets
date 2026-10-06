/** Construction helpers for SI-unit, independently authored robot stands and carts:
 * slotted aluminium extrusions, swivel casters, knob adjusters and tube handles.
 * Visual only. Every size is passed in by the product model — nothing here is a
 * product dimension, and no mounting hole is generated.
 */
import {THREE, addMesh, namedMaterial, silver, dark, rubber} from './tool-shapes.mjs';
import {cylinderBetween} from './geometry.mjs';

export const slotLine = namedMaterial('profile_slot', '#7d858c', .5, .5);
export const zinc = namedMaterial('zinc_plated_steel', '#aeb4b8', .7, .4);

/** Plain box: a frame of dozens of members stays light without rounded edges. */
export const bx = (g, name, size, at, mat = silver) => addMesh(g, name, new THREE.BoxGeometry(...size), mat, at);

/** Slotted extrusion along `axis` ('x' | 'y' | 'z'). `section` gives its two cross
 * dimensions in the order of the remaining axes (x before y before z); `slots` is how
 * many T-slot lines run across each of them. The lines stand 0.3 mm proud of the
 * face so they survive the export as geometry rather than as a texture. */
export function profile(g, name, axis, length, section, at, {slots, groove = .008, mat = silver} = {}) {
  const k = 'xyz'.indexOf(axis);
  if (k < 0) throw new RangeError(`axis must be x, y or z, not ${axis}`);
  const [i, j] = [0, 1, 2].filter(n => n !== k);
  const size = [0, 0, 0]; size[k] = length; size[i] = section[0]; size[j] = section[1];
  bx(g, name, size, at, mat);
  const counts = slots ?? section.map(side => Math.max(1, Math.round(side / .03)));
  let n = 0;
  for (const [u, v, count] of [[i, j, counts[0]], [j, i, counts[1]]]) {
    for (const sign of [-1, 1]) for (let m = 0; m < count; m++) {
      const s = [0, 0, 0], p = [...at];
      s[k] = length * .98; s[u] = groove; s[v] = .0006;
      p[u] += (m - (count - 1) / 2) * size[u] / count; p[v] += sign * size[v] / 2;
      bx(g, `${name}_slot_${n++}`, s, p, slotLine);
    }
  }
  return size;
}

/** Swivel caster under the mounting face `top` = [x, y, z]; the wheel of `radius`
 * stands on z = 0 and rolls along `roll` ('x' | 'y'). */
export function caster(g, name, top, radius, {roll = 'y', width = .026} = {}) {
  const [x, y, z] = top, plate = .006, yoke = 2 * radius + .006;
  if (z < yoke + plate) throw new RangeError(`${name}: a ${radius} m wheel does not fit under z = ${z}`);
  const along = roll === 'y' ? 1 : 0, across = 1 - along;
  bx(g, `${name}_plate`, [.07, .07, plate], [x, y, z - plate / 2], zinc);
  cylinderBetween(g, `${name}_stem`, [x, y, yoke], [x, y, z - plate], .012, zinc, {radial: 16});
  const bridge = [0, 0, .004]; bridge[across] = width + .014; bridge[along] = 1.4 * radius;
  bx(g, `${name}_yoke`, bridge, [x, y, yoke - .002], zinc);
  for (const s of [-1, 1]) {
    const cheek = [0, 0, radius + .004], at = [x, y, yoke - .004 - (radius + .004) / 2];
    cheek[across] = .004; cheek[along] = 1.2 * radius; at[across] += s * (width / 2 + .005);
    bx(g, `${name}_cheek_${s < 0 ? 'a' : 'b'}`, cheek, at, zinc);
  }
  const a = [x, y, radius], b = [x, y, radius];
  a[across] -= width / 2; b[across] += width / 2;
  cylinderBetween(g, `${name}_wheel`, a, b, radius, rubber, {radial: 32});
}

/** Knob adjuster at [x, y]: foot pad on the floor, threaded rod up to `top`, and a
 * six-lobed star knob of radius `knob` above it. */
export function knobAdjuster(g, name, [x, y], top, {pad = .025, padHeight = .012, rod = .006, knob = .03, knobHeight = .03} = {}) {
  cylinderBetween(g, `${name}_pad`, [x, y, 0], [x, y, padHeight], pad, rubber, {radial: 24});
  cylinderBetween(g, `${name}_rod`, [x, y, padHeight], [x, y, top], rod, zinc, {radial: 12});
  cylinderBetween(g, `${name}_knob`, [x, y, top], [x, y, top + knobHeight], knob * .7, dark, {radial: 24});
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, lx = x + Math.cos(a) * knob * .68, ly = y + Math.sin(a) * knob * .68;
    cylinderBetween(g, `${name}_knob_lobe_${i}`, [lx, ly, top + .003], [lx, ly, top + knobHeight - .003], knob * .32, dark, {radial: 12});
  }
}

/** Plain adjuster (no knob): pad on the floor and a rod up to `top`. */
export function padAdjuster(g, name, [x, y], top, {pad = .0375, padHeight = .023, rod = .008} = {}) {
  cylinderBetween(g, `${name}_pad`, [x, y, 0], [x, y, padHeight], pad, rubber, {radial: 32});
  cylinderBetween(g, `${name}_rod`, [x, y, padHeight], [x, y, top], rod, zinc, {radial: 12});
}

/** U handle: stubs from `a` and `b` out along the unit vector `out` by `reach`,
 * joined by a grip. */
export function uHandle(g, name, a, b, out, reach, radius = .008, mat = dark) {
  const tip = p => p.map((v, n) => v + out[n] * reach);
  cylinderBetween(g, `${name}_stub_a`, a, tip(a), radius, mat, {radial: 16});
  cylinderBetween(g, `${name}_stub_b`, b, tip(b), radius, mat, {radial: 16});
  const along = tip(b).map((v, n) => v - tip(a)[n]), length = Math.hypot(...along);
  const pad = along.map(v => v / length * radius);   // run the grip through both elbows
  cylinderBetween(g, `${name}_grip`, tip(a).map((v, n) => v - pad[n]), tip(b).map((v, n) => v + pad[n]), radius, mat, {radial: 16});
}
