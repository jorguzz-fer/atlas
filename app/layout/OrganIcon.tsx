import type {OrganIcon as OrganKey} from '../catalog';

/** Simple stylised organ drawings, our own artwork (no third-party illustrations). */
const PATHS: Record<OrganKey, {fill: string; d: string[]}> = {
  brain: {fill: '#e8a3a0', d: ['M24 10c-4-3-11-2-12 4-5 0-8 5-6 10-3 4 0 10 5 10 1 5 8 7 12 3 3 3 9 3 11-2 5 0 8-5 6-9 3-4 1-10-4-11-1-5-8-8-12-5z', 'M24 10v30M15 18c3 2 3 6 0 8M33 18c-3 2-3 6 0 8M14 30c4 0 6 3 6 6M34 30c-4 0-6 3-6 6']},
  lungs: {fill: '#d98b94', d: ['M21 12c-6 1-12 10-13 22-1 6 3 8 8 6 4-2 5-6 5-12V12z', 'M27 12c6 1 12 10 13 22 1 6-3 8-8 6-4-2-5-6-5-12V12z', 'M24 5v13M24 18l-3 4M24 18l3 4']},
  liver: {fill: '#9e4a4a', d: ['M7 20c3-7 15-9 27-8 6 0 9 4 7 8-3 7-11 13-19 16-6 2-9-1-10-5-4 0-7-5-5-11z', 'M28 13c-2 6-2 12 1 18']},
  heart: {fill: '#c45656', d: ['M24 40c-9-6-16-12-16-20 0-6 5-9 9-9 3 0 6 2 7 5 1-3 4-5 7-5 4 0 9 3 9 9 0 8-7 14-16 20z', 'M22 11V5M27 12l3-6M18 12l-3-5']},
  stomach: {fill: '#d9a07a', d: ['M18 6c0 5 2 8 1 12-2 6-8 8-8 16 0 6 6 9 13 8 9-1 15-8 14-16-1-7-7-9-11-8-4 1-5-3-5-12z']},
  pancreas: {fill: '#e3b98a', d: ['M8 26c4-6 10-6 15-5 6 1 10-4 15-6 4-1 5 3 2 5-4 3-8 6-14 7-5 1-9 4-12 5-4 1-8-2-6-6z']},
  kidneys: {fill: '#b8665a', d: ['M15 10c-5 0-8 6-8 13s3 14 8 14c4 0 5-4 3-7-2-3-2-7 0-10 2-4 1-10-3-10z', 'M33 10c5 0 8 6 8 13s-3 14-8 14c-4 0-5-4-3-7 2-3 2-7 0-10-2-4-1-10 3-10z']},
  'small-intestine': {fill: '#dcae96', d: ['M12 12c8-4 16-4 24 0 4 3 2 7-3 7-6 0-11-1-16 1-4 2-3 6 2 6 6 0 11-1 15 1 4 3 2 7-3 7-5 0-10-1-14 1-4 2-3 6 3 6h8']},
  'large-intestine': {fill: '#c9937a', d: ['M10 40V14c0-4 3-6 6-6h16c3 0 6 2 6 6v20c0 3-2 5-5 5h-6v-6h5V14H16v26z']},
  eyes: {fill: '#f1ece4', d: ['M6 24c6-9 30-9 36 0-6 9-30 9-36 0z', 'M24 30a6 6 0 1 0 0-12 6 6 0 0 0 0 12z']},
};

export function OrganIcon({organ, size = 44}: {organ: OrganKey; size?: number}) {
  const {fill, d} = PATHS[organ];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      {d.map((path, i) => (
        <path key={i} d={path} fill={i === 0 ? fill : 'none'} stroke={i === 0 ? '#00000040' : '#00000055'} strokeWidth={i === 0 ? 1 : 1.6} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
