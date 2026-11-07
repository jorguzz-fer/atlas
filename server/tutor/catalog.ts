import fs from 'node:fs';
import path from 'node:path';
import type {Atlas} from '../../app/anatomy';
import {SYSTEMS} from '../../app/anatomy';
import {REGIONS, correctAtlas, regionOf} from '../../app/catalog';
import {createNameIndex, search, type NameIndex} from '../../app/names';

export type StructureInfo = {id: string; pt: string; en: string; la?: string; sistema?: string; regiao?: string; pecas: number};

export interface Catalog {
  find(query: string, limit?: number): {id: string; pt: string; en: string}[];
  describe(id: string): StructureInfo | null;
  /** Maps concept ids (FMA…) or part ids (FJ…) to part ids; unknown ids are reported back. */
  resolve(ids: string[]): {parts: string[]; accepted: string[]; rejected: string[]};
}

export function createCatalog(atlas: Atlas, names: NameIndex): Catalog {
  const parts = new Map(atlas.parts.map(p => [p.id, p]));
  const concepts = new Map(atlas.concepts.map(c => [c.id, c]));
  return {
    find(query, limit = 15) {
      return search(names, atlas, query, limit).map(c => ({id: c.id, pt: names.display(c.id, c.name).pt, en: c.name}));
    },
    describe(id) {
      const concept = concepts.get(id);
      const part = parts.get(id);
      const ref = concept ?? (part && concepts.get(part.conceptId));
      if (!ref && !part) return null;
      const first = parts.get(ref?.elements[0] ?? id) ?? part;
      const d = names.display(ref?.id ?? part!.conceptId, ref?.name ?? part!.name);
      return {
        id: ref?.id ?? id,
        pt: d.pt,
        en: ref?.name ?? part!.name,
        la: d.la,
        sistema: SYSTEMS.find(s => s.id === first?.system)?.name,
        regiao: first ? REGIONS.find(r => r.id === regionOf(first))?.label : undefined,
        pecas: ref?.elements.length ?? 1,
      };
    },
    resolve(ids) {
      const out = new Set<string>(), accepted: string[] = [], rejected: string[] = [];
      for (const id of ids) {
        if (parts.has(id)) { out.add(id); accepted.push(id); }
        else if (concepts.has(id)) { concepts.get(id)!.elements.forEach(e => out.add(e)); accepted.push(id); }
        else rejected.push(id);
      }
      return {parts: [...out], accepted, rejected};
    },
  };
}

/** Loads atlas.json and the Portuguese names from the built site (or public/ in development). */
export function loadCatalog(root: string): Catalog {
  const read = (rel: string) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
  const atlas = correctAtlas(read('models/atlas.json'));
  const entries = fs.existsSync(path.join(root, 'data/names.pt.json')) ? read('data/names.pt.json') : {};
  const overrides = fs.existsSync(path.join(root, 'data/names.overrides.json')) ? read('data/names.overrides.json') : {};
  return createCatalog(atlas, createNameIndex(atlas, entries, overrides));
}
