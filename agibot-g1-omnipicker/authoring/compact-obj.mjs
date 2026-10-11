/** Lossless target-local OBJ compaction. Reuse identical attribute records within
 * each object; retain every face, corner attribute, material and object boundary.
 * No numeric rounding, decimation, welding between objects or shared-helper change.
 */
import {meshFiles as uncompressedMeshFiles} from '../../authoring/reference-export.mjs';

export function compactObj(source){
 const kinds=['v','vt','vn'],maps=Object.fromEntries(kinds.map(k=>[k,new Map()]));
 const remap=Object.fromEntries(kinds.map(k=>[k,[undefined]]));
 const counts=Object.fromEntries(kinds.map(k=>[k,0])),out=[];
 for(const line of source.split('\n')){
  const match=/^(v|vt|vn) (.*)$/.exec(line);
  if(match){
   const [,kind,value]=match;let index=maps[kind].get(value);
   if(index===undefined){index=++counts[kind];maps[kind].set(value,index);out.push(line);}
   remap[kind].push(index);continue;
  }
  if(/^(l|p|vp|curv|curv2|surf|parm|trim|hole|scrv|sp|end|con)\s/.test(line))
   throw new Error('Unsupported OBJ record: '+line.split(/\s/,1)[0]);
  if(line.startsWith('o '))for(const kind of kinds)maps[kind].clear();
  if(line.startsWith('f ')){
   const corners=line.slice(2).trim().split(/\s+/).map(token=>token.split('/').map((value,i)=>{
    if(!value){if(i===0)throw new Error(`Missing vertex index: ${token}`);return '';}
    const index=Number(value),kind=kinds[i];
    if(!Number.isInteger(index)||index<=0||kind===undefined||remap[kind][index]===undefined)
     throw new Error(`Unsupported OBJ index: ${token}`);
    return remap[kind][index];
   }).join('/'));
   out.push('f '+corners.join(' '));
  }else out.push(line);
 }
 return out.join('\n');
}

export function meshFiles(links){
 return Object.fromEntries(Object.entries(uncompressedMeshFiles(links)).map(([name,text])=>
  [name,name.endsWith('.obj')?compactObj(text):text]));
}
