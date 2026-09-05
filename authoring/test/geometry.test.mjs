import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { namedMaterial, addMesh, roundedBox, cylinderZ, cylinderBetween,
  roundedRectangle, ellipseHole, ringGeometry, tubeGeometry, fromMillimeters } from "../geometry.mjs";

const material = () => namedMaterial("test_finish", 0x737a80, 0.8, 0.26);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);

test("PBR factory preserves authored values and rejects invalid roughness/metalness", () => {
  const m = material(); assert.equal(m.name, "test_finish");
  assert.equal(m.color.getHex(), 0x737a80); assert.equal(m.metalness, 0.8); assert.equal(m.roughness, 0.26);
  assert.throws(() => namedMaterial("bad", 0, NaN, 0.5), /metalness/);
  assert.throws(() => namedMaterial("bad", 0, 0, 1.1), /roughness/);
});

test("rounded box has requested bounds and the mm boundary is applied exactly once", () => {
  const g = new THREE.Group();
  const mesh = addMesh(g, "body", roundedBox([65, 65, 2], 0.6), material(), [0, 0, 6], "frame");
  assert.equal(mesh.userData.massGroup, "frame"); fromMillimeters(g);
  const b = new THREE.Box3().setFromObject(g);
  close(b.min.x, -0.0325); close(b.max.x, 0.0325); close(b.min.z, 0.005); close(b.max.z, 0.007);
  assert.throws(() => fromMillimeters(g), /unscaled/);
  assert.throws(() => roundedBox([1, 1, 1], 2), /radius/);
  assert.throws(() => addMesh(g, "bad", new THREE.BoxGeometry(), undefined), /material/);
});

test("native Z cylinders and endpoint cylinders preserve axes and endpoint extents", () => {
  const geo = cylinderZ(2, 8); geo.computeBoundingBox();
  close(geo.boundingBox.min.z, -4); close(geo.boundingBox.max.z, 4);
  const g = new THREE.Group();
  cylinderBetween(g, "pin", [1, 0, 0], [5, 0, 0], 0.5, material(), { radial: 32 });
  const bounds = new THREE.Box3().setFromObject(g);
  close(bounds.min.x, 1); close(bounds.max.x, 5);
  assert.throws(() => cylinderBetween(g, "bad", [0, 0, 0], [0, 0, 0], 1, material()), /distance/);
  assert.throws(() => cylinderZ(-1, 2), /radius/);
  assert.throws(() => cylinderZ(1, 2, { radial: 2 }), /radial/);
});

test("extruded plate and ring openings are actual holes in their visual surfaces", () => {
  const shape = roundedRectangle(20, 20, 2); ellipseHole(shape, 0, 0, 2, 3);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: false });
  for (const geo of [geometry, ringGeometry(10, 2, 3)]) {
    const mesh = new THREE.Mesh(geo, material()); mesh.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(new THREE.Vector3(0, 0, 4), new THREE.Vector3(0, 0, -1));
    assert.equal(ray.intersectObject(mesh).length, 0);
    ray.ray.origin.x = 5; assert.ok(ray.intersectObject(mesh).length > 0);
  }
  assert.throws(() => ringGeometry(2, 3, 1), /inner/);
  assert.throws(() => ellipseHole(shape, 0, 0, 0), /rx/);
});

test("visual tube has finite vertices/normals and does not create collision metadata", () => {
  const g = new THREE.Group();
  const mesh = addMesh(g, "hose", tubeGeometry([[0, 0, 0], [1, 0, 0], [2, 1, 0]], 0.1), material());
  assert.ok([...mesh.geometry.attributes.position.array].every(Number.isFinite));
  assert.ok([...mesh.geometry.attributes.normal.array].every(Number.isFinite));
  assert.deepEqual(mesh.userData, {}); assert.equal(g.children.length, 1);
  assert.throws(() => tubeGeometry([[0, 0, 0]], 1), /two points/);
});
