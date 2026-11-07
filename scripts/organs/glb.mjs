// Minimal GLB (binary glTF 2.0) reader/writer for single-buffer files, as exported by Sketchfab.

const pad4 = n => (4 - (n % 4)) % 4;

/** Splits a GLB into its JSON and the bytes of each bufferView. */
export function readGlb(buf) {
  if (buf.toString('ascii', 0, 4) !== 'glTF') throw new Error('Não é um arquivo GLB.');
  const jsonLength = buf.readUInt32LE(12);
  const json = JSON.parse(buf.toString('utf8', 20, 20 + jsonLength));
  const binStart = 20 + jsonLength + 8;
  const bin = buf.subarray(binStart, binStart + (buf.length > binStart ? buf.readUInt32LE(20 + jsonLength) : 0));
  if ((json.buffers ?? []).length > 1) throw new Error('GLB com mais de um buffer não é suportado.');
  const views = (json.bufferViews ?? []).map(v => bin.subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength));
  return {json, views};
}

/** Builds a GLB from JSON and one Buffer per bufferView, recomputing offsets and lengths. */
export function writeGlb(json, views) {
  const parts = [];
  let offset = 0;
  views.forEach((data, i) => {
    const pad = pad4(offset);
    if (pad) { parts.push(Buffer.alloc(pad)); offset += pad; }
    json.bufferViews[i].byteOffset = offset;
    json.bufferViews[i].byteLength = data.length;
    parts.push(data);
    offset += data.length;
  });
  let body = Buffer.concat(parts);
  body = Buffer.concat([body, Buffer.alloc(pad4(body.length))]);
  json.buffers = [{byteLength: body.length}];
  let text = Buffer.from(JSON.stringify(json));
  text = Buffer.concat([text, Buffer.alloc(pad4(text.length), 0x20)]);
  const chunk = (data, type) => { const h = Buffer.alloc(8); h.writeUInt32LE(data.length, 0); h.write(type, 4, 'ascii'); return h; };
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + text.length + 8 + body.length, 8);
  return Buffer.concat([header, chunk(text, 'JSON'), text, chunk(body, 'BIN\0'), body]);
}

/** Replaces every embedded image through `convert(bytes, mimeType, imageIndex) => {bytes, mimeType}`. */
export function replaceImages(buf, convert) {
  const {json, views} = readGlb(buf);
  (json.images ?? []).forEach((image, i) => {
    if (image.bufferView === undefined) return;
    const out = convert(views[image.bufferView], image.mimeType, i);
    views[image.bufferView] = out.bytes;
    image.mimeType = out.mimeType;
  });
  return writeGlb(json, views);
}

/** Triangle count and embedded image sizes, to judge whether a model needs slimming. */
export function describeGlb(buf) {
  const {json, views} = readGlb(buf);
  let triangles = 0;
  for (const mesh of json.meshes ?? []) for (const p of mesh.primitives) {
    triangles += Math.floor((p.indices !== undefined ? json.accessors[p.indices].count : json.accessors[p.attributes.POSITION].count) / 3);
  }
  const images = (json.images ?? []).filter(i => i.bufferView !== undefined).map(i => ({mimeType: i.mimeType, bytes: views[i.bufferView].length}));
  return {triangles, images};
}

const COMPONENT_BYTES = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4};
const TYPE_COMPONENTS = {SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16};

/** The accessor's elements as one tightly packed Buffer (stride and offsets resolved). */
function packed(json, views, accessor) {
  const elem = COMPONENT_BYTES[accessor.componentType] * TYPE_COMPONENTS[accessor.type];
  const view = views[accessor.bufferView];
  const stride = json.bufferViews[accessor.bufferView].byteStride || elem;
  const out = Buffer.alloc(accessor.count * elem);
  for (let i = 0; i < accessor.count; i++) view.copy(out, i * elem, (accessor.byteOffset ?? 0) + i * stride, (accessor.byteOffset ?? 0) + i * stride + elem);
  return {data: out, elem};
}

const typed = (buf, Type) => new Type(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));

/**
 * Simplifies every indexed triangle mesh to about `ratio` of its triangles (meshoptimizer),
 * keeping the shape within `error` (relative to the mesh size), then drops the vertices
 * no longer used. Meshes under `minTriangles` are left as they are.
 */
export async function simplifyGlb(buf, {ratio, error = 0.01, minTriangles = 2000}) {
  const {MeshoptSimplifier} = await import('meshoptimizer');
  await MeshoptSimplifier.ready;
  const {json, views} = readGlb(buf);
  const originalViews = views.length;
  const uses = new Map();
  for (const mesh of json.meshes ?? []) for (const p of mesh.primitives) {
    for (const a of [...Object.values(p.attributes), p.indices]) if (a !== undefined) uses.set(a, (uses.get(a) ?? 0) + 1);
  }
  const addView = data => { views.push(data); json.bufferViews.push({buffer: 0, byteLength: data.length}); return views.length - 1; };

  for (const mesh of json.meshes ?? []) for (const p of mesh.primitives) {
    if (p.indices === undefined || (p.mode ?? 4) !== 4 || p.targets) continue;
    const accessors = [...Object.values(p.attributes), p.indices];
    if (accessors.some(a => uses.get(a) > 1)) continue; // shared data: simplifying one mesh would break another
    const indexAcc = json.accessors[p.indices], posAcc = json.accessors[p.attributes.POSITION];
    if (indexAcc.count / 3 < minTriangles || posAcc.componentType !== 5126) continue;

    const rawIndices = packed(json, views, indexAcc).data;
    const indices = indexAcc.componentType === 5125 ? typed(rawIndices, Uint32Array)
      : Uint32Array.from(indexAcc.componentType === 5123 ? typed(rawIndices, Uint16Array) : rawIndices);
    const positions = typed(packed(json, views, posAcc).data, Float32Array);
    const target = Math.max(3, Math.floor((indices.length * ratio) / 3) * 3);
    const [simple] = MeshoptSimplifier.simplify(indices, positions, 3, target, error);
    if (simple.length >= indices.length) continue;
    const [remap, unique] = MeshoptSimplifier.compactMesh(simple);

    for (const a of Object.values(p.attributes)) {
      const acc = json.accessors[a];
      const {data, elem} = packed(json, views, acc);
      const out = Buffer.alloc(unique * elem);
      for (let v = 0; v < acc.count; v++) if (remap[v] !== 0xffffffff) data.copy(out, remap[v] * elem, v * elem, v * elem + elem);
      acc.bufferView = addView(out);
      delete acc.byteOffset;
      acc.count = unique;
      if (a === p.attributes.POSITION) {
        const f = typed(out, Float32Array), min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
        for (let i = 0; i < f.length; i++) { min[i % 3] = Math.min(min[i % 3], f[i]); max[i % 3] = Math.max(max[i % 3], f[i]); }
        acc.min = min; acc.max = max;
      }
    }
    indexAcc.bufferView = addView(Buffer.from(simple.buffer, simple.byteOffset, simple.byteLength));
    indexAcc.componentType = 5125;
    indexAcc.count = simple.length;
    delete indexAcc.byteOffset; delete indexAcc.min; delete indexAcc.max;
  }

  // Untouched accessors may still point into big views shared with the simplified meshes:
  // give each its own tight copy so those views can go.
  for (const acc of json.accessors ?? []) {
    if (acc.bufferView === undefined || acc.bufferView >= originalViews || acc.sparse) continue;
    acc.bufferView = addView(packed(json, views, acc).data);
    delete acc.byteOffset;
  }

  // Drop the buffer views nothing points at any more.
  const used = new Set([...(json.accessors ?? []).map(a => a.bufferView), ...(json.images ?? []).map(i => i.bufferView)].filter(v => v !== undefined));
  const keep = [...used].sort((a, b) => a - b), index = new Map(keep.map((old, i) => [old, i]));
  json.bufferViews = keep.map(i => json.bufferViews[i]);
  for (const a of json.accessors ?? []) if (a.bufferView !== undefined) a.bufferView = index.get(a.bufferView);
  for (const im of json.images ?? []) if (im.bufferView !== undefined) im.bufferView = index.get(im.bufferView);
  return writeGlb(json, keep.map(i => views[i]));
}
