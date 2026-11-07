import {ArrowRight, Compass, MousePointerClick} from 'lucide-react';
import {ORGANS_3D, type OrganIcon as OrganKey} from '../catalog';
import {OrganIcon} from './OrganIcon';

const FEATURED: OrganKey[] = ['heart', 'brain', 'liver'];

/** Right column when nothing is selected. */
export function RightPanel(props: {onOrgan: (key: OrganKey) => void; onTours: () => void}) {
  return (
    <>
      <div>
        <div className="section-title" style={{margin: '0 0 8px'}}><span>Explore a anatomia</span></div>
        <h2 className="panel-title">Veja você mais de perto.</h2>
        <p className="panel-text">Dos sistemas completos às menores estruturas. Descubra como o corpo humano se encaixa.</p>
      </div>
      <div className="list-card">
        {FEATURED.map(key => {
          const organ = ORGANS_3D.find(o => o.key === key)!;
          return (
            <button key={key} className="row feature" onClick={() => props.onOrgan(key)}>
              <OrganIcon organ={key} size={40} />
              <span className="label">{organ.label}</span>
              <ArrowRight size={16} className="muted" />
            </button>
          );
        })}
      </div>
      <button className="foot-btn" onClick={props.onTours}><Compass size={16} /> Explorações guiadas</button>
      <p className="hint"><MousePointerClick size={14} /> Selecione o modelo para examinar uma estrutura. Arraste para girar e role para ampliar.</p>
    </>
  );
}
