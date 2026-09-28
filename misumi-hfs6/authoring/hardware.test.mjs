import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { CAPS, BRACKET, buildCap, buildBracket } from "./hardware.mjs";
import { mergeProfile } from "./profile.mjs";

const ready = group => {
  const mesh = mergeProfile(group);
  mesh.material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }); mesh.updateMatrixWorld(true);
  return (origin, direction) => new THREE.Raycaster(new THREE.Vector3(...origin), new THREE.Vector3(...direction)).intersectObject(mesh).length;
};
const near = (v, e, what) => assert.ok(Math.abs(v - e) < 1e-6, `${what}: ${v} vs ${e}`);

test("a cap is its section's plate, centred on the origin, the outer face at +z and the pegs going -z", () => {
  assert.deepEqual(Object.keys(CAPS), ["cap_3030", "cap_3060", "cap_6060"]);
  for (const [name, cap] of Object.entries(CAPS)) {
    const b = new THREE.Box3().setFromObject(buildCap(name));
    near(b.min.x, -cap.w / 2, `${name} -x`); near(b.max.x, cap.w / 2, `${name} +x`);
    near(b.min.y, -cap.d / 2, `${name} -y`); near(b.max.y, cap.d / 2, `${name} +y`);
    near(b.max.z, cap.thickness / 2, `${name} outer face`);
    near(b.min.z, -cap.thickness / 2 - cap.peg.h, `${name} peg tips`);
    const hits = ready(buildCap(name));
    for (const [x, y] of cap.pegs) assert.ok(hits([x, y, -1], [0, 0, 1]) > 0, `${name}: a peg at ${x},${y}`);
    assert.equal(hits([-1, 0, -cap.thickness / 2 - cap.peg.h / 2], [1, 0, 0]) > 0, cap.pegs.some(([, y]) => Math.abs(y) < 1e-9),
      `${name}: below the plate a ray across the middle meets a peg only where one stands on the centreline`);
    assert.ok(hits([0, 0, -1], [0, 0, 1]) > 0, `${name}: the plate covers the middle`);
  }
  assert.equal(CAPS.cap_3030.pegs.length, 4);
  assert.equal(CAPS.cap_3060.pegs.length, 2);
  assert.equal(CAPS.cap_6060.pegs.length, 4);
});

test("the bracket's fold corner is the origin, its flanges run +x and +y with a hole each, its ribs at the sides", () => {
  const b = new THREE.Box3().setFromObject(buildBracket());
  near(b.min.x, 0, "-x"); near(b.max.x, BRACKET.leg, "+x");
  near(b.min.y, 0, "-y"); near(b.max.y, BRACKET.leg, "+y");
  near(b.min.z, -BRACKET.width / 2, "-z"); near(b.max.z, BRACKET.width / 2, "+z");
  const hits = ready(buildBracket());
  assert.equal(hits([BRACKET.holeAt, -1, 0], [0, 1, 0]), 0, "the φ6.3 hole through flange A, 20 from the corner");
  assert.ok(hits([BRACKET.holeAt, -1, 0.007], [0, 1, 0]) > 0, "flange A beside its hole");
  assert.equal(hits([-1, BRACKET.holeAt, 0], [1, 0, 0]), 0, "the hole through flange B");
  assert.ok(hits([-1, BRACKET.holeAt, 0.007], [1, 0, 0]) > 0, "flange B beside its hole");
  assert.equal(hits([0.025, 0.025, -1], [0, 0, 1]), 0, "open opposite the fold");
  assert.ok(hits([0.010, 0.010, -1], [0, 0, 1]) > 0, "a rib spans the corner");
  assert.equal(hits([0.010, 0.010, -0.005], [0, 0, 1]), 2, "...at the sides only: from the middle a ray up meets just the far rib (its two faces)");
});
