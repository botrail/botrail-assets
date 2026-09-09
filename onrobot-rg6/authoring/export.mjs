import {fileURLToPath} from 'node:url';
import {meshFiles,urdf,writeFiles} from '@botrail/authoring/reference-export.mjs';
import {definition} from './model.mjs';
const d=definition();
writeFiles(fileURLToPath(new URL('../',import.meta.url)),{...meshFiles(d.links),'urdf/onrobot-rg6.urdf':urdf(d)});
