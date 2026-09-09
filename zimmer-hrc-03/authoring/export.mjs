import {fileURLToPath} from 'node:url';
import {meshFiles,urdf,writeFiles} from '../../authoring/reference-export.mjs';
import {definition, variants} from './model.mjs';
const files={};
for(const sku of variants) {
 const d=definition(sku);
 for(const [name,text] of Object.entries(meshFiles(d.links)))files[name.replace('meshes/',`meshes/${sku}/`)]=text;
 files[`urdf/zimmer-hrc-03-${sku}.urdf`]=urdf(d).replaceAll('../meshes/',`../meshes/${sku}/`);
}
writeFiles(fileURLToPath(new URL('..',import.meta.url)),files);
