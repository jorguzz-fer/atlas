import {SYSTEMS} from './anatomy';
import {surfaceOf} from './scene-materials';

test('every system has a surface with values in range', () => {
  for (const s of SYSTEMS) {
    const f = surfaceOf(s.id);
    for (const v of [f.roughness, f.clearcoat, f.clearcoatRoughness, f.sheen]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  }
});

test('wet tissue is glossier than bone', () => {
  for (const wet of ['cardiac', 'arterial', 'venous', 'digestive', 'respiratory'] as const) {
    expect(surfaceOf(wet).clearcoat).toBeGreaterThan(surfaceOf('skeletal').clearcoat);
    expect(surfaceOf(wet).roughness).toBeLessThan(surfaceOf('skeletal').roughness);
  }
});

test('muscle gets a fibre sheen, bone does not', () => {
  expect(surfaceOf('muscular').sheen).toBeGreaterThan(0);
  expect(surfaceOf('skeletal').sheen).toBe(0);
});
