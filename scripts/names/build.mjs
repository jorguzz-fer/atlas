// Builds public/data/names.pt.json from Wikidata labels (preferred) and AI translations (marked "ia").
// Usage: node scripts/names/build.mjs [--merge-ai work/ai]   (merges work/ai/out-*.json into ai-translations.json first)
import fs from 'node:fs';
import path from 'node:path';
import {fetchWikidata} from './fetch-wikidata.mjs';
import {normalizePtBr, guessGender} from './normalize-ptbr.mjs';

const root = new URL('../../', import.meta.url);
const read = rel => JSON.parse(fs.readFileSync(new URL(rel, root), 'utf8'));
const AI_FILE = new URL('scripts/names/ai-translations.json', root);
const EUROPEAN = /\b(esófago|fémur|ténue|pénis|bicípite|tricípite|quadricípite|rótula|perónio|omoplata|cúbito)\b/i;

const mergeDir = process.argv.indexOf('--merge-ai') > -1 ? process.argv[process.argv.indexOf('--merge-ai') + 1] : null;
if (mergeDir) {
  const merged = fs.existsSync(AI_FILE) ? JSON.parse(fs.readFileSync(AI_FILE, 'utf8')) : {};
  for (const f of fs.readdirSync(mergeDir).filter(f => /^out-\d+\.json$/.test(f))) Object.assign(merged, JSON.parse(fs.readFileSync(path.join(mergeDir, f), 'utf8')));
  fs.writeFileSync(AI_FILE, JSON.stringify(Object.fromEntries(Object.entries(merged).sort(([a],[b])=>a.localeCompare(b))), null, 1));
}

const atlas = read('public/models/atlas.json');
const wikidata = await fetchWikidata(atlas.concepts.map(c => c.id));
const ai = fs.existsSync(AI_FILE) ? JSON.parse(fs.readFileSync(AI_FILE, 'utf8')) : {};

const out = {};
const count = {wikidata: 0, ia: 0, missing: 0};
for (const c of atlas.concepts) {
  const w = wikidata[c.id] ?? {};
  const label = w.ptbr ?? w.pt;
  const la = w.la ? normalizePtBr(w.la).replace(/ human(us|a|um)$/i, '') : undefined;
  if (label) {
    const pt = normalizePtBr(label);
    out[c.id] = {pt, ...(la && {la}), source: 'wikidata', gender: guessGender(pt)};
    count.wikidata++;
  } else if (ai[c.id]?.pt) {
    const pt = normalizePtBr(ai[c.id].pt);
    out[c.id] = {pt, ...(la && {la}), source: 'ia', gender: ai[c.id].g === 'f' ? 'f' : 'm'};
    count.ia++;
  } else {
    count.missing++;
  }
}

const european = Object.entries(out).filter(([, e]) => EUROPEAN.test(e.pt));
console.log(`Nomes: ${count.wikidata} Wikidata, ${count.ia} IA, ${count.missing} sem tradução, ${european.length} com grafia europeia`);
if (european.length) console.log(european.slice(0, 10));
fs.writeFileSync(new URL('public/data/names.pt.json', root), JSON.stringify(out));
if (count.missing || european.length) process.exitCode = 1;
