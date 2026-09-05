import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { RobotBuilder } from "three-usd-robot";
import { parseUsda, serializeUsda } from "three-usd-robot/core";
import { definition } from "./model.mjs";

export function exportModel() {
  const d = definition(), builder = new RobotBuilder({ name: d.name });
  builder.addLink({ name: "mount" });
  builder.addLink({ name: "body", visuals: [d.body], inertial: d.inertial });
  builder.addFixedJoint({ name: "root_joint", child: "mount" });
  builder.addFixedJoint({ name: "body_joint", parent: "mount", child: "body" });
  for (const [name, at] of Object.entries(d.frames)) {
    builder.addLink({ name, frame: new THREE.Matrix4().makeTranslation(...at) });
    builder.addFixedJoint({ name: `body_to_${name}`, parent: "body", child: name });
  }
  const layer = builder.toUsda();
  const body = layer.prims.find(p => p.name === d.name).children.find(p => p.name === "body");
  for (const c of d.collisions) {
    const attrs = c.kind === "box" ? `double size = 1\n double3 xformOp:scale = (${c.size.join(", ")})`
      : `double radius = ${c.radius}\n double height = ${c.length}\n uniform token axis = "Z"`;
    // Keep the primitive's native Z axis and rotate the transform. This preserves
    // analytic URDF cylinders in importers that tessellate non-Z USD cylinders.
    const orient = c.axis === "X" ? "(0.7071067811865476, 0, 0.7071067811865476, 0)" : "(1, 0, 0, 0)";
    body.children.push(parseUsda(`#usda 1.0
def ${c.kind === "box" ? "Cube" : "Cylinder"} "collision_${c.name}" (
  prepend apiSchemas = ["PhysicsCollisionAPI"]
) {
  ${attrs}
  bool physics:collisionEnabled = true
  uniform token purpose = "guide"
  double3 xformOp:translate = (${c.at.join(", ")})
  quatf xformOp:orient = ${orient}
  uniform token[] xformOpOrder = ["xformOp:translate", "xformOp:orient"${c.kind === "box" ? ', "xformOp:scale"' : ""}]
}`).prims[0]);
  }
  return serializeUsda(layer);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = resolve(process.argv[2] ?? fileURLToPath(new URL(`../usd/${definition().slug}.usda`, import.meta.url)));
  mkdirSync(dirname(target), { recursive: true });
  const result = exportModel(); writeFileSync(target, result);
  console.log(`${target}: ${Math.round(Buffer.byteLength(result) / 1024)} KiB`);
}
