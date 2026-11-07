import type {OrganIcon as OrganKey} from '../catalog';

/** Bump when the thumbnails are regenerated (scripts/organs/thumbs.ts); /models is cached as immutable. */
const VERSION = 1;

export const organIconUrl = (organ: OrganKey) => `/models/thumbs/${organ}.webp?v=${VERSION}`;

/** Small render of the organ's 3D model, transparent background. */
export function OrganIcon({organ, size = 44}: {organ: OrganKey; size?: number}) {
  return <img className="organ-icon" src={organIconUrl(organ)} width={size} height={size} alt="" aria-hidden="true" draggable={false} loading="lazy" decoding="async" />;
}
