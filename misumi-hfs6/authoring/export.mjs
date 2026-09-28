/** The pack's layers, one per article family: `usd/hfs6-3030.usda`
 * (`/HFS6/profile_3030`), `usd/hfs6-3060.usda`, `usd/hfs6-6060.usda`,
 * `usd/hfc6-caps.usda` (`/HFS6/cap_3030`, `cap_3060`, `cap_6060`) and
 * `usd/hblfs6.usda` (`/HFS6/bracket`) — each prim one mesh with its
 * material subsets, and `/HFS6/Looks`. A layer per family keeps a project
 * that uses one profile from bundling the others. */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { RobotBuilder } from "three-usd-robot";
import { serializeUsda } from "three-usd-robot/core";
import { buildProfileFor, mergeProfile } from "./profile.mjs";
import { buildCap, buildBracket } from "./hardware.mjs";

const fail = message => { throw new Error(`lossy export: ${message}`); };

/** Which prims each layer carries, in order. */
export const LAYERS = Object.freeze({
  "hfs6-3030": ["profile_3030"],
  "hfs6-3060": ["profile_3060"],
  "hfs6-6060": ["profile_6060"],
  "hfc6-caps": ["cap_3030", "cap_3060", "cap_6060"],
  "hblfs6": ["bracket"],
});

function build(name) {
  if (name.startsWith("profile_")) return buildProfileFor(name);
  if (name.startsWith("cap_")) return buildCap(name);
  if (name === "bracket") return buildBracket();
  throw new RangeError(`unknown part ${name}`);
}

export function exportLayer(layer) {
  const parts = (LAYERS[layer] || fail(`unknown layer ${layer}`)).map(build);
  const looks = new RobotBuilder({ name: "HFS6", onWarn: fail });
  const flat = new RobotBuilder({ name: "HFS6", onWarn: fail });
  for (const builder of [looks, flat]) {
    builder.addLink({ name: "root" }); builder.addFixedJoint({ name: "world", child: "root" });
  }
  const merged = new Map();
  for (const group of parts) {
    looks.addLink({ name: group.name, visuals: [group] });
    looks.addFixedJoint({ name: `root_${group.name}`, parent: "root", child: group.name });
    const mesh = mergeProfile(group);
    const single = new THREE.Mesh(mesh.geometry, mesh.material[0]); single.name = group.name;
    flat.addLink({ name: group.name, visuals: [single] });
    flat.addFixedJoint({ name: `root_${group.name}`, parent: "root", child: group.name });
    merged.set(group.name, { mesh, group });
  }
  const file = looks.toUsda(), root = file.prims[0];
  root.metadata = {}; // a picture, not an articulation
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
          targets: [`/HFS6/Looks/${group.children[i].material.name}`] },
      ],
    }));
    return prim;
  });
  root.children = [...meshes, root.children.find(p => p.name === "Looks")];
  // 0.1 micrometre: drop Float32 representation noise from the text.
  return serializeUsda(file).split("\n").map(line => line.startsWith("#") ? line
    : line.replace(/-?\d+\.\d+(?:e[-+]?\d+)?/g, value => Number(Number(value).toFixed(7)).toString())).join("\n");
}

/** `{ layer: usda }` for every layer, in a fixed order. */
export function exportLayers() {
  return Object.fromEntries(Object.keys(LAYERS).map(layer => [layer, exportLayer(layer)]));
}

/** The first layer, under the name the 3030-only revision exported. */
export function exportModel() {
  return exportLayer("hfs6-3030");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const directory = new URL("../usd/", import.meta.url);
  const digest = text => createHash("sha256").update(text).digest("hex");
  const layers = exportLayers();
  if (process.argv.includes("--check")) {
    for (const [layer, usda] of Object.entries(layers)) {
      const committed = readFileSync(new URL(`${layer}.usda`, directory), "utf8");
      if (digest(committed) !== digest(usda)) throw new Error(`${layer}.usda is stale; regenerate and review before a new revision`);
    }
    console.log(`misumi-hfs6: ${Object.keys(layers).length} checked-in layers match their authoring source`);
  } else {
    mkdirSync(directory, { recursive: true });
    for (const [layer, usda] of Object.entries(layers)) {
      writeFileSync(new URL(`${layer}.usda`, directory), usda);
      console.log(`${layer}.usda: ${Math.round(Buffer.byteLength(usda) / 1024)} KiB`);
    }
  }
}
