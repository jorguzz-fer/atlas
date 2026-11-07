import {useMemo, type RefObject} from 'react';
import {Bone, Dumbbell, Eye, EyeOff, GraduationCap, Info, Layers, PersonStanding, Sparkles} from 'lucide-react';
import {SYSTEMS, type Atlas, type Concept, type SceneState, type SystemId} from '../anatomy';
import {LAYERS, ORGANS_3D, QUICK_VIEWS, REGIONS, regionOf, type QuickViewId, type RegionId} from '../catalog';
import type {NameIndex} from '../names';
import {OrganIcon} from './OrganIcon';
import {SearchBox} from './SearchBox';

export type BrowseTab = 'regions' | 'systems' | 'layers';

const QUICK_ICONS: Record<QuickViewId, typeof Bone> = {organs: Sparkles, skeleton: Bone, muscles: Dumbbell, all: PersonStanding};

export function LeftSidebar(props: {
  atlas: Atlas | null;
  names: NameIndex | null;
  state: SceneState;
  searchRef: RefObject<HTMLInputElement | null>;
  tab: BrowseTab;
  region: RegionId | null;
  activeOrgan: string | null;
  onTab: (t: BrowseTab) => void;
  onRegion: (r: RegionId) => void;
  onChoose: (c: Concept) => void;
  onOrgan: (key: string) => void;
  onQuickView: (visible: SystemId[]) => void;
  onToggleSystem: (id: SystemId) => void;
  onLayer: (layer: keyof SceneState['layers'], value: number) => void;
  onToggleLabels: () => void;
  onLearn: () => void;
  onCredits: () => void;
}) {
  const {atlas, names, state} = props;
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    atlas?.parts.forEach(p => { c[p.system] = (c[p.system] ?? 0) + 1; });
    return c;
  }, [atlas]);
  const systems = SYSTEMS.filter(s => counts[s.id] && s.id !== 'integumentary');

  // Concepts that sit entirely inside the chosen region, largest first.
  const regionConcepts = useMemo(() => {
    if (!atlas || !props.region) return [];
    const regionOfPart = new Map(atlas.parts.map(p => [p.id, regionOf(p)]));
    return atlas.concepts
      .filter(c => c.elements.length > 0 && c.elements.every(id => regionOfPart.get(id) === props.region))
      .sort((a, b) => b.elements.length - a.elements.length)
      .slice(0, 60);
  }, [atlas, props.region]);

  const sameSet = (a: SystemId[], b: SystemId[]) => a.length === b.length && a.every(x => b.includes(x));

  return (
    <>
      <div className="left-scroll">
        <SearchBox ref={props.searchRef} atlas={atlas} names={names} onChoose={props.onChoose} />

        <section>
          <div className="section-title"><span>Órgãos em 3D</span><span className="count">{ORGANS_3D.length}</span></div>
          <div className="carousel">
            {ORGANS_3D.map(o => (
              <button key={o.key} className="organ-card" aria-pressed={props.activeOrgan === o.key} onClick={() => props.onOrgan(o.key)}>
                <OrganIcon organ={o.key} />
                <span>{o.label}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="tabs" role="tablist" aria-label="Navegar por">
          {([['regions', 'Regiões'], ['systems', 'Sistemas'], ['layers', 'Camadas']] as const).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={props.tab === id} onClick={() => props.onTab(id)}>{label}</button>
          ))}
        </div>

        {props.tab === 'systems' && (
          <>
            <section>
              <div className="section-title"><span>Visualizações rápidas</span></div>
              <div className="list-card">
                {QUICK_VIEWS.map(v => {
                  const Icon = QUICK_ICONS[v.id];
                  return (
                    <button key={v.id} className="row" aria-pressed={sameSet(state.visible, v.visible)} onClick={() => props.onQuickView(v.visible)}>
                      <span className="badge-icon"><Icon size={18} /></span>
                      <span className="label">{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
            <section>
              <div className="section-title"><span>Sistemas</span><span className="count">{systems.length}</span></div>
              <div className="list-card">
                {systems.map(s => {
                  const on = state.visible.includes(s.id);
                  return (
                    <div key={s.id} className={`row ${on ? '' : 'off'}`}>
                      <span className="dot" style={{background: s.color}} />
                      <span className="label">{s.name}</span>
                      <span className="num">{counts[s.id]}</span>
                      <button className="eye" onClick={() => props.onToggleSystem(s.id)} aria-label={`${on ? 'Ocultar' : 'Mostrar'} ${s.name}`} aria-pressed={on}>
                        {on ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {props.tab === 'regions' && (
          <section>
            <div className="list-card">
              {REGIONS.map(r => (
                <button key={r.id} className="row" aria-pressed={props.region === r.id} onClick={() => props.onRegion(r.id)}>
                  <span className="label">{r.label}</span>
                </button>
              ))}
            </div>
            {props.region && (
              <>
                <div className="section-title" style={{marginTop: 14}}><span>Estruturas da região</span><span className="count">{regionConcepts.length}</span></div>
                <div className="list-card concept-list">
                  {regionConcepts.map(c => (
                    <button key={c.id} className="row" onClick={() => props.onChoose(c)}>
                      <span className="label">{names?.display(c.id, c.name).pt ?? c.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {props.tab === 'layers' && (
          <section>
            <div className="section-title"><span>Transparência por camada</span></div>
            <div className="list-card">
              {LAYERS.map(l => (
                <div key={l.id} className="slider-row">
                  <header><label htmlFor={`layer-${l.id}`}>{l.label}</label><output>{Math.round(state.layers[l.id] * 100)}%</output></header>
                  <input id={`layer-${l.id}`} type="range" min={0} max={100} value={Math.round(state.layers[l.id] * 100)} onChange={e => props.onLayer(l.id, Number(e.target.value) / 100)} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="left-foot">
        <button className="foot-btn" onClick={props.onLearn}><GraduationCap size={17} /> Aprender</button>
        <button className="foot-link" aria-pressed={state.labels} onClick={props.onToggleLabels}><Layers size={14} /> Rótulos inteligentes</button>
        <button className="foot-link" onClick={props.onCredits}><Info size={14} /> Fonte e créditos</button>
      </div>
    </>
  );
}
