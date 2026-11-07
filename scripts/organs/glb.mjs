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
