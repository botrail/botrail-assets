import {fileURLToPath} from 'node:url';
import {meshFiles,urdf,writeFiles} from '@botrail/authoring/reference-export.mjs';
import {definition} from './model.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
// The TX Hi-Lo mast is the reference; the DX Tele mast of the same sheet
// lives beside it in dx/ with its own meshes.
const tx=definition('tx');
writeFiles(root,{...meshFiles(tx.links),'urdf/toyota-sae160.urdf':urdf(tx)});
const dx=definition('dx');
writeFiles(root+'dx/',{...meshFiles(dx.links),'urdf/toyota-sae160-dx.urdf':urdf(dx)});
