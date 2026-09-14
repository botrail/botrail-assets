/** One USD layer per shape: `/Shapes/<name>` is the mesh, `/Shapes/Looks`
 * its materials. A separate file per shape keeps a botrail project that uses
 * one carton from bundling every shape.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { RobotBuilder } from "three-usd-robot";
import { serializeUsda } from "three-usd-robot/core";
import { SHAPES, buildShape, mergeShape } from "./shapes.mjs";

const fail = message => { throw new Error(`lossy shape export: ${message}`); };

function layer(name) {
  const group = buildShape(name);
  // The builder collects every finish the pieces use into `Looks`; the
  // flattened mesh then carries them as face subsets.
  const looks = new RobotBuilder({ name: "Shapes", onWarn: fail });
  looks.addLink({ name, visuals: [group] });
  looks.addFixedJoint({ name: `root_${name}`, child: name });
  const flat = new RobotBuilder({ name: "Shapes", onWarn: fail });
  const merged = mergeShape(group);
  // The builder writes one material per mesh; the subsets below carry the rest.
  const single = new THREE.Mesh(merged.geometry, merged.material[0]);
  single.name = name;
  flat.addLink({ name, visuals: [single] });
  flat.addFixedJoint({ name: `root_${name}`, child: name });
  const file = looks.toUsda(), root = file.prims[0];
  root.metadata = {}; // a form, not an articulation
  const mesh = flat.toUsda().prims[0].children.find(p => p.name === name).children.find(p => p.typeName === "Mesh");
  mesh.name = name;
  mesh.children = merged.geometry.groups.map((range, i) => ({
    specifier: "def", typeName: "GeomSubset", name: `surface_${i}`, metadata: {}, children: [],
    properties: [
      { kind: "attribute", typeName: "token", name: "elementType", value: "face", variability: "uniform", metadata: {} },
      { kind: "attribute", typeName: "token", name: "familyName", value: "materialBind", variability: "uniform", metadata: {} },
      { kind: "attribute", typeName: "int", isArray: true, name: "indices", metadata: {},
        value: Array.from({ length: range.count / 3 }, (_, j) => range.start / 3 + j) },
      { kind: "relationship", name: "material:binding", listOp: "explicit", metadata: {},
        targets: [`/Shapes/Looks/${group.children[i].material.name}`] },
    ],
  }));
  root.children = [mesh, root.children.find(p => p.name === "Looks")];
  // 0.1 micrometre at unit scale: drop Float32 representation noise from the text.
  return serializeUsda(file).split("\n").map(line => line.startsWith("#") ? line
    : line.replace(/-?\d+\.\d+(?:e[-+]?\d+)?/g, value => Number(Number(value).toFixed(7)).toString())).join("\n");
}

/** `{ name: usda }` for every shape, in a fixed order. */
export function exportShapes() {
  return Object.fromEntries(SHAPES.map(name => [name, layer(name)]));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const directory = new URL("../usd/", import.meta.url);
  const digest = text => createHash("sha256").update(text).digest("hex");
  const shapes = exportShapes();
  if (process.argv.includes("--check")) {
    for (const [name, usda] of Object.entries(shapes)) {
      const committed = readFileSync(new URL(`${name}.usda`, directory), "utf8");
      if (digest(committed) !== digest(usda)) throw new Error(`${name}.usda is stale; regenerate and review before a new revision`);
    }
    console.log(`workshop-shapes: ${SHAPES.length} checked-in layers match their authoring source`);
  } else {
    mkdirSync(directory, { recursive: true });
    for (const [name, usda] of Object.entries(shapes)) {
      writeFileSync(new URL(`${name}.usda`, directory), usda);
      console.log(`${name}.usda: ${Math.round(Buffer.byteLength(usda) / 1024)} KiB`);
    }
  }
}
