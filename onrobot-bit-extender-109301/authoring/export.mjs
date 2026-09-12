import {fileURLToPath} from 'node:url';
import {meshFiles, urdf, writeFiles} from '../../authoring/reference-export.mjs';
import {definition} from './model.mjs';
const base = fileURLToPath(new URL('..', import.meta.url));
const d = definition();
writeFiles(base, {...meshFiles(d.links), 'urdf/onrobot-bit-extender-109301.urdf': urdf(d)});
