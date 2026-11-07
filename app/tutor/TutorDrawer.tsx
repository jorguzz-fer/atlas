import {Fragment, useEffect, useRef, useState, type ReactNode} from 'react';
import {Send, Sparkles, X} from 'lucide-react';
import {askTutor, type ChatMessage} from './stream';

const SUGGESTIONS = ['O que é isso?', 'Para que serve?', 'Com o que se conecta?'];

/** Minimal, safe Markdown: paragraphs, "- " lists and **bold**. No HTML is ever injected. */
function renderMarkdown(text: string): ReactNode {
  const inline = (line: string) => line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>);
  return text.split(/\n{2,}/).map((block, i) => {
    const lines = block.split('\n');
    if (lines.every(l => /^\s*[-*•]\s+/.test(l))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-*•]\s+/, ''))}</li>)}</ul>;
    return <p key={i}>{lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l.replace(/^#+\s*/, ''))}</Fragment>)}</p>;
  });
}

export function TutorDrawer(props: {open: boolean; onClose: () => void; selected: {id: string; name: string} | null; onHighlight: (partIds: string[]) => void}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => { if (props.open) setTimeout(() => inputRef.current?.focus(), 50); }, [props.open]);
  useEffect(() => { scroller.current?.scrollTo({top: scroller.current.scrollHeight}); }, [messages]);
  useEffect(() => () => abort.current?.abort(), []);

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    const history = messages;
    setMessages([...history, {role: 'user', text: q}, {role: 'assistant', text: ''}]);
    setInput('');
    setError('');
    setBusy(true);
    abort.current = new AbortController();
    const append = (delta: string) => setMessages(m => {
      const copy = [...m];
      copy[copy.length - 1] = {role: 'assistant', text: copy[copy.length - 1].text + delta};
      return copy;
    });
    try {
      await askTutor({question: q, history, selected: props.selected ? {id: props.selected.id} : undefined}, e => {
        if (e.type === 'text') append(e.delta);
        else if (e.type === 'highlight') props.onHighlight(e.ids);
        else if (e.type === 'error') setError(e.message);
      }, abort.current.signal);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message);
        setMessages(m => (m.at(-1)?.text === '' ? m.slice(0, -1) : m));
      }
    } finally {
      setBusy(false);
    }
  };

  if (!props.open) return null;
  return (
    <aside className="tutor" aria-label="Tutor de anatomia">
      <header>
        <div><Sparkles size={16} /> <strong>Tutor</strong></div>
        <button className="pill round" onClick={props.onClose} aria-label="Fechar o tutor"><X size={16} /></button>
      </header>
      {props.selected && <div className="tutor-context">Sobre: <strong>{props.selected.name}</strong></div>}
      <div className="tutor-log" ref={scroller} aria-live="polite">
        {messages.length === 0 && (
          <div className="tutor-empty">
            <p>Pergunte qualquer coisa sobre anatomia. {props.selected ? 'Eu sei qual estrutura está selecionada.' : 'Selecione uma estrutura no modelo para eu saber do que você está falando.'}</p>
            <div className="chips">{SUGGESTIONS.map(s => <button key={s} className="pill" onClick={() => send(s)}>{s}</button>)}</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.role === 'assistant' ? (m.text ? renderMarkdown(m.text) : <span className="typing">Pensando…</span>) : m.text}
          </div>
        ))}
        {error && <div className="tutor-error" role="alert">{error}</div>}
      </div>
      <form className="tutor-input" onSubmit={e => { e.preventDefault(); void send(input); }}>
        <textarea
          ref={inputRef}
          value={input}
          maxLength={800}
          rows={2}
          placeholder="Escreva sua pergunta…"
          aria-label="Sua pergunta"
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input); } }}
        />
        <button className="pill round primary" type="submit" disabled={busy || !input.trim()} aria-label="Enviar"><Send size={16} /></button>
      </form>
      <p className="tutor-note">Ferramenta educacional, não é orientação médica.</p>
    </aside>
  );
}
