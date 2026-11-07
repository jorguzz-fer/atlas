import fs from 'node:fs';
import {regionOf, layerOf, ORGANS_3D, QUICK_VIEWS, conceptsByName, correctSystem, correctAtlas} from './catalog';
import type {Atlas, Part} from './anatomy';

const atlas: Atlas = JSON.parse(fs.readFileSync(new URL('../public/models/atlas.json', import.meta.url), 'utf8'));
const part = (x: number, y: number) => ({bounds: [[x - 0.01, y - 0.01, 0], [x + 0.01, y + 0.01, 0]]}) as unknown as Part;

test.each([
  [0, 1.6, 'head'],
  [0, 1.45, 'chest'],
  [0, 1.3, 'chest'],
  [0, 1.245, 'abdomen'],
  [0, 1.0, 'abdomen'],
  [0.3, 1.2, 'arms'],
  [0.3, 0.5, 'legs'],
  [0, 0.79, 'abdomen'],
  [0, 0.78, 'legs'],
])('regionOf(x=%s, y=%s) → %s', (x, y, region) => {
  expect(regionOf(part(x, y))).toBe(region);
});

test('layerOf groups connective tissue with muscles', () => {
  expect(layerOf('connective')).toBe('muscles');
  expect(layerOf('muscular')).toBe('muscles');
  expect(layerOf('skeletal')).toBe('skeleton');
  expect(layerOf('arterial')).toBe('organs');
});

test('every organ in the 3D carousel exists in the atlas', () => {
  expect(ORGANS_3D).toHaveLength(10);
  const names = new Set(atlas.concepts.map(c => c.name.toLowerCase()));
  for (const organ of ORGANS_3D) for (const n of organ.concepts) expect(names.has(n)).toBe(true);
});

test('conceptsByName merges concepts without duplicating pieces', () => {
  const right = atlas.concepts.find(c => c.name === 'right lung')!;
  const left = atlas.concepts.find(c => c.name === 'left lung')!;
  const merged = conceptsByName(atlas, ['right lung', 'left lung'], 'pulmoes');
  expect(merged.id).toBe('group-pulmoes');
  expect(merged.elements.length).toBe(new Set([...right.elements, ...left.elements]).size);
});

test('conceptsByName rejects unknown names', () => {
  expect(() => conceptsByName(atlas, ['nao existe'], 'x')).toThrow(/nao existe/);
});

test.each([
  ['Hepatovenous segment VIII', 'venous', 'digestive'],
  ['Right fibularis longus', 'skeletal', 'muscular'],
  ['Left tibialis anterior', 'skeletal', 'muscular'],
  ['Right tensor fasciae latae', 'connective', 'muscular'],
  ['Right subscapularis', 'skeletal', 'muscular'],
  ['Left levator scapulae', 'skeletal', 'muscular'],
  ['Right iliotibial tract', 'skeletal', 'connective'],
  ['Flexor retinaculum of left wrist', 'sensory', 'connective'],
  ['Left common tendinous ring', 'sensory', 'connective'],
  ['Third ventricle', 'cardiac', 'nervous'],
  ['Left lateral ventricle', 'cardiac', 'nervous'],
  ['Interventricular foramen', 'cardiac', 'nervous'],
  ['Choroid plexus of cerebral hemisphere', 'sensory', 'nervous'],
  ['Left ventricle', 'cardiac', 'cardiac'],
  ['Right portal vein', 'venous', 'venous'],
])('correctSystem(%s from %s) → %s', (name, from, to) => {
  expect(correctSystem({name, system: from} as Part)).toBe(to);
});

test('correctAtlas fixes the misfiled liver lobes in the real data', () => {
  const fixed = correctAtlas(atlas);
  const liver = fixed.concepts.find(c => c.name === 'liver')!;
  const lobes = fixed.parts.filter(p => liver.elements.includes(p.id) && /Hepatovenous segment/.test(p.name));
  expect(lobes.length).toBeGreaterThan(0);
  expect(lobes.every(p => p.system === 'digestive')).toBe(true);
});

test('quick views show the systems of their layer', () => {
  const byId = Object.fromEntries(QUICK_VIEWS.map(v => [v.id, v]));
  expect(byId.skeleton.visible).toEqual(['skeletal']);
  expect(byId.muscles.visible).toEqual(expect.arrayContaining(['muscular', 'skeletal']));
  expect(byId.all.visible).not.toContain('integumentary');
  expect(byId.organs.visible).not.toContain('muscular');
});
