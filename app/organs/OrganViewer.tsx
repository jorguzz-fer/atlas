import {useEffect, useRef, useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {ArrowLeft, Copy, MessageCircle, PersonStanding, Plus} from 'lucide-react';
import {labelShown, type Hotspot, type LabelMode, type OrganModel} from './organ-models';

const HOME = new T.Vector3(0, 0, 4.2);

/** A marker placed in the editor (?marcadores), not yet part of the code. */
type Draft = {name: string; p: [number, number, number]};
const editorEnabled = () => typeof location !== 'undefined' && new URLSearchParams(location.search).has('marcadores');

/**
 * Detailed, textured model of one organ with numbered markers, as in the lessons:
 * a list on the left, the model on the right; "Modo pergunta" hides the names until clicked.
 */
export function OrganViewer(props: {
  model: OrganModel;
  onClose: () => void;
  onAskTutor: (h: Hotspot) => void;
  onShowInBody: (h: Hotspot | null) => void;
}) {
  const {model} = props;
  const stage = useRef<HTMLDivElement>(null);
  const dots = useRef(new Map<string, HTMLButtonElement>());
  const flyTo = useRef<(h: Hotspot | null) => void>(() => {});
  const [mode, setMode] = useState<LabelMode>('none');
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());
  const [status, setStatus] = useState<'loading' | 'ready' | string>('loading');
  const [editor] = useState(editorEnabled);
  const [placing, setPlacing] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [pending, setPending] = useState<Draft['p'] | null>(null);
  const [draftName, setDraftName] = useState('');
  const [copied, setCopied] = useState(false);
  const draftsRef = useRef(drafts); draftsRef.current = drafts;
  const placingRef = useRef(placing); placingRef.current = placing;
  const onTap = useRef<(p: Draft['p']) => void>(() => {});
  onTap.current = p => { setPending(p); setDraftName(''); };

  useEffect(() => {
    const el = stage.current!;
    let disposed = false, frame = 0, n = 0, root: T.Object3D | null = null;
    const renderer = new T.WebGLRenderer({antialias: true, alpha: true});
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    el.prepend(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', `${model.title}. Arraste para girar, role para ampliar e dê dois cliques para voltar ao início.`);

    const scene = new T.Scene();
    const pmrem = new T.PMREMGenerator(renderer), room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    room.dispose(); pmrem.dispose();
    const key = new T.DirectionalLight(0xfff1ea, 2.2); key.position.set(2, 3, 4); scene.add(key);
    const rim = new T.DirectionalLight(0xff9a8a, 1.4); rim.position.set(-3, 1, -3); scene.add(rim);

    const camera = new T.PerspectiveCamera(30, 1, 0.01, 100);
    camera.position.copy(HOME);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.minDistance = 1.6; controls.maxDistance = 7;

    let fly: {t: number; from: T.Vector3; to: T.Vector3; tf: T.Vector3; tt: T.Vector3} | null = null;
    flyTo.current = h => {
      const p = h ? new T.Vector3(...h.p) : null;
      const to = p ? p.clone().normalize().multiplyScalar(Math.min(camera.position.length(), 3.6)).add(new T.Vector3(0, 0.15, 0)) : HOME.clone();
      fly = {t: 0, from: camera.position.clone(), to, tf: controls.target.clone(), tt: p ? p.multiplyScalar(0.35) : new T.Vector3()};
    };
    const reset = () => flyTo.current(null);
    renderer.domElement.addEventListener('dblclick', reset);

    const resize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();

    new GLTFLoader().loadAsync(model.url).then(gltf => {
      if (disposed) return;
      // Same preparation as the lesson, so the marker coordinates line up: centre on the bounding box.
      const r = gltf.scene;
      if (model.fit) {
        const size = new T.Box3().setFromObject(r).getSize(new T.Vector3());
        r.scale.multiplyScalar(model.fit / Math.max(size.x, size.y, size.z));
        r.updateMatrixWorld(true);
      }
      r.position.sub(new T.Box3().setFromObject(r).getCenter(new T.Vector3()));
      r.traverse(o => {
        if (o instanceof T.Mesh) {
          const m = o.material as T.MeshStandardMaterial;
          m.envMapIntensity = 0.56;
          m.roughness = Math.max(0.35, m.roughness);
        }
      });
      root = new T.Group(); root.add(r); scene.add(root);
      setStatus('ready');
    }).catch(() => { if (!disposed) setStatus('Não foi possível carregar o modelo 3D. Recarregue a página.'); });

    const ray = new T.Raycaster(), v = new T.Vector3(), d = new T.Vector3();
    // Editor: a click (not a drag) on the model proposes a new marker at that point.
    let down: [number, number] | null = null;
    const onDown = (e: PointerEvent) => { down = [e.clientX, e.clientY]; };
    const onUp = (e: PointerEvent) => {
      if (!placingRef.current || !root || !down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new T.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), camera);
      const hit = ray.intersectObject(root, true)[0];
      if (hit) onTap.current(hit.point.toArray().map(x => +x.toFixed(3)) as Draft['p']);
    };
    // Editor only: lets a script read the model point under a stage position (fractions 0..1 of width/height).
    if (editorEnabled()) (window as unknown as {organPick?: unknown}).organPick = (fx: number, fy: number) => {
      if (!root) return null;
      ray.setFromCamera(new T.Vector2(fx * 2 - 1, -(fy * 2 - 1)), camera);
      const hit = ray.intersectObject(root, true)[0];
      return hit ? hit.point.toArray().map(x => +x.toFixed(3)) : null;
    };
    if (editorEnabled()) (window as unknown as {organProject?: unknown}).organProject = (p: [number, number, number]) => {
      const q = new T.Vector3(...p).project(camera);
      return [+((q.x + 1) / 2).toFixed(3), +((1 - q.y) / 2).toFixed(3)];
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);
    const hidden = new Map<string, boolean>();
    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      if (fly) {
        fly.t = Math.min(1, fly.t + 0.035);
        const e = 1 - Math.pow(1 - fly.t, 3);
        camera.position.lerpVectors(fly.from, fly.to, e);
        controls.target.lerpVectors(fly.tf, fly.tt, e);
        if (fly.t >= 1) fly = null;
      }
      controls.update();
      renderer.render(scene, camera);
      // Markers follow the model; those behind it fade out (checked every 4 frames).
      const occlusion = root && n++ % 4 === 0;
      const all = [...model.hotspots, ...draftsRef.current.map((x, i) => ({id: `draft-${i}`, p: x.p}))];
      for (const h of all) {
        const dot = dots.current.get(h.id);
        if (!dot) continue;
        v.set(...h.p).project(camera);
        dot.style.transform = `translate(${(v.x + 1) / 2 * el.clientWidth}px, ${(1 - v.y) / 2 * el.clientHeight}px)`;
        if (occlusion) {
          d.set(...h.p).sub(camera.position);
          const dist = d.length();
          ray.set(camera.position, d.normalize());
          const hit = ray.intersectObject(root!, true)[0];
          hidden.set(h.id, !!hit && hit.distance < dist - 0.03);
        }
        dot.classList.toggle('behind', !!hidden.get(h.id) || v.z > 1);
      }
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('dblclick', reset);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      scene.traverse(o => {
        if (o instanceof T.Mesh) {
          o.geometry.dispose();
          for (const m of [o.material].flat() as T.MeshStandardMaterial[]) {
            [m.map, m.normalMap, m.roughnessMap, m.metalnessMap].forEach(t => t?.dispose());
            m.dispose();
          }
        }
      });
      env.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [model]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') props.onClose(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [props.onClose]);

  const pick = (h: Hotspot, fly: boolean) => {
    setSelected(h.id);
    if (fly) flyTo.current(h);
  };
  const clickDot = (h: Hotspot) => {
    if (mode === 'quiz') {
      setRevealed(r => { const next = new Set(r); if (next.has(h.id)) next.delete(h.id); else next.add(h.id); return next; });
      setSelected(h.id);
    } else pick(h, true);
  };
  const switchMode = (m: LabelMode) => { setMode(prev => (prev === m ? 'none' : m)); setRevealed(new Set()); };
  const current = model.hotspots.find(h => h.id === selected) ?? null;
  const nameHidden = (h: Hotspot) => mode === 'quiz' && !revealed.has(h.id);

  return (
    <section className="organ-view" aria-label={model.title}>
      <div className="organ-copy">
        <button className="organ-back" onClick={props.onClose}><ArrowLeft size={15} /> Voltar ao corpo</button>
        <div className="organ-eyebrow">{model.eyebrow}</div>
        <h2 className="organ-title">{model.title}</h2>
        <div className="organ-chips" role="group" aria-label="Modo das etiquetas">
          <button className="pill" aria-pressed={mode === 'labels'} onClick={() => switchMode('labels')}>Mostrar nomes</button>
          <button className="pill" aria-pressed={mode === 'quiz'} onClick={() => switchMode('quiz')}>Modo pergunta</button>
        </div>
        <p className="organ-note">
          {mode === 'quiz'
            ? <>Os nomes estão ocultos. Clique num número no modelo para revelar o nome.</>
            : <>Clique numa estrutura da lista para o modelo girar até ela. No <b>modo pergunta</b>, os nomes ficam ocultos e aparecem só quando você clica no número.</>}
        </p>
        <ol className="organ-list">
          {model.hotspots.map((h, i) => (
            <li key={h.id}>
              <button className={h.id === selected ? 'sel' : ''} onClick={() => pick(h, true)}>
                <span className="n">{i + 1}</span>
                <span className={nameHidden(h) ? 'hidden-name' : ''}>{nameHidden(h) ? 'Estrutura oculta' : h.name}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="organ-actions">
          <button className="foot-btn" disabled={!current || nameHidden(current)} onClick={() => current && props.onAskTutor(current)}>
            <MessageCircle size={16} /> {current && !nameHidden(current) ? `Perguntar sobre ${current.name.toLowerCase()}` : 'Selecione uma estrutura para perguntar ao tutor'}
          </button>
          <button className="foot-btn" onClick={() => props.onShowInBody(current && !nameHidden(current) ? current : null)}>
            <PersonStanding size={16} /> {current && !nameHidden(current) ? 'Ver no corpo inteiro' : 'Ver o órgão no corpo inteiro'}
          </button>
        </div>
        {editor && (
          <div className="organ-editor">
            <strong>Editor de marcadores</strong>
            <p>Ative “Posicionar”, clique sobre o modelo e dê um nome ao ponto. Depois copie a lista e mande para o desenvolvedor.</p>
            <div className="organ-chips">
              <button className="pill" aria-pressed={placing} onClick={() => setPlacing(p => !p)}><Plus size={14} /> Posicionar</button>
              <button className="pill" disabled={!drafts.length} onClick={() => {
                const text = JSON.stringify(drafts.map((x, i) => ({id: `m${i + 1}`, name: x.name, p: x.p, concept: ''})), null, 1);
                void navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
              }}><Copy size={14} /> {copied ? 'Copiado!' : `Copiar (${drafts.length})`}</button>
            </div>
            {pending && (
              <form className="organ-draft" onSubmit={e => { e.preventDefault(); setDrafts(d => [...d, {name: draftName.trim() || `Marcador ${d.length + 1}`, p: pending}]); setPending(null); }}>
                <input autoFocus value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="Nome da estrutura" aria-label="Nome da estrutura" maxLength={60} />
                <button className="pill" type="submit">Salvar</button>
                <button className="pill" type="button" onClick={() => setPending(null)}>Cancelar</button>
              </form>
            )}
            {drafts.length > 0 && (
              <ol className="organ-drafts">
                {drafts.map((x, i) => <li key={i}><span>+{i + 1} {x.name}</span><button onClick={() => setDrafts(d => d.filter((_, j) => j !== i))} aria-label={`Remover ${x.name}`}>remover</button></li>)}
              </ol>
            )}
          </div>
        )}
        <p className="organ-credit">
          Modelo 3D: “<a href={model.credit.source} target="_blank" rel="noreferrer">{model.credit.title}</a>”, por <a href={model.credit.authorUrl} target="_blank" rel="noreferrer">{model.credit.author}</a> (Sketchfab), licença <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.
        </p>
      </div>
      <div className="organ-stage" ref={stage}>
        <div className={`hot-layer${mode === 'quiz' ? ' quiz' : ''}`} hidden={status !== 'ready'}>
          {model.hotspots.map((h, i) => (
            <button
              key={h.id}
              ref={b => { if (b) dots.current.set(h.id, b); else dots.current.delete(h.id); }}
              className={`hot${h.id === selected ? ' sel' : ''}${labelShown(mode, h.id, selected, revealed) ? ' show' : ''}`}
              onClick={() => clickDot(h)}
              aria-label={nameHidden(h) ? `Estrutura ${i + 1}` : `${i + 1}. ${h.name}`}
            >
              <span className="dot">{i + 1}</span>
              <span className="lbl">{h.name}</span>
            </button>
          ))}
          {drafts.map((x, i) => (
            <button key={`draft-${i}`} ref={b => { if (b) dots.current.set(`draft-${i}`, b); else dots.current.delete(`draft-${i}`); }} className="hot draft show">
              <span className="dot">+{i + 1}</span><span className="lbl">{x.name}</span>
            </button>
          ))}
        </div>
        {status !== 'ready' && <div className="organ-loading">{status === 'loading' ? 'carregando modelo 3D…' : status}</div>}
        <p className="organ-hint">arraste para girar · role para ampliar · dois cliques para voltar</p>
      </div>
    </section>
  );
}
