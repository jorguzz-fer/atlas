import {createNameIndex, normalizeForSearch, search} from './names';
import type {Atlas} from './anatomy';

const atlas = {
  version: 'test', parts: [], chunks: [], triangles: 0,
  concepts: [
    {id: 'FMA7131', name: 'Esophagus', elements: ['FJ1']},
    {id: 'FMA9611', name: 'Femur', elements: ['FJ2', 'FJ3']},
    {id: 'FMA24474', name: 'Left femur', elements: ['FJ2']},
    {id: 'FMA7088', name: 'Heart', elements: ['FJ4']},
    {id: 'FMA7197', name: 'Liver', elements: ['FJ5']},
    {id: 'FMA9999', name: 'Left mystery', elements: ['FJ6']},
  ],
} as Atlas;

const entries = {
  FMA7131: {pt: 'Esôfago', la: 'Oesophagus', source: 'wikidata' as const},
  FMA9611: {pt: 'Fêmur', la: 'Femur', source: 'wikidata' as const},
  FMA7088: {pt: 'Coraçao', source: 'ia' as const},
  FMA7197: {pt: 'Fígado', source: 'wikidata' as const, gender: 'm' as const},
};

test('side rule builds the Portuguese name from the base concept', () => {
  const index = createNameIndex(atlas, entries, {});
  expect(index.display('FMA24474', 'Left femur')).toEqual({pt: 'Fêmur esquerdo', la: undefined, source: 'regra'});
});

test('side rule agrees in gender when the base entry is feminine', () => {
  const index = createNameIndex(atlas, {...entries, FMA9611: {pt: 'Tíbia', source: 'wikidata', gender: 'f'}}, {});
  expect(index.display('FMA24474', 'Left femur').pt).toBe('Tíbia esquerda');
});

test('unknown base falls back to English marked as rule', () => {
  const index = createNameIndex(atlas, entries, {});
  expect(index.display('FMA9999', 'Left mystery')).toEqual({pt: 'Left mystery', la: undefined, source: 'regra'});
});

test('overrides win over generated entries', () => {
  const index = createNameIndex(atlas, entries, {FMA7088: {pt: 'Coração'}});
  expect(index.display('FMA7088', 'Heart')).toEqual({pt: 'Coração', la: undefined, source: 'manual'});
});

test('normalizeForSearch drops case and accents', () => {
  expect(normalizeForSearch('  Esôfago ')).toBe('esofago');
});

test.each(['esofago', 'esôfago', 'esophagus', 'oesophagus', 'ESÔF'])('search "%s" finds the esophagus', q => {
  const index = createNameIndex(atlas, entries, {});
  expect(search(index, atlas, q).map(c => c.id)).toContain('FMA7131');
});

test('search ranks prefix matches before substring matches', () => {
  const index = createNameIndex(atlas, entries, {});
  expect(search(index, atlas, 'fem')[0].id).toBe('FMA9611');
});
