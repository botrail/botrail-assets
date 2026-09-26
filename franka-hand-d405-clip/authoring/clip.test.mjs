import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { parseUsda } from "three-usd-robot/core";
import { clipGeometry, CLEAR, D405, SEAT, seat } from "./clip.mjs";
import { exportClip } from "./export.mjs";

const hand = JSON.parse(readFileSync(new URL("./hand-envelope.json", import.meta.url)));
const vertices = (() => {
  const p = clipGeometry().getAttribute("position");
  return Array.from({ length: p.count }, (_, i) => [p.getX(i), p.getY(i), p.getZ(i)]);
})();
// Rounding of the fillets and of the measurement grid: what CLEAR may lose.
const SLACK = 0.15;

test("the layer is one mesh and its material, and the export is deterministic", () => {
  const first = exportClip(), second = exportClip();
  assert.equal(first, second);
  const root = parseUsda(first).prims[0];
  assert.equal(root.name, "Clip");
  assert.deepEqual(root.children.map(p => `${p.name}:${p.typeName}`), ["clip:Mesh", "Looks:Scope"]);
  assert.ok(!first.includes("PhysicsArticulationRootAPI"), "a part, not an articulation");
  assert.ok(first.includes("metersPerUnit = 1") && first.includes('upAxis = "Z"'));
});

test("the clip keeps clear of every surface of the hand it fits", () => {
  const face = hand.face_x_max.z_x;
  // The two grid rows either side of z. Above z = 8 the ring is what the
  // hand is (checked by radius, per y); the face envelope is y-blind.
  const faceAt = z => Math.max(...face.filter(([fz]) => Math.abs(fz - z) <= 0.5 && fz >= 8).map(([, x]) => x));
  // The underside, interpolated between the measured millimetres.
  const bottomAt = x => {
    const row = hand.bottom.x_z;
    for (let i = 0; i + 1 < row.length; i++) {
      const [x0, z0] = row[i], [x1, z1] = row[i + 1];
      if (x >= x0 && x <= x1) return z0 + (z1 - z0) * (x - x0) / (x1 - x0);
    }
    return -Infinity;
  };
  let checked = 0;
  for (const [x, y, z] of vertices) {
    assert.ok(z >= hand.flange_z + 2, `(${x}, ${y}, ${z}) reaches the wrist's flange`);
    assert.ok(x >= hand.fingers_x_max + 2.5, `(${x}, ${y}, ${z}) is in the fingers' way`);
    if (z >= hand.ring.z[0] && z <= hand.ring.z[1] + CLEAR - SLACK) {
      assert.ok(Math.hypot(x, y) >= hand.ring.radius + CLEAR - SLACK, `(${x}, ${y}, ${z}) cuts into the ring`);
    }
    if (Math.abs(y) <= 24.5 && z >= 8 && z <= 65.5 && Number.isFinite(faceAt(z))) {
      assert.ok(x >= faceAt(z) + CLEAR - SLACK, `(${x}, ${y}, ${z}) cuts into the face (${faceAt(z)})`);
      checked++;
    }
    if (x >= 12 && x <= 18.5 && z > 58.5) {
      assert.ok(z >= bottomAt(x) + CLEAR - SLACK || x >= faceAt(Math.min(z, 65.5)) + CLEAR - SLACK,
        `(${x}, ${y}, ${z}) cuts into the bottom edge`);
    }
  }
  assert.ok(checked > 1000, "the face was actually checked");
});

test("the camera sits on the seat and nothing of the clip is inside it", () => {
  assert.deepEqual(seat(0, 0), [SEAT.x, SEAT.z]);
  const t = SEAT.tilt * Math.PI / 180;
  const look = [-Math.sin(t), 0, Math.cos(t)], side = [0, -1, 0], up = [Math.cos(t), 0, Math.sin(t)];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const seatSpan = [];
  for (const [x, y, z] of vertices) {
    const v = [x - SEAT.x, y - SEAT.y, z - SEAT.z];
    const a = dot(v, look), b = dot(v, side), c = dot(v, up);
    const inside = a > D405.a[0] + 0.1 && a < D405.a[1] - 0.1 && b > D405.b[0] + 0.1 && b < D405.b[1] - 0.1
      && c > D405.c[0] + 0.1 && c < D405.c[1] - 0.1;
    assert.ok(!inside, `(${x}, ${y}, ${z}) is inside the camera`);
    // The seat's top face lies 0.2 mm under the camera's bottom face.
    if (Math.abs(c + 0.2) < 1e-3) seatSpan.push(a);
  }
  assert.ok(Math.min(...seatSpan) <= D405.a[0] && Math.max(...seatSpan) >= D405.a[1] - 0.01,
    "the seat runs under the whole of the camera's bottom face");
});
