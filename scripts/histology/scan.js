// Dev tool: finds marker positions on an embedded (Sketchfab) histology model by casting rays over the
// viewer and grouping the hits by material or node name. Open the model with ?marcadores, then in the console:
//   await import('/@fs/<projeto>/scripts/histology/scan.js');
//   await __scan({mitochondria: 'Mitocôndria'}, {hide: [ids]}); await __show(); __lines(['mitocondria'])
window.__scan = async (map, opts = {}) => {
  const api = window.histoApi;
  const call = (fn, ...a) => new Promise(r => api[fn](...a, (e, v) => r(v)));
  const ifr = document.querySelector('.sketchfab-frame');
  const W = ifr.clientWidth, H = ifr.clientHeight;
  const nodes = await call('getNodeMap');
  const byId = {}; Object.values(nodes).forEach(n => byId[n.instanceID] = n.name);
  for (const id of opts.hide ?? []) await call('hide', id);
  const nx = opts.nx ?? 30, ny = opts.ny ?? 24;
  const hits = {};
  for (let j = 1; j < ny; j++) for (let i = 1; i < nx; i++) {
    const x = i / nx * W, y = j / ny * H;
    const v = await call('pickFromScreen', [x, y]);
    if (!v || v.instanceID == null) continue;
    const key = opts.by === 'node' ? (byId[v.instanceID] ?? '#' + v.instanceID) : (v.material?.name ?? '?');
    const label = Object.entries(map).find(([k]) => key.includes(k))?.[1];
    if (!label) continue;
    (hits[label] ??= []).push({x, y, p: v.position3D});
  }
  for (const id of opts.hide ?? []) await call('show', id);
  const cam = await call('getCameraLookAt');
  const d = cam.position.map((x, i) => x - cam.target[i]); const L = Math.hypot(...d);
  const k = (opts.zoom ?? 0.45) * L;
  const out = [];
  for (const label of new Set(Object.values(map))) {
    const v = hits[label]; if (!v) continue;
    const cx = v.reduce((s, h) => s + h.x, 0) / v.length, cy = v.reduce((s, h) => s + h.y, 0) / v.length;
    const best = v.reduce((a, b) => (Math.hypot(b.x - cx, b.y - cy) < Math.hypot(a.x - cx, a.y - cy) ? b : a));
    const p = best.p.map(x => +x.toFixed(4));
    const eye = p.map((x, i) => +(x + d[i] / L * k).toFixed(4));
    out.push({name: label, n: v.length, p, eye, target: p, screen: [Math.round(best.x), Math.round(best.y)]});
  }
  window.__out = out;
  return out.map(o => `${o.name} (${o.n}) @${o.screen}`);
};
window.__show = async () => {
  const api = window.histoApi;
  const call = (fn, ...a) => new Promise(r => api[fn](...a, (e, v) => r(v)));
  await call('removeAllAnnotations');
  for (const o of window.__out) await call('createAnnotationFromWorldPosition', o.p, o.eye, o.target, o.name, '');
  return window.__out.length;
};
window.__lines = (ids) => window.__out.map((o, i) => `      {id: '${ids[i]}', name: '${o.name}', p: [${o.p.join(', ')}], eye: [${o.eye.join(', ')}], target: [${o.target.join(', ')}]},`).join('\n');
/** Waits for the viewer, then lists its meshes and materials (the names to map). */
window.__parts = async () => {
  for (let i = 0; i < 240 && (!window.histoApi || document.querySelector('.organ-loading')); i++) await new Promise(r => setTimeout(r, 500));
  const api = window.histoApi;
  if (!api) return 'ainda carregando';
  const nodes = await new Promise(r => api.getNodeMap((e, v) => r(v)));
  const geo = Object.values(nodes).filter(n => n.type === 'Geometry').map(n => `${n.instanceID}:${n.name}`);
  const mats = await new Promise(r => api.getMaterialList((e, m) => r(e ? [] : m.map(x => x.name))));
  return {geo: geo.slice(0, 120), n: geo.length, mats};
};
/** Markers at chosen screenshot points [name, x, y] (Browser-pane screenshot frame, `scale` css px per frame px). */
window.__at = async (list, zoom = 0.35, scale = 1.8) => {
  const api = window.histoApi; const call = (fn, ...a) => new Promise(r => api[fn](...a, (e, v) => r(v)));
  const ifr = document.querySelector('.sketchfab-frame').getBoundingClientRect();
  const nodes = await call('getNodeMap'); const byId = {}; Object.values(nodes).forEach(n => byId[n.instanceID] = n.name);
  const cam = await call('getCameraLookAt'); const d = cam.position.map((x, i) => x - cam.target[i]); const L = Math.hypot(...d);
  const out = [];
  for (const [name, sx, sy] of list) {
    const v = await call('pickFromScreen', [sx * scale - ifr.left, sy * scale - ifr.top]);
    if (!v) { out.push({name, miss: true}); continue; }
    const p = v.position3D.map(x => +x.toFixed(4));
    out.push({name, node: byId[v.instanceID], p, eye: p.map((x, i) => +(x + d[i] / L * zoom * L).toFixed(4)), target: p});
  }
  window.__out = out.filter(o => !o.miss);
  return out.map(o => `${o.name}: ${o.miss ? 'MISS' : o.node}`);
};
