import {normalizePtBr, guessGender} from './normalize-ptbr.mjs';

test.each([
  ['Esófago', 'Esôfago'],
  ['Fémur', 'Fêmur'],
  ['Fémur esquerdo', 'Fêmur esquerdo'],
  ['Intestino ténue', 'Intestino delgado'],
  ['Pénis', 'Pênis'],
  ['Úmero', 'Úmero'],
  ['Pâncreas', 'Pâncreas'],
  ['Rim direito', 'Rim direito'],
  ['Músculo bicípite braquial', 'Músculo bíceps braquial'],
  ['Músculo tricípite braquial', 'Músculo tríceps braquial'],
  ['Músculo quadricípite femoral', 'Músculo quadríceps femoral'],
  ['Aparelho digestivo', 'Sistema digestório'],
  ['Ácido', 'Ácido'],
])('normalizePtBr(%s) → %s', (input, expected) => {
  expect(normalizePtBr(input)).toBe(expected);
});

test.each([
  ['Coração humano', 'Coração'],
  ['Cérebro humano', 'Cérebro'],
  ['Pele humana', 'Pele'],
  ['Corpo humano', 'Corpo humano'],
])('normalizePtBr drops the redundant "humano" qualifier: %s → %s', (input, expected) => {
  expect(normalizePtBr(input)).toBe(expected);
});

test('normalizePtBr capitalizes the first letter only', () => {
  expect(normalizePtBr('artéria aorta')).toBe('Artéria aorta');
});

test.each([
  ['Tíbia', 'f'], ['Artéria femoral', 'f'], ['Veia cava', 'f'], ['Fêmur', 'm'],
  ['Coração', 'm'], ['Músculo deltoide', 'm'], ['Mão', 'f'], ['Pâncreas', 'm'],
])('guessGender(%s) → %s', (pt, g) => {
  expect(guessGender(pt)).toBe(g);
});
