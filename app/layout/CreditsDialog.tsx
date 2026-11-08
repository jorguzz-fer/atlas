import {useEffect, useRef} from 'react';
import {X} from 'lucide-react';
import {ORGAN_MODELS} from '../organs/organ-models';
import {HISTOLOGY} from '../histology/histology';

export function CreditsDialog(props: {open: boolean; onClose: () => void}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (props.open && !d.open) d.showModal();
    if (!props.open && d.open) d.close();
  }, [props.open]);
  return (
    <dialog ref={ref} className="dialog" onClose={props.onClose} aria-labelledby="credits-title">
      <header><h2 id="credits-title">Fonte e créditos</h2><button className="pill round" onClick={props.onClose} aria-label="Fechar"><X size={16} /></button></header>
      <p className="warn">Ferramenta educacional para estudo pessoal. Não é orientação médica.</p>
      <h3>Dados anatômicos</h3>
      <p>BodyParts3D, © The Database Center for Life Science, licenciado sob <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Mitsuhashi N. et al. (2009) <a href="https://doi.org/10.1093/nar/gkn613" target="_blank" rel="noreferrer">BodyParts3D: 3D structure database for anatomical concepts</a>. Corpo adulto masculino de referência; não representa todas as estruturas nem as variações humanas. Geometria simplificada para a web.</p>
      <p><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">Licença do conjunto de dados</a> · <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noreferrer">Dados originais</a></p>
      <h3>Modelos realistas de órgãos</h3>
      <ul className="credit-list">
        {ORGAN_MODELS.map(m => (
          <li key={m.key}>“<a href={m.credit.source} target="_blank" rel="noreferrer">{m.credit.title}</a>”, por <a href={m.credit.authorUrl} target="_blank" rel="noreferrer">{m.credit.author}</a> (Sketchfab)</li>
        ))}
      </ul>
      <p>Licenciados sob <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Texturas convertidas para JPEG para carregar mais rápido.</p>
      <h3>Histologia</h3>
      <ul className="credit-list">
        {HISTOLOGY.map(h => (
          <li key={h.key}>“<a href={h.credit.source} target="_blank" rel="noreferrer">{h.credit.title}</a>”, por <a href={h.credit.authorUrl} target="_blank" rel="noreferrer">{h.credit.author}</a>, licença <a href={h.credit.license.url} target="_blank" rel="noreferrer">{h.credit.license.label}</a>{h.kind === 'sketchfab' ? ' (incorporado do Sketchfab)' : ''}</li>
        ))}
      </ul>
      <p>Os modelos incorporados são exibidos pelo visualizador do Sketchfab e continuam hospedados lá; precisam de internet.</p>
      <h3>Nomes em português</h3>
      <p>Rótulos em português e latim do <a href="https://www.wikidata.org" target="_blank" rel="noreferrer">Wikidata</a> (CC0), ligados pelo identificador FMA. Os nomes que faltavam foram traduzidos por IA e aparecem marcados como “tradução automática”.</p>
      <h3>Código</h3>
      <p>Visualizador baseado em <a href="https://github.com/ashemag/human-atlas" target="_blank" rel="noreferrer">human-atlas</a>, © 2026 ashemag, licença MIT.</p>
    </dialog>
  );
}
