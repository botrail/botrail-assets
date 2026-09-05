/** Visual-only construction helpers. Lengths stay in the caller's declared unit.
 * Product dimensions, finish choices and collision proxies belong to the model.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

function positive(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be positive and finite`);
}
function point(value, name) {
  if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) {
    throw new TypeError(`${name} must contain three finite coordinates`);
  }
}
function segments(value, minimum, name) {
  if (!Number.isInteger(value) || value < minimum) throw new RangeError(`${name} must be an integer >= ${minimum}`);
}

export function namedMaterial(name, color, metalness, roughness) {
  for (const [key, value] of Object.entries({ metalness, roughness })) {
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new RangeError(`${key} must be in [0, 1]`);
  }
  return Object.assign(new THREE.MeshStandardMaterial({ color, metalness, roughness }), { name });
}

export function addMesh(group, name, geometry, material, at = [0, 0, 0], massGroup) {
  point(at, "at");
  if (!material || (Array.isArray(material) ? !material.every(m => m?.isMaterial) : !material.isMaterial)) {
    throw new TypeError(`Missing material for ${name}`);
  }
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name; mesh.position.set(...at);
  if (massGroup !== undefined) mesh.userData.massGroup = massGroup;
  group.add(mesh); return mesh;
}

export function roundedBox(size, radius, detail = 3) {
  point(size, "size"); size.forEach(v => positive(v, "size"));
  positive(radius, "radius"); segments(detail, 1, "detail");
  if (radius > Math.min(...size) / 2) throw new RangeError("radius exceeds half the smallest side");
  return new RoundedBoxGeometry(...size, detail, radius);
}

/** Native +Z cylinder; rotations are left to the model's mesh transform. */
export function cylinderZ(radius, height, { radial = 64, open = false } = {}) {
  positive(radius, "radius"); positive(height, "height"); segments(radial, 3, "radial");
  const geometry = new THREE.CylinderGeometry(radius, radius, height, radial, 1, open);
  geometry.rotateX(Math.PI / 2); return geometry;
}

/** Cylinder between endpoints. No collision is created, even for a cable/pipe. */
export function cylinderBetween(group, name, a, b, radius, material, { radial = 32, massGroup } = {}) {
  point(a, "a"); point(b, "b"); positive(radius, "radius"); segments(radial, 3, "radial");
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const direction = end.clone().sub(start); positive(direction.length(), "endpoint distance");
  const mesh = addMesh(group, name,
    new THREE.CylinderGeometry(radius, radius, direction.length(), radial), material,
    start.clone().add(end).multiplyScalar(0.5).toArray(), massGroup);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

export function roundedRectangle(width, depth, radius) {
  positive(width, "width"); positive(depth, "depth"); positive(radius, "radius");
  if (radius > Math.min(width, depth) / 2) throw new RangeError("radius exceeds half the smallest side");
  const x = -width / 2, y = -depth / 2, s = new THREE.Shape();
  s.moveTo(x + radius, y); s.lineTo(x + width - radius, y);
  s.quadraticCurveTo(x + width, y, x + width, y + radius);
  s.lineTo(x + width, y + depth - radius);
  s.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth);
  s.lineTo(x + radius, y + depth); s.quadraticCurveTo(x, y + depth, x, y + depth - radius);
  s.lineTo(x, y + radius); s.quadraticCurveTo(x, y, x + radius, y);
  return s;
}

/** A real clockwise hole in a Shape, not a dark surface/decal. */
export function ellipseHole(shape, x, y, rx, ry = rx) {
  if (![x, y].every(Number.isFinite)) throw new TypeError("hole center must be finite");
  positive(rx, "rx"); positive(ry, "ry");
  const hole = new THREE.Path(); hole.absellipse(x, y, rx, ry, 0, 2 * Math.PI, true);
  shape.holes.push(hole); return shape;
}

export function ringGeometry(outer, inner, depth, holes = []) {
  positive(outer, "outer"); positive(depth, "depth");
  if (!Number.isFinite(inner) || inner < 0 || inner >= outer) throw new RangeError("inner must be in [0, outer)");
  const shape = new THREE.Shape(); shape.absarc(0, 0, outer, 0, 2 * Math.PI, false);
  if (inner) ellipseHole(shape, 0, 0, inner);
  for (const [x, y, r] of holes) ellipseHole(shape, x, y, r);
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 32 });
}

export function tubeGeometry(points, radius, { tubular = 40, radial = 12 } = {}) {
  if (!Array.isArray(points) || points.length < 2) throw new TypeError("tube requires at least two points");
  points.forEach(p => point(p, "tube point")); positive(radius, "radius");
  segments(tubular, 1, "tubular"); segments(radial, 3, "radial");
  const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, "centripetal");
  return new THREE.TubeGeometry(path, tubular, radius, radial, false);
}

/** Apply the mm -> m boundary once, at the visual group's root. */
export function fromMillimeters(group) {
  if (!group.scale.equals(new THREE.Vector3(1, 1, 1))) throw new Error("Expected unscaled millimetre group");
  group.scale.setScalar(0.001); group.updateMatrixWorld(true); return group;
}
