/** `usd/gh-160.usda`: `/GH160/housing` and `/GH160/cover`, each one mesh with
 * its material subsets, and `/GH160/Looks`. */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { RobotBuilder } from "three-usd-robot";
import { serializeUsda } from "three-usd-robot/core";
import { buildHousing, buildCover, mergePart } from "./model.mjs";

const fail = message => { throw new Error(`lossy export: ${message}`); };

export function exportModel() {
  const parts = [buildHousing(), buildCover()];
  const looks = new RobotBuilder({ name: "GH160", onWarn: fail });
  const flat = new RobotBuilder({ name: "GH160", onWarn: fail });
  for (const builder of (looks, flat, [looks, flat])) {
    builder.addLink({ name: "root" }); builder.addFixedJoint({ name: "world", child: "root" });
  }
  const merged = new Map();
  for (const group of parts) {
    looks.addLink({ name: group.name, visuals: [group] });
    looks.addFixedJoint({ name: `root_${group.name}`, parent: "root", child: group.name });
    const mesh = mergePart(group);
    const single = new THREE.Mesh(mesh.geometry, mesh.material[0]); single.name = group.name;
    flat.addLink({ name: group.name, visuals: [single] });
    flat.addFixedJoint({ name: `root_${group.name}`, parent: "root", child: group.name });
    merged.set(group.name, { mesh, group });
  }
  const file = looks.toUsda(), root = file.prims[0];
  root.metadata = {};
  const flatRoot = flat.toUsda().prims[0];
  const meshes = parts.map(group => {
    const prim = flatRoot.children.find(p => p.name === group.name).children.find(p => p.typeName === "Mesh");
    prim.name = group.name;
    const { mesh } = merged.get(group.name);
    prim.children = mesh.geometry.groups.map((range, i) => ({
      specifier: "def", typeName: "GeomSubset", name: `surface_${i}`, metadata: {}, children: [],
      properties: [
        { kind: "attribute", typeName: "token", name: "elementType", value: "face", variability: "uniform", metadata: {} },
        { kind: "attribute", typeName: "token", name: "familyName", value: "materialBind", variability: "uniform", metadata: {} },
        { kind: "attribute", typeName: "int", isArray: true, name: "indices", metadata: {},
          value: Array.from({ length: range.count / 3 }, (_, j) => range.start / 3 + j) },
        { kind: "relationship", name: "material:binding", listOp: "explicit", metadata: {},
          targets: [`/GH160/Looks/${group.children[i].material.name}`] },
      ],
    }));
    return prim;
  });
  root.children = [...meshes, root.children.find(p => p.name === "Looks")];
  return serializeUsda(file).split("\n").map(line => line.startsWith("#") ? line
    : line.replace(/-?\d+\.\d+(?:e[-+]?\d+)?/g, value => Number(Number(value).toFixed(7)).toString())).join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const target = new URL("../usd/gh-160.usda", import.meta.url);
  const usda = exportModel();
  const digest = text => createHash("sha256").update(text).digest("hex");
  if (process.argv.includes("--check")) {
    if (digest(readFileSync(target, "utf8")) !== digest(usda)) throw new Error("gh-160.usda is stale; regenerate and review before a new revision");
    console.log("gear-cover-set: the checked-in layer matches its authoring source");
  } else {
    mkdirSync(new URL("../usd/", import.meta.url), { recursive: true });
    writeFileSync(target, usda);
    console.log(`gh-160.usda: ${Math.round(Buffer.byteLength(usda) / 1024)} KiB`);
  }
}
