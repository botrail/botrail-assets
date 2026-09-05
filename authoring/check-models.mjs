/** Read-only integration gate: run each model's tests and compare regenerated USD.
 * Does not replace the checked-in USD or require a second copy of baseline files.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

for (const slug of ["mid-360", "vacuum-gripper-ecbpi", "weld-gun-x16005"]) {
  const directory = new URL(`../${slug}/authoring/`, import.meta.url);
  // The installed package must be a copy, not a symlink resolving peers outside this model.
  for (const module of ["geometry.mjs", "fixed-usd.mjs", "cli.mjs"]) {
    const installed = new URL(`node_modules/@botrail/authoring/${module}`, directory);
    assert.equal(realpathSync(installed), fileURLToPath(installed), "npm ci requires install-links=true");
    assert.equal(readFileSync(installed, "utf8"), readFileSync(new URL(module, import.meta.url), "utf8"),
      `${slug}: stale installed ${module}; rerun npm ci after editing the shared library`);
  }
  const test = spawnSync(process.execPath, ["--test", "model.test.mjs"], { cwd: directory, stdio: "inherit" });
  if (test.error) throw test.error;
  assert.equal(test.status, 0, `${slug}: model tests failed`);
  const { exportModel } = await import(new URL("export.mjs", directory));
  const result = exportModel(), usda = typeof result === "string" ? result : result.usda;
  const committed = readFileSync(new URL(`../usd/${slug}.usda`, directory), "utf8");
  // Compare buffers so a failure reports only the digest, not megabytes of USD.
  const digest = text => createHash("sha256").update(text).digest("hex");
  assert.equal(digest(usda), digest(committed), `${slug}: regenerated USD changed; review before a new revision`);
  console.log(`${slug}: checked-in USD unchanged (${digest(usda)})`);
}
