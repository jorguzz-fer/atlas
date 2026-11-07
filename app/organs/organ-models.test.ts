import fs from 'node:fs';
import path from 'node:path';
import {ORGAN_MODELS, labelShown, organModelFor} from './organ-models';

const atlas = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../public/models/atlas.json'), 'utf8')) as {concepts: {name: string}[]};
const names = new Set(atlas.concepts.map(c => c.name));

test('the heart has the 16 markers of the lesson, each with a unique id', () => {
  const heart = organModelFor('heart')!;
  expect(heart.hotspots).toHaveLength(16);
  expect(new Set(heart.hotspots.map(h => h.id)).size).toBe(16);
});

test('every marker and organ points at a structure that exists in the body atlas', () => {
  for (const m of ORGAN_MODELS) {
    for (const c of m.bodyConcepts) expect([m.key, c, names.has(c)]).toEqual([m.key, c, true]);
    for (const h of m.hotspots) if (h.concept) expect([h.id, names.has(h.concept)]).toEqual([h.id, true]);
  }
});

test('every detailed model file is shipped in public/', () => {
  for (const m of ORGAN_MODELS) expect(fs.existsSync(path.resolve(__dirname, '../../public', m.url.split('?')[0].slice(1)))).toBe(true);
});

test('label visibility follows the mode', () => {
  const none = new Set<string>(), revealed = new Set(['ad']);
  expect(labelShown('labels', 'vd', null, none)).toBe(true);
  expect(labelShown('none', 'vd', null, none)).toBe(false);
  expect(labelShown('none', 'vd', 'vd', none)).toBe(true);
  expect(labelShown('quiz', 'vd', 'vd', revealed)).toBe(false);
  expect(labelShown('quiz', 'ad', null, revealed)).toBe(true);
});

test('organs without a detailed model return nothing', () => {
  expect(organModelFor('stomach')).toBeUndefined();
  expect(organModelFor(null)).toBeUndefined();
});
