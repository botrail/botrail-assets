import {fileURLToPath} from 'node:url';
import {urdf,writeFiles} from '../../authoring/reference-export.mjs';
import {definition,materialProperties} from './model.mjs';
import {meshFiles} from './compact-obj.mjs';
const d=definition();
writeFiles(fileURLToPath(new URL('..',import.meta.url)),{...meshFiles(d.links),'docs/materials.json':JSON.stringify(materialProperties,null,2)+'\n','urdf/robotiq-ax-series-base.urdf':urdf(d)});
