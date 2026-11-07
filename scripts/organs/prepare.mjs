#!/usr/bin/env node
// Prepares a Sketchfab GLB for the Atlas: PNG textures -> JPEG (max 2048 px), written to public/models/organs/<key>.glb.
// Usage: node scripts/organs/prepare.mjs <arquivo.glb> <chave>   (macOS: uses the built-in `sips`)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {describeGlb, readGlb, replaceImages} from './glb.mjs';

const [input, key] = process.argv.slice(2);
if (!input || !/^[a-z-]+$/.test(key ?? '')) {
  console.error('Uso: node scripts/organs/prepare.mjs <arquivo.glb> <chave, ex.: lungs>');
  process.exit(1);
}
const source = fs.readFileSync(input);
const {json} = readGlb(source);
// Normal maps lose detail faster under JPEG, so they keep a higher quality.
const normalImages = new Set((json.materials ?? []).map(m => m.normalTexture && json.textures[m.normalTexture.index]?.source).filter(i => i !== undefined));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-organ-'));
const out = replaceImages(source, (bytes, mimeType, index) => {
  if (mimeType !== 'image/png') return {bytes, mimeType};
  const png = path.join(tmp, `${index}.png`), jpg = path.join(tmp, `${index}.jpg`);
  fs.writeFileSync(png, bytes);
  const quality = normalImages.has(index) ? '92' : '85';
  execFileSync('sips', ['-Z', '2048', '-s', 'format', 'jpeg', '-s', 'formatOptions', quality, png, '--out', jpg], {stdio: 'ignore'});
  return {bytes: fs.readFileSync(jpg), mimeType: 'image/jpeg'};
});
fs.rmSync(tmp, {recursive: true, force: true});

const target = path.resolve('public/models/organs', `${key}.glb`);
fs.mkdirSync(path.dirname(target), {recursive: true});
fs.writeFileSync(target, out);
const mb = n => (n / 1e6).toFixed(1) + ' MB';
const info = describeGlb(out);
console.log(`${key}: ${mb(source.length)} -> ${mb(out.length)}, ${info.triangles.toLocaleString('pt-BR')} triângulos, ${info.images.length} texturas`);
if (info.triangles > 300_000) console.warn('Atenção: modelo pesado; vale simplificar a malha antes de publicar.');
console.log(`Gravado em ${path.relative(process.cwd(), target)}. Lembre de aumentar ?v= em organ-models.ts se o arquivo mudou.`);
