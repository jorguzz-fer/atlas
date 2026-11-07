import {createTutor, type LlmTurn} from './routes';
import {createCatalog} from './catalog';
import {BudgetMeter} from './budget';
import {RateLimiter} from './rate-limit';
import {createNameIndex} from '../../app/names';
import type {Atlas} from '../../app/anatomy';

const atlas = {
  version: 't', chunks: [], triangles: 0,
  parts: [
    {id: 'FJ1252', name: 'Gingiva of upper jaw', conceptId: 'FMA59763', system: 'skeletal', bounds: [[0, 1.5, 0], [0.1, 1.6, 0.1]]},
    {id: 'FJ2000', name: 'Pancreas', conceptId: 'FMA7198', system: 'digestive', bounds: [[0, 1.0, 0], [0.1, 1.1, 0.1]]},
  ],
  concepts: [
    {id: 'FMA59763', name: 'gingiva of upper jaw', elements: ['FJ1252']},
    {id: 'FMA7198', name: 'pancreas', elements: ['FJ2000']},
  ],
} as unknown as Atlas;
const names = createNameIndex(atlas, {FMA7198: {pt: 'Pâncreas', la: 'Pancreas', source: 'wikidata'}}, {});
const catalog = createCatalog(atlas, names);

type Turn = Awaited<ReturnType<LlmTurn>>;
const textTurn = (text: string, usage = {input_tokens: 10, output_tokens: 10}): Turn => ({
  content: [{type: 'text', text, citations: null}] as unknown as Turn['content'], stop_reason: 'end_turn', usage, model: 'claude-opus-5-5',
});

function setup(turns: Turn[], opts: {dailyUsd?: number; perHour?: number} = {}) {
  const calls: Parameters<LlmTurn>[0][] = [];
  const llm: LlmTurn = async req => {
    calls.push(structuredClone({...req, onText: undefined}) as never);
    const turn = turns.shift() ?? textTurn('fim');
    for (const b of turn.content) if (b.type === 'text') req.onText(b.text);
    return turn;
  };
  const budget = new BudgetMeter({dailyUsd: opts.dailyUsd ?? 1, now: () => new Date('2026-11-07T12:00:00Z')});
  const limiter = new RateLimiter({perHour: opts.perHour ?? 30, now: () => 0});
  const app = createTutor({catalog, budget, limiter, llm, remoteOf: () => '10.0.0.1'});
  const ask = (body: unknown, headers: Record<string, string> = {}) =>
    app.request('/', {method: 'POST', headers: {'content-type': 'application/json', ...headers}, body: JSON.stringify(body)});
  return {app, ask, calls, budget};
}

const events = async (res: Response) => (await res.text()).split('\n').filter(l => l.startsWith('data: ')).map(l => JSON.parse(l.slice(6)));

test('streams the answer as text events and ends with done', async () => {
  const {ask} = setup([textTurn('O pâncreas produz insulina.')]);
  const res = await ask({question: 'o que o pâncreas produz?', history: [], selected: {id: 'FMA7198'}});
  expect(res.headers.get('content-type')).toContain('text/event-stream');
  const ev = await events(res);
  expect(ev.filter(e => e.type === 'text').map(e => e.delta).join('')).toBe('O pâncreas produz insulina.');
  expect(ev.at(-1)).toEqual({type: 'done'});
});

test('the selected structure reaches the model as context', async () => {
  const {ask, calls} = setup([textTurn('ok')]);
  await (await ask({question: 'para que serve?', history: [], selected: {id: 'FMA7198'}})).text();
  expect(JSON.stringify(calls[0].messages)).toContain('Pâncreas');
});

test('highlight_structures lights up known ids and reports unknown ones', async () => {
  const toolTurn = {
    content: [{type: 'tool_use', id: 'tu1', name: 'highlight_structures', input: {ids: ['FJ1252', 'NAO_EXISTE']}}],
    stop_reason: 'tool_use', usage: {input_tokens: 10, output_tokens: 5}, model: 'claude-opus-5-5',
  } as unknown as Turn;
  const {ask, calls} = setup([toolTurn, textTurn('Veja a gengiva.')]);
  const ev = await events(await ask({question: 'mostre a gengiva', history: []}));
  expect(ev).toContainEqual({type: 'highlight', ids: ['FJ1252']});
  const toolResult = JSON.stringify(calls[1].messages.at(-1));
  expect(toolResult).toContain('NAO_EXISTE');
  expect(toolResult).toContain('rejected');
});

test('find_structures searches the catalog in Portuguese', async () => {
  const toolTurn = {
    content: [{type: 'tool_use', id: 'tu1', name: 'find_structures', input: {query: 'pancreas'}}],
    stop_reason: 'tool_use', usage: {input_tokens: 10, output_tokens: 5}, model: 'claude-opus-5-5',
  } as unknown as Turn;
  const {ask, calls} = setup([toolTurn, textTurn('achei')]);
  await (await ask({question: 'onde fica o pâncreas?', history: []})).text();
  expect(JSON.stringify(calls[1].messages.at(-1))).toContain('FMA7198');
});

test('when the daily budget is gone the tutor answers 429 and asks to come back tomorrow', async () => {
  const {ask, budget} = setup([]);
  budget.record('claude-opus-5-5', {input_tokens: 1_000_000, output_tokens: 0});
  const res = await ask({question: 'oi', history: []});
  expect(res.status).toBe(429);
  expect((await res.json()).error).toBe('O tutor descansou por hoje, volte amanhã.');
});

test('an answer that crosses the budget still finishes; the next question is refused', async () => {
  const {ask} = setup([textTurn('resposta longa', {input_tokens: 400_000, output_tokens: 0})], {dailyUsd: 1});
  const ev = await events(await ask({question: 'primeira', history: []}));
  expect(ev.at(-1)).toEqual({type: 'done'});
  expect((await ask({question: 'segunda', history: []})).status).toBe(429);
});

test('rejects questions over 800 characters', async () => {
  const {ask} = setup([]);
  expect((await ask({question: 'a'.repeat(801), history: []})).status).toBe(400);
});

test('limits questions per IP using the proxy-appended address', async () => {
  const {ask} = setup([], {perHour: 1});
  expect((await ask({question: 'um', history: []}, {'x-forwarded-for': '1.1.1.1, 9.9.9.9'})).status).toBe(200);
  const second = await ask({question: 'dois', history: []}, {'x-forwarded-for': '2.2.2.2, 9.9.9.9'});
  expect(second.status).toBe(429);
  expect((await second.json()).error).toMatch(/Muitas perguntas/);
});

test('closing the connection aborts the model call', async () => {
  let seen: AbortSignal | undefined;
  let release!: () => void;
  const started = new Promise<void>(r => { release = r; });
  const llm: LlmTurn = req => new Promise((_, reject) => {
    seen = req.signal;
    release();
    req.signal?.addEventListener('abort', () => reject(new Error('aborted')));
  });
  const app = createTutor({catalog, budget: new BudgetMeter({dailyUsd: 1, now: () => new Date()}), limiter: new RateLimiter({perHour: 30, now: () => 0}), llm});
  const res = await app.request('/', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({question: 'oi', history: []})});
  await started;
  await res.body!.cancel();
  await new Promise(r => setTimeout(r, 20));
  expect(seen?.aborted).toBe(true);
});

test('only a few answers stream at the same time; extra ones get 429 busy', async () => {
  let release!: () => void;
  const gate = new Promise<void>(r => { release = r; });
  const llm: LlmTurn = async req => { await gate; req.onText('ok'); return textTurn('ok'); };
  const app = createTutor({catalog, budget: new BudgetMeter({dailyUsd: 1, now: () => new Date()}), limiter: new RateLimiter({perHour: 30, now: () => 0}), llm, maxConcurrent: 1});
  const post = () => app.request('/', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({question: 'oi', history: []})});
  const first = await post();
  const second = await post();
  expect(second.status).toBe(429);
  expect((await second.json()).error).toMatch(/ocupado/);
  release();
  await first.text();
  expect((await post()).status).toBe(200);
});

test('a tool round that crosses the budget does not start another model call', async () => {
  const toolTurn = {
    content: [{type: 'tool_use', id: 'tu1', name: 'find_structures', input: {query: 'pancreas'}}],
    stop_reason: 'tool_use', usage: {input_tokens: 300_000, output_tokens: 0}, model: 'claude-opus-5-5',
  } as unknown as Turn;
  const {ask, calls} = setup([toolTurn, textTurn('nunca')], {dailyUsd: 1});
  const ev = await events(await ask({question: 'onde?', history: []}));
  expect(calls).toHaveLength(1);
  expect(ev.at(-1)).toEqual({type: 'done'});
});

test('requests that are not JSON are refused (blocks cross-site form posts)', async () => {
  const {app} = setup([]);
  const res = await app.request('/', {method: 'POST', headers: {'content-type': 'text/plain'}, body: JSON.stringify({question: 'oi', history: []})});
  expect(res.status).toBe(415);
});

test('oversized bodies are refused', async () => {
  const {ask} = setup([]);
  const res = await ask({question: 'oi', history: [], padding: 'x'.repeat(64 * 1024)});
  expect(res.status).toBe(413);
});

test('without a model configured the tutor is unavailable (503)', async () => {
  const app = createTutor({catalog, budget: new BudgetMeter({dailyUsd: 1, now: () => new Date()}), limiter: new RateLimiter({perHour: 30, now: () => 0}), llm: null});
  const res = await app.request('/', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({question: 'oi', history: []})});
  expect(res.status).toBe(503);
});
