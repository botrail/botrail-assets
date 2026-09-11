import {fileURLToPath} from 'node:url';
import * as THREE from 'three';
import {meshFiles,writeFiles} from '@botrail/authoring/reference-export.mjs';
import {definition,dimensions} from './model.mjs';
const files={};
// Use block YAML: the supported xurdfpy loader does not read JSON-style root keys.
function yamlMap(object, indent=0) {
  return Object.entries(object).map(([key,value])=>`${' '.repeat(indent)}${key}:`+
    (typeof value==='object' ? '\n'+yamlMap(value,indent+2) : ` ${value}\n`)).join('');
}
for(const type of Object.keys(dimensions)) {
  const d=definition(type);
  for(const [name,text] of Object.entries(meshFiles(d.links))) files[name.replace('meshes/',`meshes/${type}/`)]=text;
  // UR-specific material export. Preserve PBR extensions for supporting readers,
  // with a per-finish Phong fallback for conventional OBJ/MTL loaders.
  for(const link of d.links.filter(l=>l.visual)) {
    const materials=new Map();
    link.visual.traverse(o=>{if(o.isMesh) materials.set(o.material.name,o.material);});
    const number=x=>Number(x.toPrecision(9));
    files[`meshes/${type}/${link.name}.mtl`]=[...materials.values()].map(m=>{
      const c=m.color.getRGB({},THREE.SRGBColorSpace),rgb=[c.r,c.g,c.b];
      const specular=rgb.map(v=>.04*(1-m.metalness)+v*m.metalness);
      const ns=Math.min(1000,Math.max(0,2/Math.pow(m.roughness,4)-2));
      return `newmtl ${m.name}\nKd ${rgb.map(number).join(' ')}\nKs ${specular.map(number).join(' ')}\nd 1\nNs ${number(ns)}\nPm ${m.metalness}\nPr ${m.roughness}\nillum 2\n`;
    }).join('\n');
  }
  const config={mesh_files:{}};
  for(const link of d.links.filter(l=>l.visual)) {
    const key=link.name==='base_link_inertia'?'base':link.name.replace('_link','');
    const mesh={package:'botrail_ur_series',path:`meshes/${type}/${link.name}.obj`};
    config.mesh_files[key]={visual:{mesh},collision:{mesh},mesh_offset:{x:0,y:0,z:0,roll:0,pitch:0,yaw:0}};
  }
  files[`config/${type}.yaml`]=yamlMap(config);
  files[`config/${type}-collisions.json`]=JSON.stringify(Object.fromEntries(d.links.filter(l=>l.visual).map(l=>[l.name,l.collisions])),null,2)+'\n';
}
writeFiles(fileURLToPath(new URL('../',import.meta.url)),files);
