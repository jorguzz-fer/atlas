import {flushSync} from 'react-dom';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {registerAtlasTools} from './agent-tools';
import AnatomyScene, {type LabelTarget} from './scene';
import {DEFAULT_VISIBLE, type Atlas, type Concept, type SceneState, type SystemId, type View} from './anatomy';
import {ORGANS_3D, conceptsByName, type RegionId} from './catalog';
import {loadNames, type NameIndex} from './names';
import type {ScreenLabel} from './scene-labels';
import {AppShell} from './layout/AppShell';
import {Header} from './layout/Header';
import {LeftSidebar, type BrowseTab} from './layout/LeftSidebar';
import {CenterOverlays} from './layout/CenterOverlays';
import {BottomBar} from './layout/BottomBar';

const initial: SceneState = {
  explode: 0, visible: DEFAULT_VISIBLE, selected: [], isolate: false, view: 'perspective', rotate: false, reset: 0,
  focus: false, layers: {muscles: 1, skeleton: 1, organs: 1}, labels: true, highlight: [], zoom: 0,
};

export default function Home() {
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [names, setNames] = useState<NameIndex | null>(null);
  const [state, setState] = useState(initial);
  const [chosen, setChosen] = useState<Concept | null>(null);
  const [tab, setTab] = useState<BrowseTab>('systems');
  const [region, setRegion] = useState<RegionId | null>(null);
  const [activeOrgan, setActiveOrgan] = useState<string | null>(null);
  const [labels, setLabels] = useState<ScreenLabel[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const abort = new AbortController();
    fetch('/models/atlas.json', {signal: abort.signal})
      .then(r => { if (!r.ok) throw new Error('Não foi possível carregar o catálogo de anatomia.'); return r.json(); })
      .then(async (data: Atlas) => { setAtlas(data); setNames(await loadNames(data)); })
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => abort.abort();
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setLeftOpen(true);
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  const parts = useMemo(() => new Map(atlas?.parts.map(p => [p.id, p])), [atlas]);
  const conceptById = useMemo(() => new Map(atlas?.concepts.map(c => [c.id, c])), [atlas]);
  const organGroups = useMemo(() => (atlas ? ORGANS_3D.map(o => ({...o, concept: conceptsByName(atlas, o.concepts, o.key)})) : []), [atlas]);

  const nameOfConcept = useCallback((c: {id: string; name: string}) => names?.display(c.id, c.name).pt ?? c.name, [names]);
  const nameOf = useCallback((partId: string) => {
    const p = parts.get(partId);
    if (!p) return partId;
    return names?.display(p.conceptId, p.name).pt ?? p.name;
  }, [parts, names]);

  const choose = useCallback((c: Concept, opts: {isolate?: boolean} = {}) => {
    setChosen(c);
    setActiveOrgan(null);
    setState(s => ({...s, selected: c.elements, isolate: !!opts.isolate, focus: false, rotate: false, highlight: []}));
    setLeftOpen(false);
    setRightOpen(true);
  }, []);

  const choosePart = useCallback((id: string) => {
    const p = parts.get(id);
    if (!p) return;
    choose(conceptById.get(p.conceptId) ?? {id: p.conceptId, name: p.name, elements: [id]});
  }, [parts, conceptById, choose]);

  const chooseOrgan = (key: string) => {
    const group = organGroups.find(o => o.key === key);
    if (!group) return;
    choose(group.concept, {isolate: true});
    setActiveOrgan(key);
  };

  useEffect(() => { if (atlas) return registerAtlasTools(atlas, c => flushSync(() => choose(c))); }, [atlas, choose]);

  const labelTargets = useMemo<LabelTarget[]>(() => {
    // Organ labels only when the organs can actually be seen (muscles hidden or see-through).
    const organsExposed = !state.visible.includes('muscular') || state.layers.muscles < 0.5;
    const t: LabelTarget[] = organsExposed ? organGroups.map(o => ({id: o.key, parts: o.concept.elements})) : [];
    if (chosen && !organGroups.some(o => o.concept.id === chosen.id)) t.push({id: `chosen:${chosen.id}`, parts: chosen.elements});
    return t;
  }, [organGroups, chosen, state.visible, state.layers.muscles]);

  const labelText = (id: string) => {
    if (id.startsWith('chosen:') && chosen) return nameOfConcept(chosen);
    return organGroups.find(o => o.key === id)?.label ?? id;
  };
  const onLabelClick = (id: string) => {
    if (id.startsWith('chosen:')) return;
    const group = organGroups.find(o => o.key === id);
    if (group) choose(group.concept);
  };

  const resetAll = () => {
    setState(s => ({...initial, reset: s.reset + 1}));
    setChosen(null);
    setActiveOrgan(null);
    setRegion(null);
  };

  const header = (
    <Header
      onAskTutor={() => setRightOpen(true)}
      onReset={resetAll}
      onCredits={() => {}}
      onToggleLeft={() => { setLeftOpen(o => !o); setRightOpen(false); }}
      onToggleRight={() => { setRightOpen(o => !o); setLeftOpen(false); }}
    />
  );

  const left = (
    <LeftSidebar
      atlas={atlas}
      names={names}
      state={state}
      searchRef={searchRef}
      tab={tab}
      region={region}
      activeOrgan={activeOrgan}
      onTab={setTab}
      onRegion={setRegion}
      onChoose={c => choose(c)}
      onOrgan={chooseOrgan}
      onQuickView={(visible: SystemId[]) => setState(s => ({...s, visible, selected: [], isolate: false, focus: false, highlight: []}))}
      onToggleSystem={id => setState(s => ({...s, visible: s.visible.includes(id) ? s.visible.filter(x => x !== id) : [...s.visible, id]}))}
      onLayer={(layer, value) => setState(s => ({...s, layers: {...s.layers, [layer]: value}}))}
      onToggleLabels={() => setState(s => ({...s, labels: !s.labels}))}
      onLearn={() => {}}
      onCredits={() => {}}
    />
  );

  const center = (
    <>
      {atlas && (
        <AnatomyScene
          atlas={atlas}
          state={state}
          onSelect={choosePart}
          onProgress={n => { setProgress(n); if (n === 100) setError(''); }}
          onError={setError}
          nameOf={nameOf}
          labelTargets={labelTargets}
          onVisibleCount={setVisibleCount}
          onLabels={setLabels}
        />
      )}
      <CenterOverlays
        visibleCount={visibleCount}
        view={state.view}
        labels={labels}
        labelText={labelText}
        onLabelClick={onLabelClick}
        onZoom={step => setState(s => ({...s, zoom: s.zoom + step}))}
        onResetView={() => setState(s => ({...s, reset: s.reset + 1}))}
        progress={progress}
        error={error}
      />
      <BottomBar
        view={state.view}
        explode={state.explode}
        onView={(v: View) => setState(s => ({...s, view: v, reset: s.reset + 1, rotate: false}))}
        onExplode={amount => setState(s => ({...s, explode: amount, view: amount > 0.8 ? 'front' : s.view, rotate: false}))}
      />
    </>
  );

  return <AppShell header={header} left={left} center={center} right={<div />} leftOpen={leftOpen} rightOpen={rightOpen} />;
}
