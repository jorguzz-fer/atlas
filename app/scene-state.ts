import {layerOf} from './catalog';
import type {Part, SceneState} from './anatomy';

export const FOCUS_DIM = 0.025;

/** Final opacity of one part (0 hidden, 1 solid, in between drawn as a ghost). */
export function partOpacity(part: Part, s: SceneState): number {
  const selected = s.selected.includes(part.id);
  if (s.isolate) return selected ? 1 : 0;
  if (selected || s.highlight.includes(part.id)) return 1;
  if (!s.visible.includes(part.system)) return 0;
  const layer = s.layers[layerOf(part.system)] ?? 1;
  return s.focus && s.selected.length ? Math.min(layer, FOCUS_DIM) : layer;
}
