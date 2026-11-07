import {readGlb, writeGlb, replaceImages, describeGlb, simplifyGlb} from './glb.mjs';

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

// A flat N×N grid: position + normal per vertex, uint32 triangles. Flat, so it simplifies a lot.
function grid(n = 21) {
  const pos = [], nor = [], idx = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { pos.push(x / (n - 1), y / (n - 1), 0); nor.push(0, 0, 1); }
  for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) {
    const a = y * n + x, b = a + 1, c = a + n, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  const json = {
    asset: {version: '2.0'},
    buffers: [{byteLength: 0}],
    bufferViews: [{buffer: 0, byteLength: 0}, {buffer: 0, byteLength: 0}, {buffer: 0, byteLength: 0}],
    accessors: [
      {bufferView: 0, componentType: 5126, count: n * n, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0]},
      {bufferView: 1, componentType: 5126, count: n * n, type: 'VEC3'},
      {bufferView: 2, componentType: 5125, count: idx.length, type: 'SCALAR'},
    ],
    meshes: [{primitives: [{attributes: {POSITION: 0, NORMAL: 1}, indices: 2}]}],
  };
  const f32 = a => Buffer.from(new Float32Array(a).buffer), u32 = a => Buffer.from(new Uint32Array(a).buffer);
  return writeGlb(json, [f32(pos), f32(nor), u32(idx)]);
}

test('simplifyGlb reduces triangles and drops the vertices no longer used', async () => {
  const before = grid();
  const after = await simplifyGlb(before, {ratio: 0.1, error: 0.01, minTriangles: 0});
  const {json, views} = readGlb(after);
  expect(describeGlb(after).triangles).toBeLessThan(describeGlb(before).triangles * 0.2);
  expect(describeGlb(after).triangles).toBeGreaterThan(0);
  const indices = new Uint32Array(views[json.accessors[2].bufferView].buffer.slice(views[json.accessors[2].bufferView].byteOffset, views[json.accessors[2].bufferView].byteOffset + views[json.accessors[2].bufferView].length));
  const vertices = json.accessors[0].count;
  expect(Math.max(...indices) + 1).toBe(vertices);
  expect(json.accessors[1].count).toBe(vertices);
  expect(vertices).toBeLessThan(21 * 21);
  expect(json.accessors[0].min).toEqual([0, 0, 0]);
  expect(json.accessors[0].max).toEqual([1, 1, 0]);
  expect(after.length).toBeLessThan(before.length);
});

test('simplifyGlb leaves light meshes alone', async () => {
  const before = grid(4);
  const after = await simplifyGlb(before, {ratio: 0.1, error: 0.01, minTriangles: 100});
  expect(describeGlb(after).triangles).toBe(describeGlb(before).triangles);
});

test('simplifyGlb frees shared data even when a small mesh is left untouched', async () => {
  // Like Sketchfab: one view holds the positions of a big grid and of a tiny triangle.
  const {json, views} = readGlb(grid());
  const tri = Buffer.from(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer);
  const sharedPos = Buffer.concat([views[0], tri]);
  views[0] = sharedPos;
  json.accessors.push(
    {bufferView: 0, byteOffset: views[0].length - tri.length, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0]},
    {bufferView: views.length, componentType: 5125, count: 3, type: 'SCALAR'},
  );
  json.bufferViews.push({buffer: 0, byteLength: 0});
  views.push(Buffer.from(new Uint32Array([0, 1, 2]).buffer));
  json.meshes.push({primitives: [{attributes: {POSITION: 3}, indices: 4}]});
  const before = writeGlb(json, views);
  const after = await simplifyGlb(before, {ratio: 0.1, error: 0.01, minTriangles: 100});
  expect(describeGlb(after).triangles).toBeLessThan(170);
  // The untouched triangle survives, and the big shared block is gone.
  const out = readGlb(after);
  expect(out.json.accessors[3].count).toBe(3);
  expect(out.views.some(v => v.length >= sharedPos.length)).toBe(false);
});
