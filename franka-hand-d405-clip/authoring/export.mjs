/** One USD layer: `/Clip/clip` is the mesh (metres, in the fr3_hand frame),
 * `/Clip/Looks` its material. `--check` compares the checked-in layer with
 * a fresh export instead of writing it.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { RobotBuilder } from "three-usd-robot";
import { serializeUsda } from "three-usd-robot/core";
import { buildClip } from "./clip.mjs";

const fail = message => { throw new Error(`lossy clip export: ${message}`); };

export function exportClip() {
  const mesh = buildClip();
  const builder = new RobotBuilder({ name: "Clip", onWarn: fail });
  builder.addLink({ name: "clip", visuals: [mesh] });
  builder.addFixedJoint({ name: "root_clip", child: "clip" });
  const file = builder.toUsda(), root = file.prims[0];
  root.metadata = {}; // a part, not an articulation
  const gprim = root.children.find(p => p.name === "clip").children.find(p => p.typeName === "Mesh");
  gprim.name = "clip";
  root.children = [gprim, root.children.find(p => p.name === "Looks")];
  // 0.1 micrometre: drop Float32 representation noise from the text.
  return serializeUsda(file).split("\n").map(line => line.startsWith("#") ? line
    : line.replace(/-?\d+\.\d+(?:e[-+]?\d+)?/g, value => Number(Number(value).toFixed(7)).toString())).join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const target = new URL("../usd/clip.usda", import.meta.url);
  const usda = exportClip();
  if (process.argv.includes("--check")) {
    const digest = text => createHash("sha256").update(text).digest("hex");
    if (digest(readFileSync(target, "utf8")) !== digest(usda)) throw new Error("clip.usda is stale; regenerate and review");
    console.log("franka-hand-d405-clip: the checked-in layer matches its authoring source");
  } else {
    mkdirSync(new URL("../usd/", import.meta.url), { recursive: true });
    writeFileSync(target, usda);
    console.log(`clip.usda: ${Math.round(Buffer.byteLength(usda) / 1024)} KiB`);
  }
}
