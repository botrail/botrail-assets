/** Optional Blender material metadata for the authored OBJ review.
 * OBJ/MTL retain color but do not carry the authored PBR roughness/metalness.
 * node export-materials.mjs [path/to/model.mjs] > materials.json
 */
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const url=process.argv[2]?pathToFileURL(resolve(process.argv[2])):new URL('./model.mjs',import.meta.url);
const {definition}=await import(url),materials={};
for(const link of definition().links)link.visual?.traverse(o=>{if(o.isMesh){const m=o.material;materials[m.name]={metalness:m.metalness,roughness:m.roughness};}});
console.log(JSON.stringify(materials,null,2));
