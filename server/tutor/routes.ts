import type Anthropic from '@anthropic-ai/sdk';
import {Hono, type Context} from 'hono';
import {streamSSE} from 'hono/streaming';
import type {BudgetMeter, Usage} from './budget';
import type {Catalog} from './catalog';
import type {RateLimiter} from './rate-limit';
import {clientIp} from './client-ip';
import {SYSTEM_PROMPT, TOOLS, contextBlock} from './prompt';

/** One model turn: streams text through onText and resolves with the complete message. */
export type LlmTurn = (req: {system: string; messages: Anthropic.MessageParam[]; tools: Anthropic.Tool[]; onText: (delta: string) => void}) =>
  Promise<{content: Anthropic.ContentBlock[]; stop_reason: string | null; usage: Usage; model: string}>;

const MAX_QUESTION = 800;
const MAX_HISTORY = 10;
const MAX_TOOL_ROUNDS = 4;

const MSG = {
  invalid: 'Pergunta inválida.',
  tooLong: `A pergunta pode ter no máximo ${MAX_QUESTION} caracteres.`,
  noKey: 'O tutor não está configurado neste servidor.',
  rate: 'Muitas perguntas seguidas. Espere um pouco e tente de novo.',
  budget: 'O tutor descansou por hoje, volte amanhã.',
  failed: 'O tutor teve um problema para responder. Tente de novo.',
  refused: 'Não posso ajudar com essa pergunta.',
};

type Body = {question: string; history: {role: 'user' | 'assistant'; text: string}[]; selected?: {id: string}};

function parse(raw: unknown): Body | string {
  if (!raw || typeof raw !== 'object') return MSG.invalid;
  const b = raw as Record<string, unknown>;
  if (typeof b.question !== 'string' || !b.question.trim()) return MSG.invalid;
  if (b.question.length > MAX_QUESTION) return MSG.tooLong;
  const history = Array.isArray(b.history) ? b.history : [];
  const clean = history.slice(-MAX_HISTORY).filter((h): h is Body['history'][number] =>
    !!h && typeof h === 'object' && (h.role === 'user' || h.role === 'assistant') && typeof h.text === 'string' && h.text.length <= 6000);
  const sel = b.selected as Record<string, unknown> | undefined;
  const selected = sel && typeof sel.id === 'string' && sel.id.length <= 60 ? {id: sel.id} : undefined;
  return {question: b.question.trim(), history: clean, selected};
}

export function createTutor(deps: {catalog: Catalog; budget: BudgetMeter; limiter: RateLimiter; llm: LlmTurn | null; remoteOf?: (c: Context) => string}): Hono {
  const app = new Hono();
  app.post('/', async c => {
    let raw: unknown;
    try { raw = await c.req.json(); } catch { return c.json({error: MSG.invalid}, 400); }
    const body = parse(raw);
    if (typeof body === 'string') return c.json({error: body}, 400);
    if (!deps.llm) return c.json({error: MSG.noKey}, 503);
    const ip = clientIp(c.req.raw.headers, deps.remoteOf?.(c) ?? '');
    if (!deps.limiter.take(ip)) return c.json({error: MSG.rate}, 429);
    if (!deps.budget.canSpend()) return c.json({error: MSG.budget}, 429);

    const llm = deps.llm;
    const selected = body.selected ? deps.catalog.describe(body.selected.id) : null;
    const messages: Anthropic.MessageParam[] = [];
    // History arrives as plain text; consecutive same-role turns are merged so roles alternate.
    for (const h of body.history) {
      const last = messages.at(-1);
      if (last && last.role === h.role && typeof last.content === 'string') last.content += `\n\n${h.text}`;
      else messages.push({role: h.role, content: h.text});
    }
    while (messages[0]?.role === 'assistant') messages.shift();
    const question = `${contextBlock(selected)}\n\nPergunta: ${body.question}`;
    if (messages.at(-1)?.role === 'user') messages.push({role: 'assistant', content: '(sem resposta)'});
    messages.push({role: 'user', content: question});

    return streamSSE(c, async sse => {
      const send = (data: unknown) => sse.writeSSE({data: JSON.stringify(data)});
      let wroteText = false;
      try {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const turn = await llm({system: SYSTEM_PROMPT, messages, tools: TOOLS, onText: delta => { wroteText = true; void send({type: 'text', delta}); }});
          deps.budget.record(turn.model, turn.usage);
          if (turn.stop_reason === 'refusal') { if (!wroteText) await send({type: 'text', delta: MSG.refused}); break; }
          const toolUses = turn.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
          if (turn.stop_reason !== 'tool_use' || toolUses.length === 0) break;
          messages.push({role: 'assistant', content: turn.content as Anthropic.ContentBlockParam[]});
          const results: Anthropic.ToolResultBlockParam[] = [];
          for (const use of toolUses) {
            const input = (use.input ?? {}) as Record<string, unknown>;
            if (use.name === 'find_structures' && typeof input.query === 'string') {
              results.push({type: 'tool_result', tool_use_id: use.id, content: JSON.stringify(deps.catalog.find(input.query.slice(0, 120)))});
            } else if (use.name === 'highlight_structures' && Array.isArray(input.ids)) {
              const ids = input.ids.filter((x): x is string => typeof x === 'string').slice(0, 20);
              const resolved = deps.catalog.resolve(ids);
              if (resolved.parts.length) await send({type: 'highlight', ids: resolved.parts});
              results.push({type: 'tool_result', tool_use_id: use.id, content: JSON.stringify({accepted: resolved.accepted, rejected: resolved.rejected})});
            } else {
              results.push({type: 'tool_result', tool_use_id: use.id, is_error: true, content: 'Entrada inválida para a ferramenta.'});
            }
          }
          messages.push({role: 'user', content: results});
          // The answer in progress may finish even if this turn crossed the daily cap; the next question is refused.
        }
        await send({type: 'done'});
      } catch (err) {
        console.error('tutor:', err instanceof Error ? err.message : err);
        await send({type: 'error', message: MSG.failed});
      }
    });
  });
  return app;
}
