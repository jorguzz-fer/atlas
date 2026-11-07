import type {OrganIcon} from '../catalog';

/**
 * A numbered marker on a detailed model. `p` is in the model's own space, after centring it on its bounding box.
 * `concept` is the matching BodyParts3D structure; without one (e.g. the thyroid, absent from the atlas)
 * the tutor and "ver no corpo" use the whole organ.
 */
export type Hotspot = {id: string; name: string; p: [number, number, number]; concept?: string};

export type OrganModel = {
  key: OrganIcon;
  eyebrow: string;
  title: string;
  url: string;
  credit: {title: string; author: string; authorUrl: string; source: string};
  /** BodyParts3D concept names (English) that open this detailed model from the body. */
  bodyConcepts: string[];
  /** Scales the model so its largest side has this size. Omitted for the heart, whose markers predate it. */
  fit?: number;
  hotspots: Hotspot[];
};

/**
 * Detailed, textured models for single organs. Positions of the heart markers come from the
 * "Miocardiopatia hipertrófica" lesson (same model, same centring), so they line up exactly.
 */
export const ORGAN_MODELS: OrganModel[] = [
  {
    key: 'heart',
    eyebrow: 'Anatomia externa',
    title: 'O coração em 3D',
    // Cached as immutable: bump ?v= whenever the file changes.
    url: '/models/organs/heart.glb?v=1',
    credit: {
      title: 'Realistic Human Heart',
      author: 'neshallads',
      authorUrl: 'https://sketchfab.com/neshallads',
      source: 'https://sketchfab.com/3d-models/realistic-human-heart-3f8072336ce94d18b3d0d055a1ece089',
    },
    bodyConcepts: ['heart'],
    hotspots: [
      {id: 'vcs', name: 'Veia cava superior', p: [-0.263, 0.658, 0.18], concept: 'superior vena cava'},
      {id: 'aoasc', name: 'Aorta ascendente', p: [-0.128, 0.42, 0.278], concept: 'ascending aorta'},
      {id: 'arco', name: 'Arco aórtico', p: [-0.012, 0.588, 0.169], concept: 'arch of aorta'},
      {id: 'tbc', name: 'Tronco braquiocefálico', p: [0.101, 0.757, -0.039], concept: 'brachiocephalic artery'},
      {id: 'acce', name: 'A. carótida comum esquerda', p: [0.229, 0.74, -0.162], concept: 'left common carotid artery'},
      {id: 'asce', name: 'A. subclávia esquerda', p: [0.307, 0.694, -0.283], concept: 'left subclavian artery'},
      {id: 'tp', name: 'Tronco pulmonar', p: [0.069, 0.263, 0.353], concept: 'pulmonary trunk'},
      {id: 'ape', name: 'A. pulmonar esquerda', p: [0.462, 0.353, 0.112], concept: 'left pulmonary artery'},
      {id: 'ad', name: 'Átrio direito', p: [-0.44, 0.047, 0.265], concept: 'right atrium'},
      {id: 'aue', name: 'Aurícula esquerda', p: [0.334, 0.167, 0.193], concept: 'left atrium'},
      {id: 'vd', name: 'Ventrículo direito', p: [-0.158, -0.249, 0.406], concept: 'right ventricle'},
      {id: 've', name: 'Ventrículo esquerdo', p: [0.317, -0.352, 0.259], concept: 'left ventricle'},
      {id: 'dai', name: 'Ramo interventricular anterior', p: [0.063, -0.248, 0.407], concept: 'anterior interventricular branch of left coronary artery'},
      {id: 'apice', name: 'Ápice', p: [0.18, -0.707, 0.172], concept: 'left ventricle'},
      {id: 'ae', name: 'Átrio esquerdo (face posterior)', p: [0, 0.224, -0.397], concept: 'left atrium'},
      {id: 'siv', name: 'Sulco interventricular posterior', p: [-0.011, -0.328, -0.374], concept: 'posterior interventricular branch of right coronary artery'},
    ],
  },
  {
    key: 'lungs',
    eyebrow: 'Sistema respiratório',
    title: 'Os pulmões em 3D',
    url: '/models/organs/lungs.glb?v=1',
    credit: {
      title: 'Realistic Human Lungs',
      author: 'neshallads',
      authorUrl: 'https://sketchfab.com/neshallads',
      source: 'https://sketchfab.com/3d-models/realistic-human-lungs-ce09f4099a68467880f46e61eb9a3531',
    },
    bodyConcepts: ['right lung', 'left lung'],
    fit: 1.6,
    hotspots: [
      {id: 'laringe', name: 'Laringe (cartilagem tireóidea)', p: [0, 0.523, 0.164]},
      {id: 'tireoide', name: 'Glândula tireoide', p: [-0.042, 0.356, 0.115]},
      {id: 'traqueia', name: 'Traqueia', p: [-0.011, 0.137, 0.079], concept: 'trachea'},
      {id: 'bpd', name: 'Brônquio principal direito', p: [-0.058, -0.026, 0.072], concept: 'right main bronchus'},
      {id: 'bpe', name: 'Brônquio principal esquerdo', p: [0.037, -0.032, 0.073], concept: 'left main bronchus'},
      {id: 'apice', name: 'Ápice do pulmão direito', p: [-0.195, 0.146, -0.023], concept: 'right lung'},
      {id: 'lsd', name: 'Lobo superior do pulmão direito', p: [-0.284, -0.072, 0.171], concept: 'right lung'},
      {id: 'lmd', name: 'Lobo médio do pulmão direito', p: [-0.275, -0.33, 0.3], concept: 'right lung'},
      {id: 'lid', name: 'Lobo inferior do pulmão direito', p: [-0.326, -0.608, 0.282], concept: 'right lung'},
      {id: 'lse', name: 'Lobo superior do pulmão esquerdo', p: [0.284, -0.057, 0.177], concept: 'left lung'},
      {id: 'lie', name: 'Lobo inferior do pulmão esquerdo', p: [0.378, -0.574, 0.274], concept: 'left lung'},
    ],
  },
  {
    key: 'kidneys',
    eyebrow: 'Sistema urinário',
    title: 'Os rins em 3D',
    url: '/models/organs/kidneys.glb?v=1',
    credit: {
      title: 'Human Kidney',
      author: 'neshallads',
      authorUrl: 'https://sketchfab.com/neshallads',
      source: 'https://sketchfab.com/3d-models/human-kidney-e1476ceb1e3b4412af5418eee9c5ed08',
    },
    bodyConcepts: ['kidney', 'right kidney', 'left kidney'],
    fit: 1.6,
    hotspots: [
      {id: 'rd', name: 'Rim direito', p: [-0.53, -0.02, 0.264], concept: 'right kidney'},
      {id: 'psd', name: 'Polo superior do rim direito', p: [-0.434, 0.465, 0.218], concept: 'right kidney'},
      {id: 'pelve', name: 'Pelve renal (hilo do rim direito)', p: [-0.232, 0.1, 0.089], concept: 'right kidney'},
      {id: 'ard', name: 'Artéria renal direita', p: [-0.165, 0.309, 0.048], concept: 'right renal artery'},
      {id: 'ud', name: 'Ureter direito', p: [-0.134, -0.295, 0.012], concept: 'right ureter'},
      {id: 'vci', name: 'Veia cava inferior', p: [-0.063, -0.466, 0.119], concept: 'inferior vena cava'},
      {id: 'aorta', name: 'Parte abdominal da aorta', p: [0.054, -0.482, -0.026], concept: 'abdominal aorta'},
      {id: 'vre', name: 'Veia renal esquerda', p: [0.148, 0.333, -0.063], concept: 'left renal vein'},
      {id: 'ue', name: 'Ureter esquerdo', p: [0.123, -0.315, 0.032], concept: 'left ureter'},
      {id: 're', name: 'Rim esquerdo', p: [0.484, 0.031, 0.228], concept: 'left kidney'},
      {id: 'pie', name: 'Polo inferior do rim esquerdo', p: [0.462, -0.277, 0.196], concept: 'left kidney'},
    ],
  },
  {
    key: 'brain',
    eyebrow: 'Sistema nervoso',
    title: 'O encéfalo em 3D',
    url: '/models/organs/brain.glb?v=1',
    credit: {
      title: 'Human brain, Cerebrum & Brainstem',
      author: 'FrankJohansson',
      authorUrl: 'https://sketchfab.com/pranktoy',
      source: 'https://sketchfab.com/3d-models/human-brain-cerebrum-brainstem-0aa0e33c5c854d1bab7bac9e1c7acaec',
    },
    bodyConcepts: ['brain'],
    fit: 1.6,
    hotspots: [
      {id: 'fissura', name: 'Fissura longitudinal do cérebro', p: [0, 0.512, 0.248]},
      {id: 'frontal-d', name: 'Lobo frontal direito', p: [-0.196, 0.348, 0.382], concept: 'right frontal lobe'},
      {id: 'frontal-e', name: 'Lobo frontal esquerdo', p: [0.19, 0.337, 0.497], concept: 'left frontal lobe'},
      {id: 'parietal-d', name: 'Lobo parietal direito', p: [-0.413, 0.345, -0.1], concept: 'right parietal lobe'},
      {id: 'occipital-d', name: 'Lobo occipital direito', p: [-0.358, 0.005, -0.47], concept: 'right occipital lobe'},
      {id: 'temporal-d', name: 'Lobo temporal direito', p: [-0.456, -0.115, 0.141], concept: 'right temporal lobe'},
      {id: 'temporal-e', name: 'Lobo temporal esquerdo', p: [0.43, -0.126, 0.105], concept: 'left temporal lobe'},
      {id: 'bulbo', name: 'Bulbo (tronco encefálico)', p: [-0.109, -0.405, -0.068], concept: 'medulla oblongata'},
    ],
  },
];

export const organModelFor = (key: string | null | undefined) => ORGAN_MODELS.find(m => m.key === key);

export type LabelMode = 'none' | 'labels' | 'quiz';

/**
 * Whether a marker shows its name.
 * - labels: all names.
 * - quiz: only the markers the student revealed by clicking.
 * - none: only the selected marker.
 */
export function labelShown(mode: LabelMode, id: string, selected: string | null, revealed: ReadonlySet<string>): boolean {
  if (mode === 'labels') return true;
  if (mode === 'quiz') return revealed.has(id);
  return id === selected;
}
