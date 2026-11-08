import {ORGANS_3D} from '../catalog';
import {HISTOLOGY} from '../histology/histology';
import {Carousel} from './Carousel';
import {OrganIcon} from './OrganIcon';

export type GalleryProps = {
  activeOrgan: string | null;
  onOrgan: (key: string) => void;
  activeHistology: string | null;
  onHistology: (key: string) => void;
};

/**
 * The 3D organs and histology strips. On wide screens they sit in the header as compact chips;
 * on phones they stay in the navigation drawer, where there is room for the big cards.
 */
export function Gallery(props: GalleryProps & {variant: 'header' | 'sidebar'}) {
  const compact = props.variant === 'header';
  const size = compact ? 34 : 56;
  const groups = [
    {
      title: 'Órgãos em 3D',
      count: ORGANS_3D.length,
      cards: ORGANS_3D.map(o => (
        <button key={o.key} className="organ-card" aria-pressed={props.activeOrgan === o.key} onClick={() => props.onOrgan(o.key)}>
          <OrganIcon organ={o.key} size={size} />
          <span>{o.label}</span>
        </button>
      )),
    },
    {
      title: 'Histologia',
      count: HISTOLOGY.length,
      cards: HISTOLOGY.map(h => (
        <button key={h.key} className="organ-card" aria-pressed={props.activeHistology === h.key} onClick={() => props.onHistology(h.key)}>
          <img className="organ-icon histo-thumb" src={h.thumb} width={size} height={size} alt="" aria-hidden="true" draggable={false} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
          <span>{h.label}</span>
        </button>
      )),
    },
  ];

  if (compact) {
    return (
      <nav className="header-gallery" aria-label="Galerias">
        {groups.map(g => (
          <div key={g.title} className="header-group">
            <div className="header-group-title">{g.title}<span className="count">{g.count}</span></div>
            <Carousel label={g.title}>{g.cards}</Carousel>
          </div>
        ))}
      </nav>
    );
  }
  return (
    <div className="mobile-gallery">
      {groups.map(g => (
        <section key={g.title}>
          <div className="section-title"><span>{g.title}</span><span className="count">{g.count}</span></div>
          <Carousel label={g.title}>{g.cards}</Carousel>
        </section>
      ))}
    </div>
  );
}
