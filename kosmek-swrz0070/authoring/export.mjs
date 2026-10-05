import {fileURLToPath} from 'node:url';
import {meshFiles,urdf,writeFiles} from '../../authoring/reference-export.mjs';
import {mf4,tf4} from './model.mjs';
const files={};
for(const [sub,def] of [['mf4',mf4()],['tf4',tf4()]]){
  for(const [k,v] of Object.entries(meshFiles(def.links))) files[k.replace('meshes/',`meshes/${sub}/`)]=v.replace(/\.\.\/meshes\//g,`../meshes/${sub}/`);
  files[`urdf/kosmek-swrz0070-${sub}.urdf`]=urdf(def).replace(/\.\.\/meshes\//g,`../meshes/${sub}/`);
}
writeFiles(fileURLToPath(new URL('..',import.meta.url)),files);
