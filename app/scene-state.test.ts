import {partOpacity, HIGHLIGHT_DIM} from './scene-state';
import type {Part, SceneState} from './anatomy';

const base: SceneState = {
  explode: 0, visible: ['skeletal', 'digestive'], selected: [], isolate: false, view: 'perspective', rotate: false, reset: 0,
  focus: false, layers: {muscles: 1, skeleton: 1, organs: 1}, labels: true, highlight: [], zoom: 0,
};
const bone = {id: 'B', system: 'skeletal'} as Part;
const gut = {id: 'G', system: 'digestive'} as Part;
const muscle = {id: 'M', system: 'muscular'} as Part;

test('visible systems are opaque, hidden systems invisible', () => {
  expect(partOpacity(bone, base)).toBe(1);
  expect(partOpacity(muscle, base)).toBe(0);
});

test('layer opacity scales its systems', () => {
  expect(partOpacity(bone, {...base, layers: {muscles: 1, skeleton: 0.3, organs: 1}})).toBeCloseTo(0.3);
});

test('focus dims everything except the selection to 0.025', () => {
  const s = {...base, focus: true, selected: ['G']};
  expect(partOpacity(bone, s)).toBeCloseTo(0.025);
  expect(partOpacity(gut, s)).toBe(1);
});

test('focus without a selection changes nothing', () => {
  expect(partOpacity(bone, {...base, focus: true})).toBe(1);
});

test('isolate shows only the selection', () => {
  const s = {...base, isolate: true, selected: ['G']};
  expect(partOpacity(bone, s)).toBe(0);
  expect(partOpacity(gut, s)).toBe(1);
});

test('a tutor highlight fades everything else so the highlighted parts can be seen', () => {
  const s = {...base, highlight: ['G']};
  expect(partOpacity(gut, s)).toBe(1);
  expect(partOpacity(bone, s)).toBeCloseTo(HIGHLIGHT_DIM);
  expect(partOpacity(muscle, s)).toBe(0);
});

test('selected and tutor-highlighted parts show even in hidden systems or faded layers', () => {
  expect(partOpacity(muscle, {...base, selected: ['M']})).toBe(1);
  expect(partOpacity(muscle, {...base, highlight: ['M']})).toBe(1);
  expect(partOpacity(bone, {...base, layers: {muscles: 1, skeleton: 0.2, organs: 1}, highlight: ['B']})).toBe(1);
});
