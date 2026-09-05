import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { liftingEye, binaryStl, visualUsd } from '../../authoring/equipment-meshes.mjs';

// SOURCE: FZ body H1600 / total H1652, etc. DERIVED: protrusion 52 mm.
// INFERRED: ring/stem section, 40 mm outer diameter and 20 mm bore.
export function eye() {
  return liftingEye({outerRadius: 0.020, innerRadius: 0.010, thickness: 0.010, totalHeight: 0.052});
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const directory = new URL('../meshes/', import.meta.url), target = new URL('lifting-eye.stl', directory);
  if (process.argv.includes('--check')) {
    if (!binaryStl(eye()).equals(readFileSync(target))) throw new Error('stale lifting-eye.stl');
    console.log('FZ: lifting eye matches its authoring source');
  } else if (process.argv[2] === '--usd') {
    writeFileSync(process.argv[3], visualUsd('nito_fz_lifting_eye', eye()));
  } else {
    mkdirSync(directory, {recursive: true}); writeFileSync(target, binaryStl(eye()));
  }
}
