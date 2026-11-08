import fs from 'node:fs';
import path from 'node:path';
import {HISTOLOGY, describeHistology, histologyItemFor, sketchfabUid, tutorId} from './histology';

test('reads the model id from any Sketchfab link or embed code', () => {
  const uid = '42439edc90cd4d87b8ae322a4dcee8de';
  expect(sketchfabUid(`https://sketchfab.com/models/${uid}/embed`)).toBe(uid);
  expect(sketchfabUid(`https://sketchfab.com/3d-models/bacterial-cell-structure-${uid}`)).toBe(uid);
  expect(sketchfabUid(`<iframe src="https://sketchfab.com/models/${uid}/embed?autostart=1"></iframe>`)).toBe(uid);
  expect(sketchfabUid('https://example.com/models/abc')).toBeNull();
});

test('every item has a unique key and markers with unique ids', () => {
  expect(new Set(HISTOLOGY.map(i => i.key)).size).toBe(HISTOLOGY.length);
  for (const item of HISTOLOGY) expect([item.key, new Set(item.hotspots.map(h => h.id)).size]).toEqual([item.key, item.hotspots.length]);
});

test('embedded items carry a valid model id; downloaded ones ship their file', () => {
  for (const item of HISTOLOGY) {
    if (item.kind === 'sketchfab') expect([item.key, /^[0-9a-f]{32}$/.test(item.uid)]).toEqual([item.key, true]);
    else expect([item.key, fs.existsSync(path.resolve(__dirname, '../../public', item.url.split('?')[0].slice(1)))]).toEqual([item.key, true]);
  }
});

test('the tutor learns which cell and which marker are being studied', () => {
  const cell = histologyItemFor('bacteria')!;
  const marker = cell.hotspots[0];
  expect(describeHistology(tutorId(cell))).toMatchObject({pt: cell.title});
  expect(describeHistology(tutorId(cell, marker))).toMatchObject({pt: marker.name, sistema: expect.stringContaining(cell.title)});
  expect(tutorId(cell, marker).length).toBeLessThanOrEqual(60);
  expect(describeHistology('histo:nao-existe')).toBeNull();
  expect(describeHistology('FMA7198')).toBeNull();
});
