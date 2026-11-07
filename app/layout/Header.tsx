import {useEffect, useRef, useState} from 'react';
import {Info, Menu, MessageCircle, MoreHorizontal, PanelRight, RotateCcw, X} from 'lucide-react';

export function Header(props: {onAskTutor: () => void; onReset: () => void; onCredits: () => void; onToggleLeft: () => void; onToggleRight: () => void}) {
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu(false); };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [menu]);
  return (
    <header className="header">
      <button className="pill round mobile-only" onClick={props.onToggleLeft} aria-label="Abrir navegação"><Menu size={18} /></button>
      <div className="brand">
        <div className="brand-mark" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><circle cx="12" cy="5" r="2.5" /><path d="M12 8v7M8 11h8M10 22l2-7 2 7" /></svg></div>
        <div><h1>Atlas do Corpo Humano</h1><small>Biologia · Simulação</small></div>
      </div>
      <div className="header-actions">
        <button className="pill primary" onClick={props.onAskTutor}><MessageCircle size={16} /><span className="hide-sm">Perguntar ao tutor</span></button>
        <div className="menu" ref={ref}>
          <button className="pill round" aria-label="Mais opções" aria-expanded={menu} onClick={() => setMenu(m => !m)}><MoreHorizontal size={18} /></button>
          {menu && (
            <div className="menu-list" role="menu">
              <button role="menuitem" onClick={() => { setMenu(false); props.onCredits(); }}><Info size={14} /> Fonte e créditos</button>
              <button role="menuitem" onClick={() => { setMenu(false); props.onReset(); }}><RotateCcw size={14} /> Recomeçar</button>
            </div>
          )}
        </div>
        <button className="pill round mobile-only" onClick={props.onToggleRight} aria-label="Abrir detalhes"><PanelRight size={18} /></button>
        <button className="pill round hide-sm" onClick={props.onReset} aria-label="Fechar seleção e recomeçar"><X size={18} /></button>
      </div>
    </header>
  );
}
