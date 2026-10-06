import {fileURLToPath} from 'node:url';
import {meshFiles,urdf,writeFiles} from '../../authoring/reference-export.mjs';
import {definition} from './model.mjs';
const d=definition();
writeFiles(fileURLToPath(new URL('..',import.meta.url)),{...meshFiles(d.links),'urdf/sus-zfm-f401.urdf':urdf(d)});
