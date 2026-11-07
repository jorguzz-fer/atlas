import type {Atlas, Concept} from './anatomy';

export type NameSource = 'wikidata' | 'ia' | 'regra' | 'manual';
export type NameEntry = {pt: string; la?: string; source: NameSource; gender?: 'm' | 'f'};
export type Override = {pt: string; la?: string; gender?: 'm' | 'f'};
export type DisplayName = {pt: string; la?: string; source: NameSource};

export interface NameIndex {
  display(id: string, englishName: string): DisplayName;
}

const SIDE = /^(left|right)\s+(.+)$/i;
const SUFFIX = {left: {m: 'esquerdo', f: 'esquerda'}, right: {m: 'direito', f: 'direita'}} as const;

export function normalizeForSearch(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export function createNameIndex(
  atlas: Atlas,
  entries: Record<string, NameEntry>,
  overrides: Record<string, Override>,
): NameIndex {
  const idByEnglish = new Map(atlas.concepts.map(c => [c.name.toLowerCase(), c.id]));
  const lookup = (id: string): (NameEntry | (Override & {source: 'manual'})) | undefined => {
    const o = overrides[id];
    return o ? {...o, source: 'manual'} : entries[id];
  };
  return {
    display(id, englishName) {
      const direct = lookup(id);
      if (direct) return {pt: direct.pt, la: direct.la, source: direct.source};
      const m = SIDE.exec(englishName);
      if (m) {
        const baseId = idByEnglish.get(m[2].toLowerCase());
        const base = baseId ? lookup(baseId) : undefined;
        if (base) {
          const side = m[1].toLowerCase() as 'left' | 'right';
          return {pt: `${base.pt} ${SUFFIX[side][base.gender ?? 'm']}`, la: undefined, source: 'regra'};
        }
      }
      return {pt: englishName, la: undefined, source: 'regra'};
    },
  };
}

export function search(index: NameIndex, atlas: Atlas, q: string, limit = 30): Concept[] {
  const query = normalizeForSearch(q);
  if (!query) return [];
  const ranked: {c: Concept; rank: number}[] = [];
  for (const c of atlas.concepts) {
    const d = index.display(c.id, c.name);
    const fields = [d.pt, d.la ?? '', c.name, c.id].map(normalizeForSearch);
    if (fields.some(f => f.startsWith(query))) ranked.push({c, rank: 0});
    else if (fields.some(f => f.includes(query))) ranked.push({c, rank: 1});
  }
  return ranked.sort((a, b) => a.rank - b.rank || a.c.name.length - b.c.name.length).slice(0, limit).map(r => r.c);
}

export async function loadNames(atlas: Atlas): Promise<NameIndex> {
  const get = async (url: string) => {
    try {
      const res = await fetch(url);
      return res.ok ? await res.json() : {};
    } catch {
      return {};
    }
  };
  const [entries, overrides] = await Promise.all([get('/data/names.pt.json'), get('/data/names.overrides.json')]);
  return createNameIndex(atlas, entries, overrides);
}
