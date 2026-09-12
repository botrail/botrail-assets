import {fileURLToPath} from 'node:url';
import {meshFiles, urdf, writeFiles} from '../../authoring/reference-export.mjs';
import {definition} from './model.mjs';
const base = fileURLToPath(new URL('..', import.meta.url));
const d = definition();
writeFiles(base, {...meshFiles(d.links), 'urdf/onrobot-screwdriver-103961.urdf': urdf(d)});
const extended = definition(.050);
writeFiles(base + '/a50', {...meshFiles(extended.links), 'urdf/onrobot-screwdriver-103961-a50.urdf': urdf(extended)});
