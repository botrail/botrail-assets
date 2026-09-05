/** Fixed rigid model only. All frames, collisions and inertial values are SI.
 * Articulated mechanisms keep their product-specific RobotBuilder definition.
 */
import * as THREE from "three";
import { RobotBuilder } from "three-usd-robot";
import { parseUsda, serializeUsda } from "three-usd-robot/core";

function name(value) {
  if (typeof value !== "string" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new TypeError(`Not a USD-safe name: ${value}`);
}
function vector(value, label, positive = false) {
  if (!Array.isArray(value) || value.length !== 3 || !value.every(v => Number.isFinite(v) && (!positive || v > 0))) {
    throw new TypeError(`Invalid ${label}: expected three ${positive ? "positive " : ""}finite numbers`);
  }
}
function validate(d) {
  name(d.name);
  const used = new Set(["mount", "body"]);
  for (const [frame, at] of Object.entries(d.frames)) {
    name(frame); vector(at, `frame ${frame}`);
    if (used.has(frame)) throw new Error(`Duplicate link ${frame}`);
    used.add(frame);
  }
  const collisionNames = new Set();
  for (const c of d.collisions) {
    name(c.name); vector(c.at, `collision ${c.name}`);
    if (collisionNames.has(c.name)) throw new Error(`Duplicate collision ${c.name}`);
    collisionNames.add(c.name);
    if (c.kind === "box") vector(c.size, "box size", true);
    else if (c.kind === "cylinder") {
      if (![c.radius, c.length].every(v => Number.isFinite(v) && v > 0)) throw new RangeError("Cylinder radius/length must be positive and finite");
    } else throw new TypeError(`Unsupported collision kind: ${c.kind}`);
    if (c.axis !== undefined && !["X", "Y", "Z"].includes(c.axis)) throw new TypeError(`Unsupported axis: ${c.axis}`);
    if (c.kind === "box" && c.axis !== undefined) throw new TypeError("Box axis is not supported");
  }
}

export function exportFixedModel(d) {
  validate(d);
  const builder = new RobotBuilder({ name: d.name });
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
    // Native Z + a transform preserves analytic cylinders in the builder's URDF path.
    const orient = c.axis === "X" ? "(0.7071067811865476, 0, 0.7071067811865476, 0)"
      : c.axis === "Y" ? "(0.7071067811865476, -0.7071067811865476, 0, 0)" : "(1, 0, 0, 0)";
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
