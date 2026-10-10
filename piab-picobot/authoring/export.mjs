import {fileURLToPath} from 'node:url';
import {urdf,writeFiles} from '../../authoring/reference-export.mjs';
import {meshFiles} from './compact-obj.mjs';
import {definition} from './model.mjs';
const d=definition();
const materials={};for(const l of d.links)l.visual?.traverse(o=>{if(o.isMesh)materials[o.material.name]={metalness:o.material.metalness,roughness:o.material.roughness};});
writeFiles(fileURLToPath(new URL('..',import.meta.url)),{...meshFiles(d.links),'docs/materials.json':JSON.stringify(materials,null,2)+'\n','urdf/piab-picobot.urdf':urdf(d)});
