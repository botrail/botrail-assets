/** Deterministic authored machining grain. No measured roughness/finish claim.
 * A tile is 10 mm; the two data images are deliberately weak, seamless and
 * package-local. Node's PNG writer needs no canvas or image dependency.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseUsda } from 'three-usd-robot/core';

export const FINISH_PITCH = .010;

function png(size, pixels) {
  function chunk(type, data) {
    const body = Buffer.concat([Buffer.from(type), data]);
    let crc = 0xffffffff;
    for (const byte of body) {
      crc ^= byte;
      for (let k=0; k<8; k++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    const head = Buffer.alloc(4), tail = Buffer.alloc(4);
    head.writeUInt32BE(data.length); tail.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([head, body, tail]);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4);
  header[8]=8; header[9]=2; // RGB8, no colour-profile/gamma chunk (data)
  const scan = Buffer.alloc(size*(1+size*3));
  for(let y=0;y<size;y++) pixels.copy(scan,y*(1+size*3)+1,y*size*3,(y+1)*size*3);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),
    chunk('IDAT',deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]);
}

export function writeFinishTextures(directory) {
  mkdirSync(directory,{recursive:true});
  const n=256, normal=Buffer.alloc(n*n*3), roughness=Buffer.alloc(n*n*3);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const a=2*Math.PI*x/n, b=2*Math.PI*y/n;
    // Long feed marks across U, ~0.45 mm spacing in V. Small slope (<=3deg).
    const slope=.035*Math.cos(22*b)+.012*Math.cos(47*b+Math.sin(a));
    const ny=-slope/Math.sqrt(1+slope*slope), nz=1/Math.sqrt(1+slope*slope);
    const i=(y*n+x)*3;
    normal[i]=128;normal[i+1]=Math.round((ny+1)*127.5);normal[i+2]=Math.round((nz+1)*127.5);
    const r=Math.round(255*(.30+.025*Math.sin(22*b)+.01*Math.sin(7*a+3*b)));
    roughness.fill(r,i,i+3);
  }
  writeFileSync(resolve(directory,'steel-normal.png'),png(n,normal));
  writeFileSync(resolve(directory,'steel-roughness.png'),png(n,roughness));
}

export function steelFinishMaterial() {
  return parseUsda(`#usda 1.0
def Material "machined_steel" {
 token outputs:surface.connect = </mph3/Looks/machined_steel/PreviewSurface.outputs:surface>
 def Shader "PreviewSurface" {
  uniform token info:id = "UsdPreviewSurface"
  color3f inputs:diffuseColor = (0.55, 0.56, 0.58)
  float inputs:metallic = 1
  float inputs:roughness.connect = </mph3/Looks/machined_steel/Roughness.outputs:g>
  normal3f inputs:normal.connect = </mph3/Looks/machined_steel/Normal.outputs:rgb>
  token outputs:surface
 }
 def Shader "UV" {
  uniform token info:id = "UsdPrimvarReader_float2"
  token inputs:varname = "st"
  float2 outputs:result
 }
 def Shader "Normal" {
  uniform token info:id = "UsdUVTexture"
  asset inputs:file = @textures/steel-normal.png@
  token inputs:sourceColorSpace = "raw"
  token inputs:wrapS = "repeat"
  token inputs:wrapT = "repeat"
  float2 inputs:st.connect = </mph3/Looks/machined_steel/UV.outputs:result>
  float4 inputs:scale = (2, 2, 2, 1)
  float4 inputs:bias = (-1, -1, -1, 0)
  float3 outputs:rgb
 }
 def Shader "Roughness" {
  uniform token info:id = "UsdUVTexture"
  asset inputs:file = @textures/steel-roughness.png@
  token inputs:sourceColorSpace = "raw"
  token inputs:wrapS = "repeat"
  token inputs:wrapT = "repeat"
  float2 inputs:st.connect = </mph3/Looks/machined_steel/UV.outputs:result>
  float outputs:g
 }
}`).prims[0];
}
