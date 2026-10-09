import {fileURLToPath} from 'node:url';
import {urdf,writeFiles} from '../../authoring/reference-export.mjs';
import {meshFiles} from './compact-obj.mjs';
import {definition} from './model.mjs';
const d=definition();
writeFiles(fileURLToPath(new URL('..',import.meta.url)),{...meshFiles(d.links),'urdf/daihen-wb-p352l.urdf':urdf(d)});
