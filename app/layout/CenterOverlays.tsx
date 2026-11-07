import {RotateCcw, ZoomIn, ZoomOut} from 'lucide-react';
import type {View} from '../anatomy';
import type {ScreenLabel} from '../scene-labels';

const COMPASS: Record<View, {c: string; l: string; r: string}> = {
  front: {c: 'A', l: 'D', r: 'E'},
  back: {c: 'P', l: 'E', r: 'D'},
  side: {c: 'E', l: 'A', r: 'P'},
  perspective: {c: 'A', l: 'D', r: 'E'},
};

export function CenterOverlays(props: {
  visibleCount: number;
  view: View;
  labels: ScreenLabel[];
  labelText: (id: string) => string;
  onLabelClick: (id: string) => void;
  onZoom: (step: 1 | -1) => void;
  onResetView: () => void;
  progress: number;
  error: string;
}) {
  const compass = COMPASS[props.view];
  return (
    <>
      <div className="labels" aria-hidden={props.labels.length === 0}>
        <svg>
          {props.labels.map(l => (
            <g key={l.id} stroke="#8a8a8a" strokeWidth="1" fill="none">
              <line x1={l.anchorX} y1={l.anchorY} x2={l.x} y2={l.y} />
              <circle cx={l.anchorX} cy={l.anchorY} r="2.5" fill="#d4d4d4" stroke="none" />
            </g>
          ))}
        </svg>
        {props.labels.map(l => (
          <button key={l.id} className={`tag ${l.x < l.anchorX ? 'left' : ''}`} style={{left: l.x, top: l.y}} onClick={() => props.onLabelClick(l.id)}>
            {props.labelText(l.id)}
          </button>
        ))}
      </div>

      <div className="overlay-tl"><span className="chip">Estruturas visíveis: {props.visibleCount.toLocaleString('pt-BR')}</span></div>

      <div className="overlay-tr">
        <button onClick={() => props.onZoom(-1)} aria-label="Afastar"><ZoomOut size={18} /></button>
        <button onClick={() => props.onZoom(1)} aria-label="Aproximar"><ZoomIn size={18} /></button>
        <button onClick={props.onResetView} aria-label="Restaurar enquadramento"><RotateCcw size={17} /></button>
      </div>

      <div className="compass" aria-label="Orientação anatômica">
        <span style={{left: '50%', top: '14%'}}>S</span>
        <span style={{left: '50%', top: '86%'}}>I</span>
        <span style={{left: '14%', top: '50%'}}>{compass.l}</span>
        <span style={{left: '86%', top: '50%'}}>{compass.r}</span>
        <span className="c" style={{left: '50%', top: '50%'}}>{compass.c}</span>
      </div>

      {props.error ? (
        <div className="status error" role="alert">
          <p>{props.error}</p>
          <button className="pill" onClick={() => location.reload()}>Recarregar</button>
        </div>
      ) : props.progress < 100 ? (
        <div className="status" role="status">
          Carregando anatomia… {props.progress}%
          <div className="track"><i style={{width: `${props.progress}%`}} /></div>
        </div>
      ) : null}
    </>
  );
}
