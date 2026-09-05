import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { wireGrid, binaryStl, visualUsd } from '../../authoring/equipment-meshes.mjs';

export const WIDTHS = [250, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500];
export const HEIGHTS = [1300, 1900, 2200, 2400];
// SOURCE: official mesh-panel datasheet, 30 x 20 frame, vertical Ø3 / horizontal Ø2.5.
// 50 x 30 aperture interpreted as horizontal x vertical, as in the product view.
// Square wire sections, edge termination and welded intersections are simplified.
export function grid(width, height) {
  if (!WIDTHS.includes(width) || !HEIGHTS.includes(height)) throw new RangeError('unsupported panel size');
  return wireGrid({width: (width - 60) / 1000, height: (height - 60) / 1000,
    apertureX: 0.050, apertureZ: 0.030, verticalDiameter: 0.003, horizontalDiameter: 0.0025});
}

export function outputs() {
  return HEIGHTS.flatMap(h => WIDTHS.map(w => [`grid-${w}-${h}.stl`, binaryStl(grid(w, h))]));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const directory = new URL('../meshes/', import.meta.url);
  if (process.argv.includes('--check')) {
    for (const [name, data] of outputs()) {
      if (!data.equals(readFileSync(new URL(name, directory)))) throw new Error(`stale ${name}`);
    }
    console.log('X-Guard: 52 mesh variants match their authoring source');
  } else if (process.argv[2] === '--usd') {
    writeFileSync(process.argv[3], visualUsd('x_guard_classic_grid', grid(1000, 2200)));
  } else {
    mkdirSync(directory, {recursive: true});
    for (const [name, data] of outputs()) writeFileSync(new URL(name, directory), data);
  }
}
