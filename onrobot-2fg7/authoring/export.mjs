import {fileURLToPath} from 'node:url';
import {meshFiles,urdf,writeFiles} from '../../authoring/reference-export.mjs';
import {definition} from './model.mjs';
const d=definition();
writeFiles(fileURLToPath(new URL('..',import.meta.url)),{...meshFiles(d.links),'urdf/onrobot-2fg7.urdf':urdf(d)});
