import {useEffect, useRef} from 'react';
import {X} from 'lucide-react';

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
      <p>Coração: “<a href="https://sketchfab.com/3d-models/realistic-human-heart-3f8072336ce94d18b3d0d055a1ece089" target="_blank" rel="noreferrer">Realistic Human Heart</a>”, por <a href="https://sketchfab.com/neshallads" target="_blank" rel="noreferrer">neshallads</a> (Sketchfab), licenciado sob <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Texturas convertidas para JPEG para carregar mais rápido.</p>
      <h3>Nomes em português</h3>
      <p>Rótulos em português e latim do <a href="https://www.wikidata.org" target="_blank" rel="noreferrer">Wikidata</a> (CC0), ligados pelo identificador FMA. Os nomes que faltavam foram traduzidos por IA e aparecem marcados como “tradução automática”.</p>
      <h3>Código</h3>
      <p>Visualizador baseado em <a href="https://github.com/ashemag/human-atlas" target="_blank" rel="noreferrer">human-atlas</a>, © 2026 ashemag, licença MIT.</p>
    </dialog>
  );
}
