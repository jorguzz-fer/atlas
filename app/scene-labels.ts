export type LabelCandidate = {id: string; x: number; y: number; size: number};
export type ScreenLabel = {id: string; x: number; y: number; anchorX: number; anchorY: number};

const GAP = 22;
const OFFSET = 70;
const MIN_SIZE = 24;
const EDGE_ROOM = 160;

/** Places one label per visible structure, beside its anchor, without vertical overlap. */
export function placeLabels(candidates: LabelCandidate[], viewport: {width: number; height: number}): ScreenLabel[] {
  const inside = candidates
    .filter(c => c.size >= MIN_SIZE && c.x >= 0 && c.x <= viewport.width && c.y >= 0 && c.y <= viewport.height)
    .sort((a, b) => a.y - b.y);
  const placed: ScreenLabel[] = [];
  for (const c of inside) {
    const toLeft = c.x + OFFSET + EDGE_ROOM > viewport.width;
    const x = toLeft ? c.x - OFFSET : c.x + OFFSET;
    const sameSide = placed.filter(p => p.x < p.anchorX === toLeft);
    const last = sameSide[sameSide.length - 1];
    const y = last ? Math.max(c.y, last.y + GAP) : c.y;
    placed.push({id: c.id, x, y, anchorX: c.x, anchorY: c.y});
  }
  return placed;
}
