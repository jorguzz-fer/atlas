import {forwardRef, useMemo, useState} from 'react';
import {Search} from 'lucide-react';
import type {Atlas, Concept} from '../anatomy';
import {search, type NameIndex} from '../names';

export const SearchBox = forwardRef<HTMLInputElement, {atlas: Atlas | null; names: NameIndex | null; onChoose: (c: Concept) => void}>(
  function SearchBox({atlas, names, onChoose}, ref) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const results = useMemo(() => (atlas && names && query.trim() ? search(names, atlas, query, 40) : []), [atlas, names, query]);
    const pick = (c: Concept) => { onChoose(c); setQuery(''); setOpen(false); (ref as React.RefObject<HTMLInputElement>)?.current?.blur(); };
    return (
      <div className="search">
        <Search size={16} className="icon" />
        <input
          ref={ref}
          value={query}
          placeholder="Encontre uma estrutura…"
          aria-label="Buscar estrutura anatômica"
          role="combobox"
          aria-expanded={open && !!query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
            if (e.key === 'Enter' && results[active]) pick(results[active]);
            if (e.key === 'Escape') { setOpen(false); (e.target as HTMLInputElement).blur(); }
          }}
        />
        <kbd>/</kbd>
        {open && query.trim() && (
          <div className="results" role="listbox">
            {results.length === 0 && <div className="empty">Nenhuma estrutura encontrada.</div>}
            {results.map((c, i) => {
              const d = names!.display(c.id, c.name);
              return (
                <button key={c.id} role="option" aria-selected={i === active} onMouseDown={e => e.preventDefault()} onClick={() => pick(c)}>
                  <span>{d.pt}</span>
                  <span className="en">{d.la ?? c.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  },
);
