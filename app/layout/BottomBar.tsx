import {RotateCcw} from 'lucide-react';
import type {View} from '../anatomy';

const VIEWS: {id: View; label: string}[] = [
  {id: 'front', label: 'Frente'},
  {id: 'back', label: 'Costas'},
  {id: 'side', label: 'Lado'},
  {id: 'perspective', label: 'Perspectiva'},
];

export function BottomBar(props: {view: View; explode: number; onView: (v: View) => void; onExplode: (amount: number) => void}) {
  const pct = Math.round(props.explode * 100);
  return (
    <div className="bottom">
      <div className="bottom-row">
        {VIEWS.map(v => (
          <button key={v.id} className="seg" aria-pressed={props.view === v.id} disabled={props.explode > 0.8 && v.id !== 'front'} onClick={() => props.onView(v.id)}>{v.label}</button>
        ))}
        <span className="seg-gap" />
        <button className="seg" aria-pressed={true}>Masculino</button>
        <button className="seg" disabled title="O corpo feminino chega numa próxima versão">Feminino<span className="soon">em breve</span></button>
      </div>
      <div className="explode">
        <div className="explode-main">
          <div className="explode-text"><label htmlFor="explode">Afastar as estruturas</label><output>{pct}%</output></div>
          <input id="explode" type="range" min={0} max={100} value={pct} onChange={e => props.onExplode(Number(e.target.value) / 100)} />
        </div>
        <button className="pill round" onClick={() => props.onExplode(0)} aria-label="Juntar as estruturas"><RotateCcw size={16} /></button>
      </div>
    </div>
  );
}
