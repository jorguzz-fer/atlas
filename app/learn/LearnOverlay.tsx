import {ChevronLeft, ChevronRight, Eye, X} from 'lucide-react';
import {REGIONS} from '../catalog';
import type {Tour, TourState} from './tour';
import type {QuizState} from './quiz';

const OUTCOME_TEXT = {
  correct: 'Correto!',
  incorrect: 'Não é essa. Tente de novo.',
  revealed: 'Aqui está.',
} as const;

export function TourPicker(props: {tours: Tour[]; onPick: (t: Tour) => void; onClose: () => void}) {
  return (
    <div className="learn-card">
      <header><strong>Explorações guiadas</strong><button className="pill round" onClick={props.onClose} aria-label="Fechar"><X size={15} /></button></header>
      <div className="list-card">
        {props.tours.map(t => (
          <button key={t.id} className="row" onClick={() => props.onPick(t)}>
            <span className="label">{t.title}</span>
            <span className="num">{t.steps.length} passos</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function TourCard(props: {state: TourState; stepName: string; onPrev: () => void; onNext: () => void; onExit: () => void}) {
  const {tour, step} = props.state;
  const last = step === tour.steps.length - 1;
  return (
    <div className="learn-card" role="dialog" aria-label={`Exploração guiada: ${tour.title}`}>
      <header>
        <span className="section-title" style={{margin: 0}}>{tour.title} · {step + 1}/{tour.steps.length}</span>
        <button className="pill round" onClick={props.onExit} aria-label="Sair da exploração"><X size={15} /></button>
      </header>
      <h3>{props.stepName}</h3>
      <p>{tour.steps[step].text}</p>
      <footer>
        <button className="pill" onClick={props.onPrev} disabled={step === 0}><ChevronLeft size={15} /> Anterior</button>
        {last ? <button className="pill primary" onClick={props.onExit}>Concluir</button> : <button className="pill primary" onClick={props.onNext}>Próximo <ChevronRight size={15} /></button>}
      </footer>
    </div>
  );
}

export function QuizCard(props: {state: QuizState; askedName: string; onReveal: () => void; onNext: () => void; onExit: () => void}) {
  const {state} = props;
  if (state.finished) {
    return (
      <div className="learn-card" role="dialog" aria-label="Resultado do quiz">
        <header><strong>Fim do quiz</strong><button className="pill round" onClick={props.onExit} aria-label="Fechar"><X size={15} /></button></header>
        <h3>Você acertou {state.score} de {state.items.length}.</h3>
        <footer><button className="pill primary" onClick={props.onExit}>Voltar ao atlas</button></footer>
      </div>
    );
  }
  const item = state.items[state.index];
  const region = REGIONS.find(r => r.id === item.region)?.label;
  const solved = state.outcome === 'correct' || state.outcome === 'revealed';
  return (
    <div className="learn-card" role="dialog" aria-label="Quiz">
      <header>
        <span className="section-title" style={{margin: 0}}>Aprender · {state.index + 1}/{state.items.length} · {state.score} acertos</span>
        <button className="pill round" onClick={props.onExit} aria-label="Sair do quiz"><X size={15} /></button>
      </header>
      <p className="ask">Clique no modelo para encontrar:</p>
      <h3>{props.askedName}</h3>
      {region && <p className="hint-line">Dica: {region}</p>}
      {state.outcome && <p className={`outcome ${state.outcome}`} role="status">{OUTCOME_TEXT[state.outcome]}</p>}
      <footer>
        {!solved && <button className="pill" onClick={props.onReveal}><Eye size={15} /> Revelar</button>}
        <button className="pill primary" onClick={props.onNext}>{solved ? 'Próxima' : 'Pular'} <ChevronRight size={15} /></button>
      </footer>
    </div>
  );
}
