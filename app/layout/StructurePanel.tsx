import {Box, Focus, MessageCircle, ScanSearch, X} from 'lucide-react';
import {SYSTEMS, explanation, type Atlas, type Concept} from '../anatomy';
import {REGIONS, regionOf} from '../catalog';
import type {NameIndex} from '../names';

/** Right column when a structure is selected. */
export function StructurePanel(props: {
  atlas: Atlas;
  names: NameIndex | null;
  concept: Concept;
  focus: boolean;
  isolate: boolean;
  onFocus: () => void;
  onIsolate: () => void;
  onAskTutor: (conceptId: string) => void;
  onClose: () => void;
  /** Present when a detailed, textured model exists for this structure. */
  onDetailed?: () => void;
}) {
  const {atlas, names, concept} = props;
  const first = atlas.parts.find(p => p.id === concept.elements[0]);
  const system = SYSTEMS.find(s => s.id === first?.system);
  const region = first ? REGIONS.find(r => r.id === regionOf(first)) : undefined;
  const display = names?.display(concept.id, concept.name) ?? {pt: concept.name, source: 'regra' as const};
  const isGroup = concept.id.startsWith('group-');
  return (
    <div className="structure">
      <div className="structure-head">
        <span className="dot" style={{background: system?.color ?? '#888'}} />
        <span className="section-title" style={{margin: 0}}>{system?.name ?? 'Estrutura'}</span>
        <button className="pill round" style={{marginLeft: 'auto'}} onClick={props.onClose} aria-label="Fechar"><X size={16} /></button>
      </div>
      <h2 className="panel-title">{display.pt}</h2>
      {display.la && <p className="latin">{display.la}</p>}
      {display.source === 'ia' && <span className="ai-badge" title="Nome traduzido automaticamente; pode conter imprecisões.">tradução automática</span>}
      <p className="panel-text">{explanation(concept.name, first?.system ?? 'skeletal')}</p>
      <dl className="facts">
        {region && <><dt>Região</dt><dd>{region.label}</dd></>}
        <dt>Peças no modelo</dt><dd>{concept.elements.length.toLocaleString('pt-BR')}</dd>
        {!isGroup && <><dt>ID FMA</dt><dd className="mono">{concept.id}</dd></>}
        <dt>Nome em inglês</dt><dd>{concept.name}</dd>
      </dl>
      {props.onDetailed && <button className="foot-btn detailed" onClick={props.onDetailed}><Box size={16} /> Ver modelo realista</button>}
      <div className="actions">
        <button className="seg" aria-pressed={props.focus} onClick={props.onFocus}><Focus size={15} /> Focar</button>
        <button className="seg" aria-pressed={props.isolate} onClick={props.onIsolate}><ScanSearch size={15} /> {props.isolate ? 'Mostrar ao redor' : 'Isolar'}</button>
      </div>
      <button className="foot-btn" onClick={() => props.onAskTutor(concept.id)}><MessageCircle size={16} /> Perguntar ao tutor</button>
    </div>
  );
}
