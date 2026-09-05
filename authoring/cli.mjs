/** Node-only CLI helper; import geometry.mjs directly from browser viewers. */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function writeUsdIfMain(moduleUrl, relativeTarget, exporter) {
  if (!process.argv[1] || resolve(process.argv[1]) !== fileURLToPath(moduleUrl)) return;
  const target = resolve(process.argv[2] ?? fileURLToPath(new URL(relativeTarget, moduleUrl)));
  const result = exporter();
  mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, result);
  console.log(`${target}: ${Math.round(Buffer.byteLength(result) / 1024)} KiB`);
}
