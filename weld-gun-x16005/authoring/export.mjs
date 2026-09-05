/** Visuals/materials/kinematics through RobotBuilder; analytic collision prims in the USD AST. */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { parseUsda, serializeUsda } from "three-usd-robot/core";
import { createRobot, collisions, DIM } from "./model.mjs";

export function exportModel() {
  const { builder, inertial } = createRobot();
  const layer = builder.toUsda();
  const root = layer.prims.find((p) => p.name === "weld_gun_x16005");
  const addSpeed = (prim) => {
    if (prim.name === "electrode_joint") {
      const speed = parseUsda(`#usda 1.0\ndef Scope "limits" {\n custom float physxJoint:maxJointVelocity = ${DIM.qSpeed * 180 / Math.PI}\n}`).prims[0];
      prim.properties.push(...speed.properties);
    }
    prim.children.forEach(addSpeed);
  };
  addSpeed(root);
  for (const collision of collisions()) {
    let center, size = [1, 1, 1], quaternion = new THREE.Quaternion(), attrs;
    if (collision.kind === "box") {
      center = new THREE.Vector3(...collision.center);
      size = collision.size;
      attrs = "double size = 1";
    } else {
      const a = new THREE.Vector3(...collision.a), b = new THREE.Vector3(...collision.b);
      center = a.clone().add(b).multiplyScalar(0.5);
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), b.clone().sub(a).normalize());
      attrs = `double radius = ${collision.radius}\n double height = ${a.distanceTo(b)}\n uniform token axis = "Z"`;
    }
    if (collision.link === "electrode_arm") center.sub(new THREE.Vector3(...DIM.pivot));
    const safe = collision.name.replace(/[^A-Za-z0-9_]/g, "_");
    const text = `#usda 1.0
def ${collision.kind === "box" ? "Cube" : "Cylinder"} "collision_${safe}" (
    prepend apiSchemas = ["PhysicsCollisionAPI"]
) {
    ${attrs}
    bool physics:collisionEnabled = true
    uniform token purpose = "guide"
    double3 xformOp:translate = (${center.toArray().join(", ")})
    quatf xformOp:orient = (${quaternion.w}, ${quaternion.x}, ${quaternion.y}, ${quaternion.z})
    double3 xformOp:scale = (${size.join(", ")})
    uniform token[] xformOpOrder = ["xformOp:translate", "xformOp:orient", "xformOp:scale"]
}`;
    const link = root.children.find((p) => p.name === collision.link);
    if (!link) throw new Error(`Missing link ${collision.link}`);
    link.children.push(parseUsda(text).prims[0]);
  }
  return { usda: serializeUsda(layer), inertial };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = resolve(process.argv[2] ?? fileURLToPath(new URL("../usd/weld-gun-x16005.usda", import.meta.url)));
  const { usda, inertial } = exportModel();
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, usda);
  console.log(`${target}: ${(Buffer.byteLength(usda) / 1024).toFixed(0)} KiB`);
  console.log(JSON.stringify({ approximateInertial: inertial, collisionPrimitives: collisions().length }, null, 2));
}
