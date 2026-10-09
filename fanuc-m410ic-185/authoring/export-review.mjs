/** Original-geometry snapshot for Blender review; never used by catalog export. */
import fs from 'node:fs';
import {createScene,poseValues} from './scene.mjs';
import {pathToFileURL} from 'node:url';
import {referenceScene} from '@botrail/authoring/reference-model.mjs';
const [output,pose='zero',modelPath]=process.argv.slice(2);
if(!output)throw new Error('node export-review.mjs OUT.json [zero|reach|low|folded] [optional-baseline-model.mjs]');
const mode='reference';const s=modelPath?referenceScene((await import(pathToFileURL(modelPath))).definition()):createScene();s.pose(poseValues(pose));
const meshes=[];
s.root.traverse(o=>{
  if(!o.isMesh)return;
  const g=o.geometry,p=g.getAttribute('position'),n=g.getAttribute('normal');
  const indices=g.index?Array.from(g.index.array):Array.from({length:p.count},(_,i)=>i);
  meshes.push({name:o.name,matrix:o.matrixWorld.toArray(),
    vertices:Array.from({length:p.count},(_,i)=>[p.getX(i),p.getY(i),p.getZ(i)]),
    normals:n?Array.from({length:n.count},(_,i)=>[n.getX(i),n.getY(i),n.getZ(i)]):undefined,
    faces:Array.from({length:indices.length/3},(_,i)=>indices.slice(i*3,i*3+3)),
    material:{name:o.material.name,color:[o.material.color.r,o.material.color.g,o.material.color.b],
      metalness:o.material.metalness,roughness:o.material.roughness}});
});
fs.writeFileSync(output,JSON.stringify({pose,mode,frames:Object.fromEntries([...s.links].map(([name,link])=>[name,link.matrixWorld.toArray()])),meshes}));
console.log(`Wrote ${meshes.length} original meshes: ${output}`);
