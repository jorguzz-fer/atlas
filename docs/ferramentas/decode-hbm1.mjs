// Decodes one HBM1 chunk (gzip + meshopt streams) and checks it against atlas.json
import fs from 'node:fs'; import zlib from 'node:zlib';
import { MeshoptDecoder } from 'meshoptimizer';
const [atlasPath, chunkPath, chunkIdx] = process.argv.slice(2);
const atlas = JSON.parse(fs.readFileSync(atlasPath));
const p = zlib.gunzipSync(fs.readFileSync(chunkPath)); const buf = p.buffer.slice(p.byteOffset, p.byteOffset + p.byteLength);
await MeshoptDecoder.ready;
const TYPES = ['positions','normals','indices','int16x3'], SIZE = {positions:12, normals:6, indices:4, int16x3:6};
const dv = new DataView(buf); const n = dv.getUint32(4, true); let s = 8 + 16*n;
const out = new ArrayBuffer(atlas.chunks[chunkIdx].bytes);
for (let i = 0; i < n; i++) {
  const o = 8+16*i, t = TYPES[dv.getUint32(o,true)], off = dv.getUint32(o+4,true), cnt = dv.getUint32(o+8,true), len = dv.getUint32(o+12,true);
  const src = new Uint8Array(buf, s, len); s += len;
  if (t === 'indices') MeshoptDecoder.decodeIndexBuffer(new Uint8Array(out, off, cnt*4), cnt, 4, src);
  else if (t === 'positions') MeshoptDecoder.decodeVertexBuffer(new Uint8Array(out, off, cnt*12), cnt, 12, src, 'EXPONENTIAL');
  else { const tmp = new Int16Array(4*cnt); MeshoptDecoder.decodeVertexBuffer(new Uint8Array(tmp.buffer), cnt, 8, src, t==='normals'?'OCTAHEDRAL':undefined);
    const a = new Int16Array(out, off, 3*cnt); for (let r=0;r<cnt;r++){a[3*r]=tmp[4*r];a[3*r+1]=tmp[4*r+1];a[3*r+2]=tmp[4*r+2];} }
}
console.log('consumed all bytes:', s === buf.byteLength);
const parts = atlas.parts.filter(q => q.chunk == chunkIdx);
let ok = 0;
for (const q of parts) {
  const pos = new Float32Array(out, q.positions, q.vertexCount*3), idx = new Uint32Array(out, q.indices, q.indexCount);
  const mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9]; for (let i=0;i<pos.length;i++){mn[i%3]=Math.min(mn[i%3],pos[i]);mx[i%3]=Math.max(mx[i%3],pos[i]);}
  const good = mn.every((v,k)=>Math.abs(v-q.bounds[0][k])<1e-3) && mx.every((v,k)=>Math.abs(v-q.bounds[1][k])<1e-3) && Math.max(...idx) < q.vertexCount;
  if (good) ok++;
}
console.log(`parts in chunk ${chunkIdx}: ${parts.length}, bounds+indices match: ${ok}`);
const q = parts[0]; const pos = new Float32Array(out, q.positions, q.vertexCount*3), idx = new Uint32Array(out, q.indices, q.indexCount);
let obj = `# ${q.name}\n`; for (let i=0;i<q.vertexCount;i++) obj += `v ${pos[3*i]} ${pos[3*i+1]} ${pos[3*i+2]}\n`;
for (let i=0;i<idx.length;i+=3) obj += `f ${idx[i]+1} ${idx[i+1]+1} ${idx[i+2]+1}\n`; fs.writeFileSync('part0.obj', obj); console.log('wrote part0.obj', q.name);
