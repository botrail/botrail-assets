import {meshFiles} from './compact-obj.mjs';
import {fileURLToPath} from 'node:url';
import {urdf,writeFiles} from '@botrail/authoring/reference-export.mjs';
import {definition} from './model.mjs';
const d=definition();
writeFiles(fileURLToPath(new URL('../',import.meta.url)),{...meshFiles(d.links),'urdf/mir1350.urdf':urdf(d)});
