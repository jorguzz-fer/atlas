import type {Atlas, Concept, Part, SystemId} from './anatomy';

export type RegionId = 'head' | 'chest' | 'abdomen' | 'arms' | 'legs';
export const REGIONS: {id: RegionId; label: string}[] = [
  {id: 'head', label: 'Cabeça e pescoço'},
  {id: 'chest', label: 'Tórax'},
  {id: 'abdomen', label: 'Abdome e pelve'},
  {id: 'arms', label: 'Membros superiores'},
  {id: 'legs', label: 'Membros inferiores'},
];

/** Region from the centre of the part's bounding box (metres, Y up, body centred on x = 0). */
export function regionOf(part: Part): RegionId {
  const [min, max] = part.bounds;
  const x = Math.abs((min[0] + max[0]) / 2);
  const y = (min[1] + max[1]) / 2;
  if (y > 1.45) return 'head';
  if (y < 0.79) return 'legs';
  if (x > 0.175) return 'arms';
  if (y > 1.245) return 'chest';
  return 'abdomen';
}

export type LayerId = 'muscles' | 'skeleton' | 'organs';
export const LAYERS: {id: LayerId; label: string}[] = [
  {id: 'muscles', label: 'Músculos'},
  {id: 'skeleton', label: 'Esqueleto'},
  {id: 'organs', label: 'Órgãos e vasos'},
];

export function layerOf(system: SystemId): LayerId {
  if (system === 'muscular' || system === 'connective') return 'muscles';
  if (system === 'skeletal') return 'skeleton';
  return 'organs';
}

const ORGAN_SYSTEMS: SystemId[] = ['cardiac', 'respiratory', 'digestive', 'urinary', 'reproductive', 'endocrine', 'lymphatic', 'nervous', 'sensory'];
const ALL_VISIBLE: SystemId[] = ['skeletal', 'muscular', 'connective', 'cardiac', 'arterial', 'venous', 'nervous', 'respiratory', 'digestive', 'urinary', 'lymphatic', 'endocrine', 'reproductive', 'sensory'];

export type QuickViewId = 'organs' | 'skeleton' | 'muscles' | 'all';
export const QUICK_VIEWS: {id: QuickViewId; label: string; visible: SystemId[]}[] = [
  {id: 'organs', label: 'Órgãos', visible: ORGAN_SYSTEMS},
  {id: 'skeleton', label: 'Esqueleto', visible: ['skeletal']},
  {id: 'muscles', label: 'Músculos', visible: ['muscular', 'connective', 'skeletal']},
  {id: 'all', label: 'Todos os sistemas', visible: ALL_VISIBLE},
];

export type OrganIcon = 'brain' | 'lungs' | 'liver' | 'heart' | 'stomach' | 'pancreas' | 'kidneys' | 'small-intestine' | 'large-intestine' | 'eyes';
export const ORGANS_3D: {key: OrganIcon; label: string; concepts: string[]}[] = [
  {key: 'brain', label: 'Cérebro', concepts: ['brain']},
  {key: 'lungs', label: 'Pulmões', concepts: ['right lung', 'left lung']},
  {key: 'liver', label: 'Fígado', concepts: ['liver']},
  {key: 'heart', label: 'Coração', concepts: ['heart']},
  {key: 'stomach', label: 'Estômago', concepts: ['stomach']},
  {key: 'pancreas', label: 'Pâncreas', concepts: ['pancreas']},
  {key: 'kidneys', label: 'Rins', concepts: ['kidney']},
  {key: 'small-intestine', label: 'Intestino delgado', concepts: ['small intestine']},
  {key: 'large-intestine', label: 'Intestino grosso', concepts: ['large intestine']},
  {key: 'eyes', label: 'Olhos', concepts: ['right eyeball', 'left eyeball']},
];

// BodyParts3D files some structures under the wrong display system. Names and FMA ids stay unchanged;
// only the colour/system grouping is corrected.
const SYSTEM_FIXES: [RegExp, SystemId][] = [
  [/^hepatovenous segment\b/i, 'digestive'],
  [/\b(fibularis|tibialis (anterior|posterior)|subscapularis|levator scapulae|tensor fasciae latae)\b/i, 'muscular'],
  [/\b(iliotibial tract|flexor retinaculum|common tendinous ring)\b/i, 'connective'],
  [/\b(third ventricle|fourth ventricle|lateral ventricle|interventricular foramen|choroid plexus)\b/i, 'nervous'],
];

export function correctSystem(part: Pick<Part, 'name' | 'system'>): SystemId {
  for (const [pattern, system] of SYSTEM_FIXES) if (pattern.test(part.name)) return system;
  return part.system;
}

export function correctAtlas(atlas: Atlas): Atlas {
  return {...atlas, parts: atlas.parts.map(p => ({...p, system: correctSystem(p)}))};
}

/** Joins several atlas concepts (by English name) into one selectable group. */
export function conceptsByName(atlas: Atlas, names: string[], key: string): Concept {
  const elements = new Set<string>();
  for (const name of names) {
    const concept = atlas.concepts.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (!concept) throw new Error(`Conceito ausente no atlas: ${name}`);
    concept.elements.forEach(e => elements.add(e));
  }
  return {id: `group-${key}`, name: names.join(' + '), elements: [...elements]};
}
