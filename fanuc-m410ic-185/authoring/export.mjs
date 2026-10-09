import {fileURLToPath} from 'node:url';
import {urdf,writeFiles} from '@botrail/authoring/reference-export.mjs';
import {meshFiles} from './compact-obj.mjs';
import {definition} from './model.mjs';
const d=definition();
writeFiles(fileURLToPath(new URL('../',import.meta.url)),{...meshFiles(d.links),'urdf/fanuc-m410ic-185.urdf':urdf(d)});
