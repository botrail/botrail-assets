/** Node-only deterministic OBJ/MTL + URDF export. No vendor meshes or textures. */
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';

const vec = x => x.map(v => Number(v.toPrecision(12))).join(' ');
const escape = x => String(x).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const attrs = a => Object.entries(a).map(([k, v]) => `${k}="${escape(Array.isArray(v) ? vec(v) : v)}"`).join(' ');
const element = (tag, a = {}, body) => body === undefined ? `<${tag} ${attrs(a)}/>` : `<${tag} ${attrs(a)}>${body}</${tag}>`;
const frame = shape => element('origin', {xyz: shape.xyz ?? [0,0,0], rpy: shape.rpy ?? [0,0,0]});

export function meshFiles(links) {
  const files = {};
  for (const link of links) {
    if (!link.visual) continue;
    // OBJExporter reads matrixWorld without updating it. Exporting a freshly
    // authored group otherwise loses each component's translation/rotation.
    link.visual.updateMatrixWorld(true);
    const materials = new Map();
    link.visual.traverse(object => {
      if (!object.isMesh) return;
      if (Array.isArray(object.material)) throw new Error('Author each material as a separate mesh');
      materials.set(object.material.name, object.material);
    });
    files[`meshes/${link.name}.obj`] = `mtllib ${link.name}.mtl\n` + new OBJExporter().parse(link.visual);
    files[`meshes/${link.name}.mtl`] = [...materials.values()].map(m => {
      const color = m.color.getRGB({}, THREE.SRGBColorSpace);
      return `newmtl ${m.name}\nKd ${vec([color.r,color.g,color.b])}\nd 1\nNs 40\n`;
    }).join('\n');
  }
  return files;
}

export function urdf(definition) {
  const links = definition.links.map(link => {
    let body = link.visual ? element('visual', {}, element('geometry', {}, element('mesh', {filename: `../meshes/${link.name}.obj`}))) : '';
    for (const c of link.collisions ?? []) {
      const dimensions = c.kind === 'box' ? {size:c.size} : c.kind === 'cylinder' ? {radius:c.radius,length:c.length} : {radius:c.radius};
      body += element('collision', {}, frame(c) + element('geometry', {}, element(c.kind, dimensions)));
    }
    // Only supplied mass properties are emitted. Unknown is not a fabricated tensor.
    if (link.inertial) {
      const i = link.inertial;
      body += element('inertial', {}, frame(i) + element('mass', {value:i.mass}) + element('inertia', i.inertia));
    }
    return element('link', {name:link.name}, body);
  });
  const joints = definition.joints.map(j => {
    let body = element('parent',{link:j.parent}) + element('child',{link:j.child}) + frame(j);
    if (j.type !== 'fixed') body += element('axis',{xyz:j.axis ?? [0,0,1]}) + element('limit',j.limit);
    if (j.mimic) body += element('mimic',j.mimic);
    return element('joint',{name:j.name,type:j.type},body);
  });
  return '<?xml version="1.0"?>\n' + element('robot',{name:definition.name}, '\n' + [...links,...joints].join('\n') + '\n') + '\n';
}

export function writeFiles(directory, files, check = process.argv.includes('--check')) {
  for (const [relative, text] of Object.entries(files)) {
    const target = path.join(directory, relative);
    if (check) {
      if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== text) throw new Error(`Generated file differs: ${target}`);
    } else {
      fs.mkdirSync(path.dirname(target), {recursive:true}); fs.writeFileSync(target, text);
    }
  }
  console.log(`${check ? 'Verified' : 'Wrote'} ${Object.keys(files).length} files in ${directory}`);
}
