import { mkdirSync, writeFileSync } from "node:fs";
import { exportFixedModel } from "@botrail/authoring/fixed-usd.mjs";
import { definition } from "./model.mjs";
import { parseUsda, serializeUsda } from "three-usd-robot/core";

const out = new URL("../usd/", import.meta.url);
mkdirSync(out, {recursive: true});
for (const variant of ["curve90", "straight1000", "shuttle"]) {
  const usd = exportFixedModel(definition(variant));
  writeFileSync(new URL(`horizon10-${variant}.usda`, out), usd);
  // The static companion is for Scene.load_usd; the catalog model retains its
  // rigid bodies and analytic collisions for Robot.from_package/mount.
  const stage = parseUsda(usd);
  function visualOnly(prim) {
    if (prim.metadata.apiSchemas) prim.metadata.apiSchemas = prim.metadata.apiSchemas.filter(s => !s.startsWith("Physics"));
    prim.children = prim.children.filter(p => !p.typeName.startsWith("Physics") && !p.name.startsWith("collision_"));
    for (const child of prim.children) visualOnly(child);
  }
  stage.prims.forEach(visualOnly);
  writeFileSync(new URL(`horizon10-${variant}-visual.usda`, out), serializeUsda(stage));
}
