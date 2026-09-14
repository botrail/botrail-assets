import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {exportFixedModel} from '@botrail/authoring/fixed-usd.mjs';
import {definition} from './model.mjs';
for (const kind of ['camera','radar']) {
  const path=fileURLToPath(new URL(`../usd/${kind}-fixed-plate.usda`,import.meta.url));
  const usd=exportFixedModel(definition(kind));
  if(process.argv.includes('--check')) {
    if(readFileSync(path,'utf8')!==usd) throw new Error(`Regenerate ${path}`);
  } else writeFileSync(path,usd);
  console.log(path);
}
