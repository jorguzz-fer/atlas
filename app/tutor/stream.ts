export type TutorEvent =
  | {type: 'text'; delta: string}
  | {type: 'highlight'; ids: string[]}
  | {type: 'done'}
  | {type: 'error'; message: string};

/** Parses server-sent events from a text chunk; `rest` carries an incomplete event into the next call. */
export function parseSse(chunk: string, buffer: string): {events: TutorEvent[]; rest: string} {
  const text = (buffer + chunk).replace(/\r\n/g, '\n');
  const blocks = text.split('\n\n');
  const rest = blocks.pop() ?? '';
  const events: TutorEvent[] = [];
  for (const block of blocks) {
    const data = block.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trimStart()).join('\n');
    if (!data) continue;
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed.type === 'string') events.push(parsed as TutorEvent);
    } catch {
      // Not JSON: not one of ours.
    }
  }
  return {events, rest};
}

export type ChatMessage = {role: 'user' | 'assistant'; text: string};

/** Sends one question and calls onEvent for each event as it arrives. Throws with the server message on HTTP errors. */
export async function askTutor(body: {question: string; history: ChatMessage[]; selected?: {id: string}}, onEvent: (e: TutorEvent) => void, signal?: AbortSignal) {
  const res = await fetch('/api/tutor', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body), signal});
  if (!res.ok || !res.body) {
    let message = 'O tutor não respondeu. Tente de novo.';
    try { message = (await res.json()).error ?? message; } catch { /* keep default */ }
    throw new Error(message);
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let rest = '';
  for (;;) {
    const {value, done} = await reader.read();
    if (done) break;
    const out = parseSse(value, rest);
    rest = out.rest;
    out.events.forEach(onEvent);
  }
}
