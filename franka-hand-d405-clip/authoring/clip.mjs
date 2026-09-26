/** A clip-on bracket that holds an Intel RealSense D405 on the Franka Hand
 * (FR3 generation), lens down past the fingers. Independently authored —
 * a printed part, no product and no SKU.
 *
 * It fits the hand the way a printed clip would: a collar hugs the round
 * coupling ring under the flange and a ledge hooks under it, a plate lies
 * on the broad +x face (waisted over the recessed band), and a lip hooks
 * under the bottom edge beside the finger slot. At the foot an open seat —
 * a plate on two side gussets and a centre rib — holds the camera by its
 * 1/4-20 bottom screw, leaning 30° toward the hand's axis so the fingertips
 * sit near the middle of the picture, with a stop behind it.
 *
 * Authored in millimetres in the fr3_hand link frame — +z from the flange
 * toward the fingers, +x the face the camera is on — and exported in metres
 * in that same frame: botrail binds the layer to a resident attached to the
 * hand, with the inverse of that resident's offset. The surfaces it fits
 * are measured (hand-envelope.json) and it keeps CLEAR from all of them.
 */
import * as THREE from "three";
import { mergeGeometries, mergeVertices, toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import { namedMaterial } from "@botrail/authoring/geometry.mjs";

// Linear RGB; an authored finish, not a measured one.
export const PA12 = namedMaterial("pa12", new THREE.Color(0.105, 0.11, 0.115), 0, 0.78);

export const CLEAR = 0.6;   // gap kept to every hand surface (mm)
export const WALL = 4;      // collar and plate thickness
export const HALF = 24;     // half-width across the face (y)
export const BEVEL = 0.8;   // every edge is rounded this much
const INSET = 0.3;          // what rides on the plate stands this far inside its sides

// The hand, measured (hand-envelope.json).
const RING_R = 31.5, RING_BOTTOM = 7.5, FLANGE = 0.0, FACE = 18.3, BOTTOM = 65.8, FINGERS = 10.5;

/** Where the D405 sits: its bottom-screw point in the hand frame and how
 * far its optical axis leans toward the hand's axis. The camera's mount
 * frame there is x = optical axis, y = across, z = up out of its bottom. */
export const SEAT = Object.freeze({ x: 33.8, y: 0.0, z: 38.0, tilt: 30 });
/** The D405's body in its mount frame (from realsense2_description):
 * along the optical axis, across, and up from the bottom face. */
export const D405 = Object.freeze({ a: [-8.15, 14.85], b: [-21, 21], c: [0, 42] });

const inner = FACE + CLEAR;          // the plate's hand side
const outer = inner + WALL;          // its outside
const collarIn = RING_R + CLEAR, collarOut = collarIn + WALL;
const ledgeTop = RING_BOTTOM + CLEAR, ledgeBottom = ledgeTop + 3;
const collarTop = FLANGE + 2.2;      // clear of the wrist's flange face
const lipTop = BOTTOM + CLEAR, lipBottom = lipTop + 3;
const lipTip = FINGERS + 3;          // stays off the fingers

const tilt = SEAT.tilt * Math.PI / 180, s = Math.sin(tilt), c = Math.cos(tilt);
/** (x, z) of a point of the seat's side plane: `a` along the optical axis,
 * `up` out of the camera's bottom face. */
export const seat = (a, up) => [SEAT.x - a * s + up * c, SEAT.z + a * c + up * s];

/** A closed outline through `points` with each corner rounded by its radius
 * (a quadratic fillet; 0 keeps the corner). */
function outline(points, radii) {
  const shape = new THREE.Shape(), n = points.length;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n], p1 = points[i], p2 = points[(i + 1) % n];
    const r = Array.isArray(radii) ? radii[i] : radii;
    const toward = (q) => {
      const dx = q[0] - p1[0], dy = q[1] - p1[1], l = Math.hypot(dx, dy);
      return [dx / l, dy / l, l];
    };
    const [ax, ay, la] = toward(p0), [bx, by, lb] = toward(p2);
    const d = Math.min(r, la / 2, lb / 2);
    const start = d > 0 ? [p1[0] + ax * d, p1[1] + ay * d] : p1;
    if (i === 0) shape.moveTo(...start); else shape.lineTo(...start);
    if (d > 0) shape.quadraticCurveTo(p1[0], p1[1], p1[0] + bx * d, p1[1] + by * d);
  }
  shape.closePath();
  return shape;
}

/** Points along a circular or elliptical arc (degrees, both ends included). */
function arc(cx, cy, rx, ry, from, to, steps = 24) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = (from + (to - from) * i / steps) * Math.PI / 180;
    return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];
  });
}

function extrude(shape, depth, bevel) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: depth - 2 * bevel, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel,
    bevelOffset: -bevel, bevelSegments: 2, curveSegments: 8,
  });
  g.translate(0, 0, bevel);
  return g;
}
/** An (x, z) outline swept across y0..y1. */
function acrossY(shape, y0, y1, bevel = BEVEL) {
  return extrude(shape, y1 - y0, bevel).applyMatrix4(new THREE.Matrix4().set(
    1, 0, 0, 0, 0, 0, -1, y1, 0, 1, 0, 0, 0, 0, 0, 1));
}
/** An (x, y) outline stacked from z0 to z1. */
function alongZ(shape, z0, z1, bevel = BEVEL) {
  return extrude(shape, z1 - z0, bevel).translate(0, 0, z0);
}
/** A (y, z) outline stood out from x0 to x1. */
function alongX(shape, x0, x1, bevel = BEVEL) {
  return extrude(shape, x1 - x0, bevel).applyMatrix4(new THREE.Matrix4().set(
    0, 0, 1, x0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
}

const builders = {
  /** Hugs the coupling ring's side, from just under the flange to its foot. */
  collar() {
    const span = Math.asin(HALF / collarOut) * 180 / Math.PI;
    const out = arc(0, 0, collarOut, collarOut, -span, span, 32);
    const back = arc(0, 0, collarIn, collarIn, span, -span, 32);
    const radii = [...out.map((_, i) => (i === 0 || i === out.length - 1 ? 1.2 : 0)),
      ...back.map((_, i) => (i === 0 || i === back.length - 1 ? 1.2 : 0))];
    return alongZ(outline([...out, ...back], radii), collarTop, ledgeTop + 0.5);
  },
  /** Hooks under the ring: from the face out to the collar's outside. */
  ledge() {
    const x = Math.sqrt(collarOut ** 2 - HALF ** 2);
    const edge = arc(0, 0, collarOut, collarOut, -Math.asin(HALF / collarOut) * 180 / Math.PI,
      Math.asin(HALF / collarOut) * 180 / Math.PI, 32);
    const points = [[inner, -HALF], [x, -HALF], ...edge.slice(1, -1), [x, HALF], [inner, HALF]];
    const radii = points.map((_, i) => (i === 0 || i === points.length - 1 ? 3 : i === 1 || i === points.length - 2 ? 2 : 0));
    return alongZ(outline(points, radii), ledgeTop, ledgeBottom);
  },
  /** Lies on the broad face, a window over the hand's recessed band. */
  plate() {
    const top = ledgeTop + 0.5, foot = 64;
    const shape = outline([[-HALF, top], [HALF, top], [HALF, foot], [-HALF, foot]], [0, 0, 0, 0]);
    const window = outline([[-9, 14.5], [-9, 22.5], [9, 22.5], [9, 14.5]], 4);
    shape.holes.push(window);
    return alongX(shape, inner, outer);
  },
  /** Follows the bottom edge's round and hooks under it beside the slot. */
  lip() {
    const round = arc(lipTip, 59.3, inner - lipTip, lipTop - 59.3, 0, 90, 16);
    const heel = arc(outer - 5, lipBottom - 5, 5, 5, 90, 0, 12);
    const points = [[inner, 57], ...round, [lipTip, lipBottom], ...heel, [outer, 57]];
    const radii = points.map((p) => (Math.abs(p[0] - lipTip) < 1e-6 ? 1.2 : 0));
    return acrossY(outline(points, radii), -HALF + INSET, HALF - INSET);
  },
  /** The plate the camera's bottom face rests on (0.2 mm off it). */
  seat() {
    return acrossY(outline([seat(-10.75, -3.5), seat(D405.a[1] + 1, -3.5), seat(D405.a[1] + 1, -0.2),
      seat(-10.75, -0.2)], [1, 1.5, 1, 1]), -HALF + INSET, HALF - INSET);
  },
  /** Behind the camera's back face, up its lower third. */
  backstop() {
    const a0 = -10.75, a1 = D405.a[0] - 0.4;
    return acrossY(outline([seat(a0, -3.5), seat(a1, -3.5), seat(a1, 13), seat(a0, 13)], [0, 0, 1, 1.5]), -HALF + INSET, HALF - INSET);
  },
  /** Either side: from the face plate out under the seat and up the
   * camera's sides, a web that carries it. */
  gussets() {
    const shape = outline([[outer - 0.5, 21], seat(-10.75, 13), seat(6, 13), seat(12, 4), seat(D405.a[1] + 1, -3.5),
      [outer - 0.5, seat(D405.a[1] + 1, -3.5)[1] + 1.5]], [3, 1.5, 3, 3, 1, 2]);
    const side = D405.b[1] + 0.4;
    return [acrossY(shape, side, HALF), acrossY(shape, -HALF, -side)];
  },
  /** Down the middle, under the seat. */
  rib() {
    return acrossY(outline([[outer - 0.5, 24], seat(-10.75, -3), seat(D405.a[1] + 1, -3),
      [outer - 0.5, seat(D405.a[1] + 1, -3.5)[1] + 1.5]], [2, 1, 1, 1]), -1.6, 1.6, 0.6);
  },
};

export const PIECES = Object.freeze(Object.keys(builders));

/** The clip as one geometry in millimetres (hand frame). */
export function clipGeometry() {
  const parts = PIECES.flatMap((name) => [builders[name]()].flat());
  const merged = mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)), false);
  // Smooth across the curves, sharp where the faces break.
  return toCreasedNormals(merged, Math.PI / 6);
}

/** The clip as a mesh in metres (hand frame), its finish bound: no
 * texture coordinates (nothing is textured), normals to 1e-4, and every
 * corner that shares a position and a normal shared — a compact layer,
 * since a scene that uses it may carry it once per copy of the cell. */
export function buildClip() {
  const geometry = clipGeometry().scale(0.001, 0.001, 0.001);
  geometry.deleteAttribute("uv");
  const normal = geometry.getAttribute("normal");
  for (let i = 0; i < normal.array.length; i++) normal.array[i] = Math.round(normal.array[i] * 1e4) / 1e4;
  const shared = mergeVertices(geometry, 1e-7);
  const mesh = new THREE.Mesh(shared, PA12);
  mesh.name = "clip";
  return mesh;
}
