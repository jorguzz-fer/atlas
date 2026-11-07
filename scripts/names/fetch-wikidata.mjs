// Fetches Portuguese and Latin labels from Wikidata for FMA ids (property P1402).
// Cached in work/wikidata.json so reruns do not hit the network.
import fs from 'node:fs';

const ENDPOINT = 'https://query.wikidata.org/sparql';
const CACHE = new URL('../../work/wikidata.json', import.meta.url);

async function query(ids) {
  const values = ids.map(id => `"${id.replace(/^FMA/, '')}"`).join(' ');
  const sparql = `SELECT ?fma ?ptbr ?pt ?la WHERE {
    VALUES ?fma { ${values} }
    ?item wdt:P1402 ?fma .
    OPTIONAL { ?item rdfs:label ?ptbr FILTER(LANG(?ptbr) = "pt-br") }
    OPTIONAL { ?item rdfs:label ?pt FILTER(LANG(?pt) = "pt") }
    OPTIONAL { ?item rdfs:label ?la FILTER(LANG(?la) = "la") }
  }`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/sparql-results+json', 'User-Agent': 'atlas-build/1.0'},
      body: new URLSearchParams({query: sparql}),
    });
    if (res.ok) return (await res.json()).results.bindings;
    await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
  }
  throw new Error('Wikidata indisponível');
}

/** @returns {Promise<Record<string,{ptbr?:string,pt?:string,la?:string}>>} keyed by "FMA<n>" */
export async function fetchWikidata(fmaIds) {
  if (fs.existsSync(CACHE)) return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const out = {};
  for (let i = 0; i < fmaIds.length; i += 200) {
    for (const b of await query(fmaIds.slice(i, i + 200))) {
      const id = 'FMA' + b.fma.value;
      const row = (out[id] ??= {});
      if (b.ptbr) row.ptbr ??= b.ptbr.value;
      if (b.pt) row.pt ??= b.pt.value;
      if (b.la) row.la ??= b.la.value;
    }
    process.stdout.write(`\rWikidata: ${Math.min(i + 200, fmaIds.length)}/${fmaIds.length}`);
  }
  process.stdout.write('\n');
  fs.mkdirSync(new URL('.', CACHE), {recursive: true});
  fs.writeFileSync(CACHE, JSON.stringify(out));
  return out;
}
