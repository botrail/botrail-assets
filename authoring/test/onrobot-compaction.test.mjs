/** Exact OBJ corner/material/object preservation; no geometry tolerance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {meshFiles as originalMeshFiles} from '../reference-export.mjs';
import {definition as rg2} from '../../onrobot-rg2/authoring/model.mjs';
import {definition as rg6} from '../../onrobot-rg6/authoring/model.mjs';
import {compactObj} from '../../onrobot-rg2/authoring/compact-obj.mjs';
function corners(text){const attrs={v:[],vt:[],vn:[]};let object='',material='';const out=[];for(const line of text.split('\n')){const m=/^(v|vt|vn) (.*)$/.exec(line);if(m)attrs[m[1]].push(m[2]);else if(line.startsWith('o '))object=line;else if(line.startsWith('usemtl '))material=line;else if(line.startsWith('f '))out.push([object,material,...line.slice(2).split(' ').map(s=>s.split('/').map((v,i)=>v?attrs[['v','vt','vn'][i]][Number(v)-1]:'').join('|'))].join(';'));}return out;}
for(const [name,definition] of [['RG2',rg2],['RG6',rg6]])test(`${name}: compact OBJ preserves every original face corner, material and object`,()=>{for(const [file,raw] of Object.entries(originalMeshFiles(definition().links)))if(file.endsWith('.obj'))assert.deepEqual(corners(compactObj(raw)),corners(raw),file);});
