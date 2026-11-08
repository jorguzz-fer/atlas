import {flushSync} from 'react-dom';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {registerAtlasTools} from './agent-tools';
import AnatomyScene, {type LabelTarget} from './scene';
import {DEFAULT_VISIBLE, type Atlas, type Concept, type SceneState, type SystemId, type View} from './anatomy';
import {ORGANS_3D, conceptsByName, correctAtlas, type RegionId} from './catalog';
import {loadNames, type NameIndex} from './names';
import type {ScreenLabel} from './scene-labels';
import {AppShell} from './layout/AppShell';
import {Header} from './layout/Header';
import {LeftSidebar, type BrowseTab} from './layout/LeftSidebar';
import {CenterOverlays} from './layout/CenterOverlays';
import {BottomBar} from './layout/BottomBar';
import {RightPanel} from './layout/RightPanel';
import {StructurePanel} from './layout/StructurePanel';
import {CreditsDialog} from './layout/CreditsDialog';
import {tourReducer, type Tour, type TourState} from './learn/tour';
import {checkAnswer, quizReducer, shuffled, type QuizItem, type QuizState} from './learn/quiz';
import {QuizCard, TourCard, TourPicker} from './learn/LearnOverlay';
import {TutorDrawer} from './tutor/TutorDrawer';
import {OrganViewer} from './organs/OrganViewer';
import {ORGAN_MODELS, organModelFor} from './organs/organ-models';
import {histologyItemFor, tutorId} from './histology/histology';
import {SketchfabViewer} from './histology/SketchfabViewer';

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
  const [credits, setCredits] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [organView, setOrganView] = useState<string | null>(null);
  const [histoView, setHistoView] = useState<string | null>(null);
  /** Tutor context outside the body atlas (a histology model); wins over the selected structure. */
  const [tutorTopic, setTutorTopic] = useState<{id: string; name: string} | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [tourPicker, setTourPicker] = useState(false);
  const [tour, setTour] = useState<TourState | null>(null);
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const quizRef = useRef<QuizState | null>(null);
  quizRef.current = quiz;
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const abort = new AbortController();
    fetch('/models/atlas.json', {signal: abort.signal})
      .then(r => { if (!r.ok) throw new Error('Não foi possível carregar o catálogo de anatomia.'); return r.json(); })
      .then(async (raw: Atlas) => { const data = correctAtlas(raw); setAtlas(data); setNames(await loadNames(data)); })
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    fetch('/data/tours.json').then(r => r.json()).then(setTours).catch(() => {});
    fetch('/data/quiz.json').then(r => r.json()).then(setQuizItems).catch(() => {});
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

  const choose = useCallback((c: Concept, opts: {isolate?: boolean; focus?: boolean} = {}) => {
    setChosen(c);
    setActiveOrgan(null);
    setTutorTopic(null);
    // Focus re-frames the camera on the selection (reset+1 refits to what stays opaque).
    setState(s => ({...s, selected: c.elements, isolate: !!opts.isolate, focus: !!opts.focus, rotate: false, highlight: [], reset: opts.focus ? s.reset + 1 : s.reset}));
    setLeftOpen(false);
    setRightOpen(true);
  }, []);

  const choosePart = useCallback((id: string) => {
    const p = parts.get(id);
    if (!p) return;
    const q = quizRef.current;
    if (q && !q.finished && atlas) {
      const item = q.items[q.index];
      const result = checkAnswer(item, id, atlas);
      setQuiz(prev => quizReducer(prev, {type: 'answer', result}));
      if (result === 'correct') { const c = atlas.concepts.find(x => x.name === item.concept); if (c) choose(c, {focus: true}); }
      return;
    }
    choose(conceptById.get(p.conceptId) ?? {id: p.conceptId, name: p.name, elements: [id]});
  }, [parts, conceptById, choose, atlas]);

  // A single-concept organ keeps its real atlas concept (Portuguese name, FMA id, explanation);
  // a pair like the lungs becomes a group named in Portuguese.
  const organConcept = (key: string): Concept | null => {
    const group = organGroups.find(o => o.key === key);
    if (!group || !atlas) return null;
    const single = group.concepts.length === 1 ? atlas.concepts.find(c => c.name === group.concepts[0]) : undefined;
    return single ?? {...group.concept, name: group.label};
  };
  const chooseOrgan = (key: string) => {
    const c = organConcept(key);
    if (!c) return;
    // The header strip stays clickable over the viewers, so an organ closes them first.
    setHistoView(null);
    setOrganView(null);
    choose(c, {isolate: true});
    setActiveOrgan(key);
  };

  useEffect(() => { if (atlas) return registerAtlasTools(atlas, c => flushSync(() => choose(c))); }, [atlas, choose]);

  const conceptByName = (n: string) => atlas?.concepts.find(c => c.name === n);

  // Each tour step selects its structure and frames it.
  useEffect(() => {
    if (!tour) return;
    const c = conceptByName(tour.tour.steps[tour.step].concept);
    if (c) choose(c, {focus: true});
  }, [tour]);

  const clearSelection = () => { setChosen(null); setActiveOrgan(null); setState(s => ({...s, selected: [], isolate: false, focus: false, reset: s.reset + 1})); };
  const startQuiz = () => { setTour(null); setTourPicker(false); clearSelection(); setQuiz(quizReducer(null, {type: 'start', items: shuffled(quizItems)})); };
  const exitQuiz = () => { setQuiz(null); clearSelection(); };
  const exitTour = () => { setTour(null); clearSelection(); };

  const learnOverlay = quiz ? (
    <QuizCard
      state={quiz}
      askedName={(() => { const c = conceptByName(quiz.items[quiz.index]?.concept ?? ''); return c ? nameOfConcept(c) : ''; })()}
      onReveal={() => { const c = conceptByName(quiz.items[quiz.index].concept); if (c) choose(c, {focus: true}); setQuiz(q => quizReducer(q, {type: 'reveal'})); }}
      onNext={() => { setQuiz(q => quizReducer(q, {type: 'next'})); clearSelection(); }}
      onExit={exitQuiz}
    />
  ) : tour ? (
    <TourCard
      state={tour}
      stepName={(() => { const c = conceptByName(tour.tour.steps[tour.step].concept); return c ? nameOfConcept(c) : ''; })()}
      onPrev={() => setTour(t => t && tourReducer(t, 'prev'))}
      onNext={() => setTour(t => t && tourReducer(t, 'next'))}
      onExit={exitTour}
    />
  ) : tourPicker ? (
    <TourPicker tours={tours} onPick={t => { setQuiz(null); setTourPicker(false); setTour({tour: t, step: 0}); }} onClose={() => setTourPicker(false)} />
  ) : null;

  const labelTargets = useMemo<LabelTarget[]>(() => {
    // Organ labels only when the organs can actually be seen (muscles hidden or see-through).
    const organsExposed = !state.visible.includes('muscular') || state.layers.muscles < 0.5;
    const t: LabelTarget[] = organsExposed ? organGroups.map(o => ({id: o.key, parts: o.concept.elements})) : [];
    if (chosen && !organGroups.some(o => o.concept.id === chosen.id || (o.concepts.length === 1 && o.concepts[0] === chosen.name))) t.push({id: `chosen:${chosen.id}`, parts: chosen.elements});
    return t;
  }, [organGroups, chosen, state.visible, state.layers.muscles]);

  const labelText = (id: string) => {
    if (id.startsWith('chosen:') && chosen) return nameOfConcept(chosen);
    return organGroups.find(o => o.key === id)?.label ?? id;
  };
  const onLabelClick = (id: string) => {
    if (id.startsWith('chosen:')) return;
    const c = organConcept(id);
    if (c) choose(c);
  };

  const resetAll = () => {
    setState(s => ({...initial, reset: s.reset + 1}));
    setChosen(null);
    setActiveOrgan(null);
    setRegion(null);
  };

  const openHistology = (key: string) => { setOrganView(null); setHistoView(key); setLeftOpen(false); };

  const header = (
    <Header
      onAskTutor={() => { setTutorOpen(o => !o); setLeftOpen(false); }}
      onReset={resetAll}
      onCredits={() => setCredits(true)}
      onToggleLeft={() => { setLeftOpen(o => !o); setRightOpen(false); }}
      onToggleRight={() => { setRightOpen(o => !o); setLeftOpen(false); }}
      activeOrgan={activeOrgan}
      onOrgan={chooseOrgan}
      activeHistology={histoView}
      onHistology={openHistology}
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
      activeHistology={histoView}
      onHistology={openHistology}
      onQuickView={(visible: SystemId[]) => setState(s => ({...s, visible, selected: [], isolate: false, focus: false, highlight: []}))}
      onToggleSystem={id => setState(s => ({...s, visible: s.visible.includes(id) ? s.visible.filter(x => x !== id) : [...s.visible, id]}))}
      onLayer={(layer, value) => setState(s => ({...s, layers: {...s.layers, [layer]: value}}))}
      onToggleLabels={() => setState(s => ({...s, labels: !s.labels}))}
      onLearn={startQuiz}
      onCredits={() => setCredits(true)}
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
      {learnOverlay}
      <BottomBar
        view={state.view}
        explode={state.explode}
        onView={(v: View) => setState(s => ({...s, view: v, reset: s.reset + 1, rotate: false}))}
        onExplode={amount => setState(s => ({...s, explode: amount, view: amount > 0.8 ? 'front' : s.view, rotate: false}))}
      />
    </>
  );

  const detailedModel = organModelFor(activeOrgan) ?? ORGAN_MODELS.find(m => !!chosen && m.bodyConcepts.includes(chosen.name));
  const openModel = organModelFor(organView);
  const openHisto = histologyItemFor(histoView);
  const askHistology = (h: {id: string; name: string} | null) => {
    if (!openHisto) return;
    const marker = h && openHisto.hotspots.find(x => x.id === h.id);
    setTutorTopic({id: tutorId(openHisto, marker ?? undefined), name: marker ? `${marker.name} (${openHisto.label})` : openHisto.title});
    setTutorOpen(true);
  };

  const right = chosen && atlas ? (
    <StructurePanel
      atlas={atlas}
      names={names}
      concept={chosen}
      focus={state.focus}
      isolate={state.isolate}
      onFocus={() => setState(s => ({...s, focus: !s.focus, isolate: false}))}
      onIsolate={() => setState(s => ({...s, isolate: !s.isolate, focus: false, explode: 0}))}
      onAskTutor={() => { setTutorOpen(true); setLeftOpen(false); }}
      onDetailed={detailedModel ? () => { setHistoView(null); setOrganView(detailedModel.key); } : undefined}
      onClose={() => { setChosen(null); setActiveOrgan(null); setState(s => ({...s, selected: [], isolate: false, focus: false})); }}
    />
  ) : (
    <RightPanel onOrgan={chooseOrgan} onTours={() => { setQuiz(null); setTourPicker(true); }} />
  );

  return (
    <>
      <AppShell
        header={header} left={left} center={center} right={right} leftOpen={leftOpen} rightOpen={rightOpen}
        drawer={
          <TutorDrawer
            open={tutorOpen}
            onClose={() => { setTutorOpen(false); setState(s => ({...s, highlight: []})); }}
            selected={tutorTopic ?? (chosen ? {id: chosen.id.startsWith('group-') ? chosen.elements[0] : chosen.id, name: nameOfConcept(chosen)} : null)}
            onHighlight={ids => setState(s => ({...s, highlight: ids, isolate: false, explode: 0}))}
          />
        }
      />
      {openModel && (
        <OrganViewer
          model={openModel}
          onClose={() => setOrganView(null)}
          onAskTutor={h => { const c = h.concept ? conceptByName(h.concept) : organConcept(openModel.key); if (c) choose(c); setTutorOpen(true); }}
          onShowInBody={h => {
            setOrganView(null);
            const c = h?.concept && conceptByName(h.concept);
            if (c) choose(c, {focus: true}); else chooseOrgan(openModel.key);
          }}
        />
      )}
      {openHisto && (openHisto.kind === 'sketchfab'
        ? <SketchfabViewer key={openHisto.key} item={openHisto} onClose={() => setHistoView(null)} onAskTutor={askHistology} />
        : <OrganViewer key={openHisto.key} model={openHisto} backLabel="Voltar ao atlas" onClose={() => setHistoView(null)} onAskTutor={askHistology} />)}
      <CreditsDialog open={credits} onClose={() => setCredits(false)} />
    </>
  );
}
