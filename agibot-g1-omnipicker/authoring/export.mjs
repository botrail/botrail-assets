import {fileURLToPath} from 'node:url';
import {urdf,writeFiles} from '../../authoring/reference-export.mjs';
import {meshFiles} from './compact-obj.mjs';
import {definition,materialProperties,poses} from './model.mjs';
const d=definition();writeFiles(fileURLToPath(new URL('..',import.meta.url)),{...meshFiles(d.links),'urdf/agibot-g1-omnipicker.urdf':urdf(d),'docs/materials.json':JSON.stringify(materialProperties,null,2)+'\n','docs/poses.json':JSON.stringify(poses,null,2)+'\n'});
