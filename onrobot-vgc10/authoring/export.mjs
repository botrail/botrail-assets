import {fileURLToPath} from 'node:url';
import {meshFiles,urdf,writeFiles} from '../../authoring/reference-export.mjs';
import {definition} from './model.mjs';
const files={};
const d=definition(); Object.assign(files,meshFiles(d.links),{'urdf/onrobot-vgc10.urdf':urdf(d)});
writeFiles(fileURLToPath(new URL('..',import.meta.url)),files);
