import type {OrganIcon} from '../catalog';

/** A numbered marker on a detailed model. `p` is in the model's own space, after centring it on its bounding box. */
export type Hotspot = {id: string; name: string; p: [number, number, number]; concept: string};

export type OrganModel = {
  key: OrganIcon;
  eyebrow: string;
  title: string;
  url: string;
  credit: {title: string; author: string; authorUrl: string; source: string};
  /** BodyParts3D concept names (English) shown when the student returns to the body. */
  bodyConcept: string;
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
    bodyConcept: 'heart',
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
