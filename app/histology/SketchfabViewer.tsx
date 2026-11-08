import {useEffect, useRef, useState} from 'react';
import {ArrowLeft, Copy, MessageCircle, Plus} from 'lucide-react';
import type {HistoHotspot, HistologyItem} from './histology';
import {startViewer, type SketchfabApi} from './sketchfab-api';

type Vec3 = [number, number, number];
type Draft = {name: string; p: Vec3; eye: Vec3; target: Vec3};
const editorEnabled = () => typeof location !== 'undefined' && new URLSearchParams(location.search).has('marcadores');
const round = (v: Vec3) => v.map(x => +x.toFixed(4)) as Vec3;

/**
 * A model that can only be embedded: the Sketchfab viewer on the right, our list on the left.
 * Our markers replace the author's annotations, so names stay in Portuguese and the quiz can hide them.
 */
export function SketchfabViewer(props: {
  item: Extract<HistologyItem, {kind: 'sketchfab'}>;
  onClose: () => void;
  onAskTutor: (h: HistoHotspot | null) => void;
}) {
  const {item} = props;
  const frame = useRef<HTMLIFrameElement>(null);
  const api = useRef<SketchfabApi | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | string>('loading');
  const [quiz, setQuiz] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());
  const [editor] = useState(editorEnabled);
  const [placing, setPlacing] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [pending, setPending] = useState<Draft | null>(null);
  const [draftName, setDraftName] = useState('');
  const [copied, setCopied] = useState(false);
  const quizRef = useRef(quiz); quizRef.current = quiz;
  const placingRef = useRef(placing); placingRef.current = placing;
  /** Index chosen from our list: its selection event must not reveal the name in the quiz. */
  const fromList = useRef<number | null>(null);

  const title = (h: HistoHotspot, i: number, hidden: boolean) => (hidden ? `Estrutura ${i + 1}` : h.name);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    startViewer(frame.current!, item.uid).then(a => {
      if (cancelled) return;
      api.current = a;
      if (editor) (window as unknown as {histoApi?: SketchfabApi}).histoApi = a;
      a.getCameraLookAt((_e, cam) => {
        // Our numbered markers, in list order, replace the author's annotations.
        a.removeAllAnnotations(() => {
          item.hotspots.forEach((h, i) => a.createAnnotationFromWorldPosition(h.p, h.eye ?? cam.position, h.target ?? h.p, title(h, i, quizRef.current), ''));
          if (!cancelled) setStatus('ready');
        });
      });
      a.addEventListener('annotationSelect', index => {
        const h = item.hotspots[index];
        if (!h) return;
        setSelected(h.id);
        const listed = fromList.current === index;
        fromList.current = null;
        if (quizRef.current && !listed) setRevealed(r => new Set(r).add(h.id));
      });
      a.addEventListener('click', info => {
        if (!placingRef.current || !info.position3D) return;
        const p = round(info.position3D);
        a.getCameraLookAt((_e, cam) => { setPending({name: '', p, eye: round(cam.position), target: round(cam.target)}); setDraftName(''); });
      }, {pick: 'slow'});
    }).catch(e => { if (!cancelled) setStatus(e instanceof Error ? e.message : 'Não foi possível abrir o modelo.'); });
    return () => { cancelled = true; api.current = null; };
  }, [item, editor]);

  // Marker titles follow the quiz: hidden names show as "Estrutura N" until revealed.
  useEffect(() => {
    const a = api.current;
    if (!a || status !== 'ready') return;
    item.hotspots.forEach((h, i) => a.updateAnnotation(i, {title: title(h, i, quiz && !revealed.has(h.id))}));
  }, [quiz, revealed, status, item]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') props.onClose(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [props.onClose]);

  const pick = (h: HistoHotspot, i: number) => { setSelected(h.id); fromList.current = i; api.current?.gotoAnnotation(i); };
  const current = item.hotspots.find(h => h.id === selected) ?? null;
  const nameHidden = (h: HistoHotspot) => quiz && !revealed.has(h.id);

  return (
    <section className="organ-view" aria-label={item.title}>
      <div className="organ-copy">
        <button className="organ-back" onClick={props.onClose}><ArrowLeft size={15} /> Voltar ao atlas</button>
        <div className="organ-eyebrow">{item.eyebrow}</div>
        <h2 className="organ-title">{item.title}</h2>
        {item.hotspots.length > 0 ? (
          <>
            <div className="organ-chips" role="group" aria-label="Modo das etiquetas">
              <button className="pill" aria-pressed={quiz} onClick={() => { setQuiz(q => !q); setRevealed(new Set()); }}>Modo pergunta</button>
            </div>
            <p className="organ-note">
              {quiz
                ? <>Os nomes estão ocultos. Clique num número no modelo para revelar o nome.</>
                : <>Clique numa estrutura da lista para o modelo ir até ela. No <b>modo pergunta</b>, os nomes ficam ocultos e aparecem só quando você clica no número.</>}
            </p>
            <ol className="organ-list">
              {item.hotspots.map((h, i) => (
                <li key={h.id}>
                  <button className={h.id === selected ? 'sel' : ''} onClick={() => pick(h, i)}>
                    <span className="n">{i + 1}</span>
                    <span className={nameHidden(h) ? 'hidden-name' : ''}>{nameHidden(h) ? 'Estrutura oculta' : h.name}</span>
                  </button>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="organ-note">Gire e amplie o modelo para explorar. Os marcadores com os nomes das estruturas ainda vão ser adicionados.</p>
        )}
        <div className="organ-actions">
          <button className="foot-btn" disabled={!!current && nameHidden(current)} onClick={() => props.onAskTutor(current)}>
            <MessageCircle size={16} /> {current && !nameHidden(current) ? `Perguntar sobre ${current.name.toLowerCase()}` : `Perguntar ao tutor sobre ${item.label.toLowerCase()}`}
          </button>
        </div>
        {editor && (
          <div className="organ-editor">
            <strong>Editor de marcadores</strong>
            <p>Ative “Posicionar”, gire o modelo até a estrutura ficar de frente e clique nela. A vista atual fica guardada com o marcador.</p>
            <div className="organ-chips">
              <button className="pill" aria-pressed={placing} onClick={() => setPlacing(p => !p)}><Plus size={14} /> Posicionar</button>
              <button className="pill" disabled={!drafts.length} onClick={() => {
                const text = JSON.stringify(drafts.map((x, i) => ({id: `m${i + 1}`, name: x.name, p: x.p, eye: x.eye, target: x.target})), null, 1);
                void navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
              }}><Copy size={14} /> {copied ? 'Copiado!' : `Copiar (${drafts.length})`}</button>
            </div>
            {pending && (
              <form className="organ-draft" onSubmit={e => {
                e.preventDefault();
                const d = {...pending, name: draftName.trim() || `Marcador ${drafts.length + 1}`};
                setDrafts(list => [...list, d]);
                api.current?.createAnnotationFromWorldPosition(d.p, d.eye, d.target, `+ ${d.name}`, '');
                setPending(null);
              }}>
                <input autoFocus value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="Nome da estrutura" aria-label="Nome da estrutura" maxLength={60} />
                <button className="pill" type="submit">Salvar</button>
                <button className="pill" type="button" onClick={() => setPending(null)}>Cancelar</button>
              </form>
            )}
            {drafts.length > 0 && <ol className="organ-drafts">{drafts.map((x, i) => <li key={i}><span>+{i + 1} {x.name}</span></li>)}</ol>}
          </div>
        )}
        <p className="organ-credit">
          Modelo 3D: “<a href={item.credit.source} target="_blank" rel="noreferrer">{item.credit.title}</a>”, por <a href={item.credit.authorUrl} target="_blank" rel="noreferrer">{item.credit.author}</a>, incorporado do Sketchfab (licença <a href={item.credit.license.url} target="_blank" rel="noreferrer">{item.credit.license.label}</a>). Precisa de internet.
        </p>
      </div>
      <div className="organ-stage">
        <iframe
          ref={frame}
          className="sketchfab-frame"
          title={`${item.title} (Sketchfab)`}
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
        />
        {status !== 'ready' && <div className="organ-loading">{status === 'loading' ? 'carregando modelo 3D…' : status}</div>}
      </div>
    </section>
  );
}
