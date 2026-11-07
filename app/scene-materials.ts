import type {SystemId} from './anatomy';

/** How a tissue reflects light. The colours stay in SYSTEMS; this only sets the surface. */
export type Surface = {roughness: number; clearcoat: number; clearcoatRoughness: number; sheen: number; sheenColor: string};

const MATTE: Surface = {roughness: 0.55, clearcoat: 0.1, clearcoatRoughness: 0.6, sheen: 0, sheenColor: '#000000'};
// Moist organs and vessels: a thin glossy film over a softer body.
const WET: Surface = {roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.3, sheen: 0.15, sheenColor: '#ffd9d0'};

const SURFACES: Partial<Record<SystemId, Surface>> = {
  skeletal: {roughness: 0.68, clearcoat: 0.05, clearcoatRoughness: 0.7, sheen: 0, sheenColor: '#000000'},
  // Muscle: the sheen picks out the fibres along the grazing edges.
  muscular: {roughness: 0.48, clearcoat: 0.3, clearcoatRoughness: 0.4, sheen: 0.45, sheenColor: '#ff9d8f'},
  cardiac: {...WET, clearcoat: 0.6, sheen: 0.35, sheenColor: '#ff9d8f'},
  arterial: {...WET, roughness: 0.36, clearcoat: 0.65},
  venous: {...WET, roughness: 0.36, clearcoat: 0.65, sheenColor: '#cfe0ff'},
  respiratory: WET,
  digestive: WET,
  urinary: WET,
  endocrine: WET,
  reproductive: WET,
  lymphatic: WET,
  nervous: {roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.45, sheen: 0.1, sheenColor: '#fff1d0'},
  sensory: {...WET, clearcoat: 0.7, clearcoatRoughness: 0.2},
  connective: {roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.5, sheen: 0.2, sheenColor: '#f0fff8'},
};

export const surfaceOf = (system: SystemId): Surface => SURFACES[system] ?? MATTE;
