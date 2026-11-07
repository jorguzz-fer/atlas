// Translates concepts that still lack a Portuguese name, using the Claude Message Batches API.
// Needs ANTHROPIC_API_KEY. Writes into scripts/names/ai-translations.json; then run build.mjs.
// Usage: node scripts/names/fill-with-ai.mjs
import fs from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';

const root = new URL('../../', import.meta.url);
const AI_FILE = new URL('scripts/names/ai-translations.json', root);
const MODEL = process.env.NAMES_MODEL ?? 'claude-opus-5-5';

if (!process.env.ANTHROPIC_API_KEY) {
  console.log('ANTHROPIC_API_KEY ausente: tradução por IA pulada.');
  process.exit(0);
}

const atlas = JSON.parse(fs.readFileSync(new URL('public/models/atlas.json', root), 'utf8'));
const wikidata = JSON.parse(fs.readFileSync(new URL('work/wikidata.json', root), 'utf8'));
const ai = fs.existsSync(AI_FILE) ? JSON.parse(fs.readFileSync(AI_FILE, 'utf8')) : {};
const todo = atlas.concepts.filter(c => !(wikidata[c.id]?.ptbr || wikidata[c.id]?.pt) && !ai[c.id]);
if (!todo.length) {
  console.log('Nada a traduzir.');
  process.exit(0);
}

const SYSTEM = `Traduza nomes de estruturas anatômicas (ontologia FMA, em inglês) para o português do Brasil, seguindo a Terminologia Anatômica da Sociedade Brasileira de Anatomia e a grafia brasileira (esôfago, fêmur, patela, fíbula). "Left/Right X" vira "X esquerdo/esquerda/direito/direita" concordando com o substantivo principal. Músculos começam com "Músculo", artérias com "Artéria", veias com "Veia", nervos com "Nervo". Só a primeira letra maiúscula. "g" é o gênero do substantivo principal.`;

const schema = {
  type: 'object',
  properties: {items: {type: 'array', items: {type: 'object', properties: {id: {type: 'string'}, pt: {type: 'string'}, g: {type: 'string', enum: ['m', 'f']}}, required: ['id', 'pt', 'g'], additionalProperties: false}}},
  required: ['items'],
  additionalProperties: false,
};

const client = new Anthropic();
const requests = [];
for (let i = 0; i < todo.length; i += 100) {
  const slice = todo.slice(i, i + 100).map(c => ({id: c.id, en: c.name}));
  requests.push({
    custom_id: `names-${i}`,
    params: {
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      output_config: {effort: 'low', format: {type: 'json_schema', schema}},
      messages: [{role: 'user', content: JSON.stringify(slice)}],
    },
  });
}

const batch = await client.messages.batches.create({requests});
console.log(`Lote ${batch.id} com ${requests.length} pedidos enviado.`);
let status = batch;
while (status.processing_status !== 'ended') {
  await new Promise(r => setTimeout(r, 30000));
  status = await client.messages.batches.retrieve(batch.id);
  console.log(status.processing_status, status.request_counts);
}
for await (const result of await client.messages.batches.results(batch.id)) {
  if (result.result.type !== 'succeeded') continue;
  const text = result.result.message.content.find(b => b.type === 'text')?.text ?? '{}';
  for (const item of JSON.parse(text).items ?? []) ai[item.id] = {pt: item.pt, g: item.g};
}
fs.writeFileSync(AI_FILE, JSON.stringify(Object.fromEntries(Object.entries(ai).sort(([a],[b])=>a.localeCompare(b))), null, 1));
console.log(`Traduções salvas. Agora rode: node scripts/names/build.mjs`);
