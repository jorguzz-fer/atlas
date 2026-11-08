/**
 * Histology: cells and tissues. Hybrid on purpose: a model that can be downloaded (CC BY)
 * opens in our own viewer like the organs; one that can only be embedded opens in the
 * Sketchfab viewer, driven by its Viewer API (markers, quiz, tutor).
 */

type Vec3 = [number, number, number];

/** A numbered marker. For embedded models `p` is in Sketchfab world space; `eye`/`target` frame it when chosen. */
export type HistoHotspot = {id: string; name: string; p: Vec3; eye?: Vec3; target?: Vec3};

export type HistoCredit = {title: string; author: string; authorUrl: string; source: string; license: {label: string; url: string}};

type Common = {
  key: string;
  /** Short name on the strip card. */
  label: string;
  eyebrow: string;
  title: string;
  /** Square picture for the strip card. */
  thumb: string;
  credit: HistoCredit;
  hotspots: HistoHotspot[];
};
export type HistologyItem =
  | (Common & {kind: 'sketchfab'; uid: string})
  | (Common & {kind: 'glb'; url: string; fit?: number; rotation?: Vec3});

const SKETCHFAB_LICENSES = {
  standard: {label: 'Standard (Sketchfab)', url: 'https://sketchfab.com/licenses'},
  editorial: {label: 'Editorial (Sketchfab)', url: 'https://sketchfab.com/licenses'},
};

/** The 32-character model id inside any Sketchfab page link, embed link or embed code. */
export function sketchfabUid(link: string): string | null {
  const m = /sketchfab\.com\/(?:models\/|3d-models\/(?:[a-z0-9-]*-)?)([0-9a-f]{32})/i.exec(link);
  return m ? m[1].toLowerCase() : null;
}

const media = (uid: string, path: string) => `https://media.sketchfab.com/models/${uid}/thumbnails/${path}.jpeg`;
const page = (slug: string, uid: string) => `https://sketchfab.com/3d-models/${slug}-${uid}`;

export const HISTOLOGY: HistologyItem[] = [
  {
    key: 'bacteria', kind: 'sketchfab', uid: '42439edc90cd4d87b8ae322a4dcee8de',
    label: 'Bactéria', eyebrow: 'Célula procariótica', title: 'A célula bacteriana',
    thumb: media('42439edc90cd4d87b8ae322a4dcee8de', '25981028df6b40138a260f84de24df22/46e834372d7b448ba53c7df57ad7d142'),
    credit: {title: 'Bacterial cell structure', author: 'Ebers', authorUrl: 'https://sketchfab.com/Ebers', source: page('bacterial-cell-structure', '42439edc90cd4d87b8ae322a4dcee8de'), license: SKETCHFAB_LICENSES.standard},
    hotspots: [
      {id: 'capsula', name: 'Cápsula', p: [0.549, -0.205, -0.172], eye: [1.696, 0.563, 0.416], target: [0.549, -0.205, -0.172]},
      {id: 'parede', name: 'Parede celular', p: [0.471, -0.262, -0.01], eye: [1.618, 0.506, 0.578], target: [0.471, -0.262, -0.01]},
      {id: 'membrana', name: 'Membrana plasmática', p: [0.425, -0.174, -0.003], eye: [1.572, 0.594, 0.585], target: [0.425, -0.174, -0.003]},
      {id: 'citoplasma', name: 'Citoplasma', p: [-0.157, -0.149, 0.295], eye: [0.99, 0.619, 0.883], target: [-0.157, -0.149, 0.295]},
      {id: 'nucleoide', name: 'Nucleoide (DNA circular)', p: [0.035, -1.035, 0.003], eye: [1.182, -0.267, 0.591], target: [0.035, -1.035, 0.003]},
      {id: 'plasmideo', name: 'Plasmídeo', p: [-0.151, -0.211, -0.126], eye: [0.996, 0.557, 0.462], target: [-0.151, -0.211, -0.126]},
      {id: 'ribossomos', name: 'Ribossomos', p: [-0.072, -0.508, 0.162], eye: [1.075, 0.26, 0.75], target: [-0.072, -0.508, 0.162]},
      {id: 'pili', name: 'Pili (fímbrias)', p: [0.722, -0.614, -0.37], eye: [1.869, 0.154, 0.218], target: [0.722, -0.614, -0.37]},
      {id: 'flagelo', name: 'Flagelo', p: [0.295, 0.533, -0.006], eye: [1.442, 1.301, 0.582], target: [0.295, 0.533, -0.006]},
    ],
  },
  {
    key: 'eukaryotic', kind: 'sketchfab', uid: '74f714127a8c4211bb1a2cac7195fb1a',
    label: 'Célula animal', eyebrow: 'Célula eucariótica', title: 'A célula eucariótica em corte',
    thumb: media('74f714127a8c4211bb1a2cac7195fb1a', '63881fd597ed4039b6bb045efb078a9b/6c74e8a1c8b94986b7e0817657e24ff7'),
    credit: {title: 'Eukaryotic cell cross-section', author: 'Ebers', authorUrl: 'https://sketchfab.com/Ebers', source: page('eukaryotic-cell-cross-section', '74f714127a8c4211bb1a2cac7195fb1a'), license: SKETCHFAB_LICENSES.standard},
    hotspots: [
      {id: 'membrana', name: 'Membrana plasmática', p: [1.351, 0.9026, -0.0814], eye: [2.2832, 0.0374, 0.6824], target: [1.351, 0.9026, -0.0814]},
      {id: 'citoplasma', name: 'Citoplasma', p: [0.3674, -0.103, -0.1153], eye: [1.2996, -0.9682, 0.6485], target: [0.3674, -0.103, -0.1153]},
      {id: 'citoesqueleto', name: 'Citoesqueleto', p: [0.1045, -0.0875, -0.5665], eye: [2.4122, -2.2293, 1.3243], target: [0.1045, -0.0875, -0.5665]},
      {id: 'envelope', name: 'Envelope nuclear', p: [0.4426, 1.1631, 0.4923], eye: [1.3748, 0.2979, 1.2561], target: [0.4426, 1.1631, 0.4923]},
      {id: 'poro', name: 'Poro nuclear', p: [0.3849, 1.2017, 0.7001], eye: [1.3171, 0.3365, 1.4639], target: [0.3849, 1.2017, 0.7001]},
      {id: 'nucleoplasma', name: 'Nucleoplasma', p: [0.0509, 1.1478, 0.3829], eye: [0.9831, 0.2826, 1.1467], target: [0.0509, 1.1478, 0.3829]},
      {id: 'cromatina', name: 'Cromatina', p: [-0.0441, 0.9178, 0.4172], eye: [0.8881, 0.0526, 1.181], target: [-0.0441, 0.9178, 0.4172]},
      {id: 'nucleolo', name: 'Nucléolo', p: [-0.0215, 0.8986, 0.299], eye: [0.9107, 0.0334, 1.0628], target: [-0.0215, 0.8986, 0.299]},
      {id: 'rer', name: 'Retículo endoplasmático rugoso', p: [0.3394, 0.5483, 0.0437], eye: [1.2716, -0.3169, 0.8075], target: [0.3394, 0.5483, 0.0437]},
      {id: 'ribossomos', name: 'Ribossomos', p: [-0.1604, 0.2887, 0.0582], eye: [0.7718, -0.5765, 0.822], target: [-0.1604, 0.2887, 0.0582]},
      {id: 'rel', name: 'Retículo endoplasmático liso', p: [-1.315, 1.3053, 0.1246], eye: [-0.3828, 0.4401, 0.8884], target: [-1.315, 1.3053, 0.1246]},
      {id: 'golgi', name: 'Complexo de Golgi', p: [1.0792, 0.2504, 0.0323], eye: [2.0114, -0.6148, 0.7961], target: [1.0792, 0.2504, 0.0323]},
      {id: 'mitocondria', name: 'Mitocôndria', p: [-0.7483, -0.7181, -0.3736], eye: [1.5594, -2.8599, 1.5172], target: [-0.7483, -0.7181, -0.3736]},
      {id: 'lisossomo', name: 'Lisossomo', p: [-0.3904, -0.64, -0.2379], eye: [1.9173, -2.7818, 1.6529], target: [-0.3904, -0.64, -0.2379]},
      {id: 'peroxissomo', name: 'Peroxissomo', p: [-0.0974, -0.8506, -0.3073], eye: [2.2103, -2.9924, 1.5835], target: [-0.0974, -0.8506, -0.3073]},
      {id: 'centriolos', name: 'Centríolos', p: [-0.857, -0.0664, 0.0441], eye: [0.0752, -0.9316, 0.8079], target: [-0.857, -0.0664, 0.0441]},
    ],
  },
  {
    key: 'plant', kind: 'sketchfab', uid: 'f258c65762e5435c9d58c1aa136b557a',
    label: 'Célula vegetal', eyebrow: 'Célula eucariótica', title: 'A célula vegetal',
    thumb: media('f258c65762e5435c9d58c1aa136b557a', 'bfb23a1f81b847329f0f8a60dda0dbe4/df865544965a415aaa447ed66bb92b60'),
    credit: {title: 'Eukaryotic Plant Cell', author: 'jlf_illustration', authorUrl: 'https://sketchfab.com/jlf_illustration', source: page('eukaryotic-plant-cell', 'f258c65762e5435c9d58c1aa136b557a'), license: SKETCHFAB_LICENSES.standard},
    hotspots: [
      {id: 'parede', name: 'Parede celular', p: [0.0093, -0.0012, 0.0013], eye: [-0.0039, -0.0143, 0.0152], target: [0.0093, -0.0012, 0.0013]},
      {id: 'citoplasma', name: 'Citoplasma', p: [0.0168, -0.0097, -0.001], eye: [0.0036, -0.0228, 0.0129], target: [0.0168, -0.0097, -0.001]},
      {id: 'vacuolo', name: 'Vacúolo central', p: [0.0201, -0.0102, 0.0044], eye: [0.0069, -0.0233, 0.0183], target: [0.0201, -0.0102, 0.0044]},
      {id: 'nucleo', name: 'Núcleo', p: [0.0117, -0.0081, 0.001], eye: [-0.0015, -0.0212, 0.0149], target: [0.0117, -0.0081, 0.001]},
      {id: 'rer', name: 'Retículo endoplasmático rugoso', p: [0.0155, -0.0073, 0.0002], eye: [0.0023, -0.0204, 0.0141], target: [0.0155, -0.0073, 0.0002]},
      {id: 'ribossomos', name: 'Ribossomos', p: [0.0098, -0.0067, 0.0013], eye: [-0.0034, -0.0198, 0.0152], target: [0.0098, -0.0067, 0.0013]},
      {id: 'golgi', name: 'Complexo de Golgi', p: [0.0196, 0.0044, 0.0043], eye: [0.0064, -0.0087, 0.0182], target: [0.0196, 0.0044, 0.0043]},
      {id: 'cloroplasto', name: 'Cloroplasto', p: [0.0151, -0.015, -0.002], eye: [0.0019, -0.0281, 0.0119], target: [0.0151, -0.015, -0.002]},
      {id: 'mitocondria', name: 'Mitocôndria', p: [0.0137, -0.013, -0.0024], eye: [0.0005, -0.0261, 0.0115], target: [0.0137, -0.013, -0.0024]},
    ],
  },
  {
    key: 'neuron', kind: 'sketchfab', uid: '1552b08138764c4897ac262cc5721792',
    label: 'Neurônio', eyebrow: 'Tecido nervoso', title: 'Neurônio e oligodendrócito',
    thumb: media('1552b08138764c4897ac262cc5721792', '5a10dbe1ca374ec19ea7daa16e599537/cadde10a9a7a4cfebebc27a5d70287ec'),
    credit: {title: 'Nerve cell (neuron and oligo-dendrocyte)', author: 'Ebers', authorUrl: 'https://sketchfab.com/Ebers', source: page('nerve-cell-neuron-and-oligo-dendrocyte', '1552b08138764c4897ac262cc5721792'), license: SKETCHFAB_LICENSES.editorial},
    hotspots: [
      {id: 'dendritos', name: 'Dendritos', p: [2.1641, 0.9575, 5.0511], eye: [-3.9032, 11.0258, 10.8023], target: [2.1641, 0.9575, 5.0511]},
      {id: 'soma', name: 'Corpo celular (soma)', p: [-1.7937, 2.3812, 2.3997], eye: [-7.861, 12.4495, 8.1509], target: [-1.7937, 2.3812, 2.3997]},
      {id: 'cone', name: 'Cone de implantação', p: [-2.1759, -0.572, 0.7132], eye: [-8.2432, 9.4963, 6.4644], target: [-2.1759, -0.572, 0.7132]},
      {id: 'mielina', name: 'Bainha de mielina', p: [-2.8117, -2.0869, -1.0323], eye: [-8.879, 7.9814, 4.7189], target: [-2.8117, -2.0869, -1.0323]},
      {id: 'ranvier', name: 'Nódulo de Ranvier', p: [-3.3004, -3.4988, -1.5245], eye: [-9.3677, 6.5695, 4.2267], target: [-3.3004, -3.4988, -1.5245]},
      {id: 'oligodendrocito', name: 'Oligodendrócito', p: [-4.4651, -6.2069, 0.963], eye: [-10.5324, 3.8614, 6.7142], target: [-4.4651, -6.2069, 0.963]},
      {id: 'axonio', name: 'Axônio', p: [-7.2818, -10.4345, -5.782], eye: [-13.3491, -0.3662, -0.0308], target: [-7.2818, -10.4345, -5.782]},
      {id: 'terminais', name: 'Terminais do axônio', p: [-8.637, -13.788, -7.8357], eye: [-14.7043, -3.7197, -2.0845], target: [-8.637, -13.788, -7.8357]},
    ],
  },
  {
    key: 'microglia', kind: 'sketchfab', uid: 'aeb54772e3f447858efc909c80035de4',
    label: 'Micróglia', eyebrow: 'Tecido nervoso', title: 'A micróglia',
    thumb: media('aeb54772e3f447858efc909c80035de4', '8d11dd511b104e388b24d8731d2b9ca0/94254e8f9f144f4892c3aa5b04c89773'),
    credit: {title: 'Nerve glial cell (microglia)', author: 'Ebers', authorUrl: 'https://sketchfab.com/Ebers', source: page('nerve-glial-cell-microglia', 'aeb54772e3f447858efc909c80035de4'), license: SKETCHFAB_LICENSES.editorial},
    hotspots: [
      {id: 'soma', name: 'Corpo celular (soma)', p: [-1.783, -0.0906, 10.3975], eye: [-7.5608, -2.0069, 8.9754], target: [-1.783, -0.0906, 10.3975]},
      {id: 'prolongamentos', name: 'Prolongamentos (processos)', p: [0.3794, -0.3024, 8.8599], eye: [-5.3984, -2.2187, 7.4378], target: [0.3794, -0.3024, 8.8599]},
      {id: 'ramificacoes', name: 'Ramificações finas', p: [-0.6613, 0.8812, 14.8538], eye: [-6.4391, -1.0351, 13.4317], target: [-0.6613, 0.8812, 14.8538]},
    ],
  },
  {
    key: 'osteocyte', kind: 'sketchfab', uid: '904d5a510b024d3cba9b9845839b4206',
    label: 'Osteócito', eyebrow: 'Tecido ósseo', title: 'O osteócito',
    thumb: media('904d5a510b024d3cba9b9845839b4206', '89ba9b59dbd64bcbbca05df4af5c48a1/07eca4b7f2354412a14e01e3cb4e785b'),
    credit: {title: 'Osteocyte / Bone Cell', author: 'tomparsons', authorUrl: 'https://sketchfab.com/tomparsons', source: page('osteocyte-bone-cell', '904d5a510b024d3cba9b9845839b4206'), license: SKETCHFAB_LICENSES.standard},
    hotspots: [
      {id: 'corpo', name: 'Corpo celular', p: [0.266, -1.5274, 0.32], eye: [1.6948, -0.5278, 2.6683], target: [0.266, -1.5274, 0.32]},
      {id: 'prolongamentos', name: 'Prolongamentos citoplasmáticos', p: [0.8462, -2.1687, 0.119], eye: [2.275, -1.1691, 2.4673], target: [0.8462, -2.1687, 0.119]},
    ],
  },
  {
    key: 'cancer', kind: 'sketchfab', uid: 'befebc741974461b94cbcb6b87877ea4',
    label: 'Célula tumoral', eyebrow: 'Patologia celular', title: 'A célula tumoral',
    thumb: media('befebc741974461b94cbcb6b87877ea4', 'dc4cc2cc5e174d3382b55cb15a2e9a39/692f661d26764470a7d303b15efe61fe'),
    credit: {title: 'Cancer cell', author: 'bblakesley', authorUrl: 'https://sketchfab.com/bblakesley', source: page('cancer-cell', 'befebc741974461b94cbcb6b87877ea4'), license: SKETCHFAB_LICENSES.standard},
    hotspots: [
      {id: 'corpo', name: 'Corpo celular', p: [0.4162, 0.9699, -0.1772], eye: [2.2198, 2.9941, 2.3435], target: [0.4162, 0.9699, -0.1772]},
      {id: 'blebs', name: 'Bolhas de membrana (blebs)', p: [1.0519, 0.3147, 0.6897], eye: [2.8555, 2.3389, 3.2104], target: [1.0519, 0.3147, 0.6897]},
      {id: 'pseudopodes', name: 'Pseudópodes', p: [4.7527, 0.2943, -0.6667], eye: [6.5563, 2.3185, 1.854], target: [4.7527, 0.2943, -0.6667]},
    ],
  },
];

export const histologyItemFor = (key: string | null | undefined) => HISTOLOGY.find(i => i.key === key);

/** Id sent to the tutor as the selected structure: the whole cell, or one of its markers. */
export const tutorId = (item: HistologyItem, hotspot?: HistoHotspot) => `histo:${item.key}${hotspot ? `:${hotspot.id}` : ''}`;

/** What the tutor is told about a histology id (null for anything else). */
export function describeHistology(id: string): {id: string; pt: string; en: string; sistema: string; pecas: number} | null {
  const [prefix, key, hotspotId] = id.split(':');
  if (prefix !== 'histo') return null;
  const item = histologyItemFor(key);
  if (!item) return null;
  const hotspot = hotspotId ? item.hotspots.find(h => h.id === hotspotId) : undefined;
  if (hotspotId && !hotspot) return null;
  const sistema = `Histologia e citologia — ${item.title} (modelo 3D ilustrativo, fora do corpo do atlas)`;
  return hotspot
    ? {id, pt: hotspot.name, en: item.credit.title, sistema, pecas: 1}
    : {id, pt: item.title, en: item.credit.title, sistema, pecas: 1};
}
