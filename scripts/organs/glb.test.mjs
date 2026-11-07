import {readGlb, writeGlb, replaceImages, describeGlb} from './glb.mjs';

// A tiny GLB: one 4-byte "vertex" view and one PNG-labelled image view.
function sample() {
  const json = {
    asset: {version: '2.0'},
    buffers: [{byteLength: 0}],
    bufferViews: [{buffer: 0, byteOffset: 0, byteLength: 4}, {buffer: 0, byteOffset: 4, byteLength: 3}],
    images: [{bufferView: 1, mimeType: 'image/png'}],
    meshes: [{primitives: [{attributes: {POSITION: 0}, indices: 1}]}],
    accessors: [{count: 3}, {count: 6}],
  };
  return writeGlb(json, [Buffer.from([1, 2, 3, 4]), Buffer.from('png')]);
}

test('a written GLB reads back with the same views', () => {
  const {json, views} = readGlb(sample());
  expect(json.asset.version).toBe('2.0');
  expect(views.map(v => v.toString('hex'))).toEqual(['01020304', Buffer.from('png').toString('hex')]);
});

test('the header and chunks are 4-byte aligned and the total length is right', () => {
  const glb = sample();
  expect(glb.toString('ascii', 0, 4)).toBe('glTF');
  expect(glb.readUInt32LE(8)).toBe(glb.length);
  expect(glb.readUInt32LE(12) % 4).toBe(0);
  expect(glb.length % 4).toBe(0);
});

test('replaceImages swaps the bytes and mime type, keeping other views intact', () => {
  const out = replaceImages(sample(), () => ({bytes: Buffer.from('a-much-longer-jpeg'), mimeType: 'image/jpeg'}));
  const {json, views} = readGlb(out);
  expect(json.images[0].mimeType).toBe('image/jpeg');
  expect(views[1].toString()).toBe('a-much-longer-jpeg');
  expect(views[0].toString('hex')).toBe('01020304');
  expect(json.bufferViews[1].byteOffset % 4).toBe(0);
});

test('describeGlb counts triangles and image bytes', () => {
  expect(describeGlb(sample())).toEqual({triangles: 2, images: [{mimeType: 'image/png', bytes: 3}]});
});
