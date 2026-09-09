import {fileURLToPath} from 'node:url';
import {meshFiles,writeFiles} from '@botrail/authoring/reference-export.mjs';
import {definition,dimensions} from './model.mjs';
const files={};
for(const type of Object.keys(dimensions)) {
  const d=definition(type);
  for(const [name,text] of Object.entries(meshFiles(d.links))) files[name.replace('meshes/',`meshes/${type}/`)]=text;
  const config={mesh_files:{}};
  for(const link of d.links.filter(l=>l.visual)) {
    const key=link.name==='base_link_inertia'?'base':link.name.replace('_link','');
    const mesh={package:'botrail_ur_series',path:`meshes/${type}/${link.name}.obj`};
    config.mesh_files[key]={visual:{mesh},collision:{mesh},mesh_offset:{x:0,y:0,z:0,roll:0,pitch:0,yaw:0}};
  }
  // JSON is also valid YAML, avoiding another authoring dependency.
  files[`config/${type}.yaml`]=JSON.stringify(config,null,2)+'\n';
  files[`config/${type}-collisions.json`]=JSON.stringify(Object.fromEntries(d.links.filter(l=>l.visual).map(l=>[l.name,l.collisions])),null,2)+'\n';
}
writeFiles(fileURLToPath(new URL('../',import.meta.url)),files);
