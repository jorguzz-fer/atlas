// European Portuguese → Brazilian Portuguese for anatomical names.
// Explicit word table: each entry is a whole-word replacement (case-insensitive on the first letter).
const WORDS = [
  ['esófago', 'esôfago'],
  ['fémur', 'fêmur'],
  ['ténue', 'delgado'],
  ['pénis', 'pênis'],
  ['bicípite', 'bíceps'],
  ['tricípite', 'tríceps'],
  ['quadricípite', 'quadríceps'],
  ['aparelho', 'sistema'],
  ['digestivo', 'digestório'],
  ['génio', 'gênio'],
  ['abdómen', 'abdome'],
  ['abdominal', 'abdominal'],
  ['bónus', 'bônus'],
  ['tónsila', 'tonsila'],
  ['amígdala', 'tonsila'],
  ['perónio', 'fíbula'],
  ['peróneo', 'fibular'],
  ['rótula', 'patela'],
  ['omoplata', 'escápula'],
  ['astrágalo', 'tálus'],
  ['cúbito', 'ulna'],
  ['pâncreas', 'pâncreas'],
  ['anatómico', 'anatômico'],
  ['anatómica', 'anatômica'],
  ['endócrino', 'endócrino'],
  ['crânio', 'crânio'],
  ['económico', 'econômico'],
  ['fenómeno', 'fenômeno'],
  ['tibial', 'tibial'],
];

const MAP = new Map(WORDS.map(([from, to]) => [from, to]));

export function normalizePtBr(input) {
  const out = input
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => {
      const lower = word.toLocaleLowerCase('pt-BR');
      const to = MAP.get(lower);
      return to === undefined ? word : to;
    })
    .join(' ')
    // Wikidata labels the human organ ("Coração humano"); in a human atlas the qualifier is noise.
    // Keep it when it is the whole point of the name ("Corpo humano").
    .replace(/^(?!corpo\b)(.+?) human[oa]$/i, '$1');
  return out.charAt(0).toLocaleUpperCase('pt-BR') + out.slice(1);
}

const FEMININE_EXCEPTIONS = new Set(['mão', 'pele', 'veia', 'cartilagem', 'raiz', 'cavidade', 'membrana', 'glândula', 'articulação', 'lâmina', 'parede', 'face', 'margem', 'base', 'ponte', 'medula', 'fossa', 'fáscia', 'túnica', 'bainha', 'porção', 'região', 'cápsula', 'valva', 'válvula', 'falange', 'pelve', 'rede', 'fronte', 'fissura', 'tuba', 'trompa', 'íris', 'córnea', 'retina', 'pleura', 'laringe', 'faringe', 'traqueia', 'bexiga', 'uretra', 'próstata', 'aorta', 'artéria', 'costela', 'vértebra', 'clavícula', 'escápula', 'ulna', 'fíbula', 'tíbia', 'patela', 'mandíbula', 'maxila', 'língua', 'gengiva']);
const MASCULINE_EXCEPTIONS = new Set(['coração', 'pâncreas', 'crânio', 'fêmur', 'úmero', 'rádio', 'cérebro', 'cerebelo', 'músculo', 'nervo', 'osso', 'ligamento', 'tendão', 'ramo', 'tronco', 'plexo', 'lobo', 'segmento', 'dente', 'rim', 'pulmão', 'estômago', 'fígado', 'baço', 'olho', 'esôfago', 'intestino', 'reto', 'ducto', 'canal', 'seio', 'sulco', 'giro', 'núcleo', 'trato', 'ventrículo', 'átrio', 'disco', 'sacro', 'cóccix', 'esterno', 'hioide', 'diafragma', 'sistema', 'conjunto', 'arco', 'ângulo', 'côndilo', 'processo', 'tubérculo', 'forame', 'nó', 'linfonodo', 'pênis', 'testículo', 'ovário', 'útero', 'timo', 'apêndice', 'duodeno', 'jejuno', 'íleo', 'cólon', 'ceco', 'mesentério', 'peritônio', 'tálus', 'calcâneo', 'carpo', 'tarso', 'metacarpo', 'metatarso', 'pé']);

export function guessGender(pt) {
  const first = pt.trim().split(/\s+/)[0].toLocaleLowerCase('pt-BR');
  if (FEMININE_EXCEPTIONS.has(first)) return 'f';
  if (MASCULINE_EXCEPTIONS.has(first)) return 'm';
  if (/(a|ção|são|dade|gem)$/.test(first)) return 'f';
  return 'm';
}
