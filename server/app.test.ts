import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from './app';

let distDir: string;
beforeAll(() => {
  distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-dist-'));
  fs.mkdirSync(path.join(distDir, 'models'));
  fs.writeFileSync(path.join(distDir, 'index.html'), '<!doctype html><title>Atlas</title>');
  fs.writeFileSync(path.join(distDir, 'models', 'body-0.bin.gz'), Buffer.from([0x1f, 0x8b, 1, 2, 3]));
});
afterAll(() => fs.rmSync(distDir, {recursive: true, force: true}));

test('serves gzip model chunks as raw bytes with immutable caching', async () => {
  const res = await createApp({distDir}).request('/models/body-0.bin.gz');
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toBe('application/octet-stream');
  expect(res.headers.get('content-encoding')).toBeNull();
  expect(res.headers.get('cache-control')).toContain('immutable');
  expect(new Uint8Array(await res.arrayBuffer())[0]).toBe(0x1f);
});

test('falls back to index.html for unknown routes', async () => {
  const res = await createApp({distDir}).request('/qualquer/rota');
  expect(res.status).toBe(200);
  expect(await res.text()).toContain('<title>Atlas</title>');
});

test('does not serve files outside the dist directory', async () => {
  fs.writeFileSync(path.join(path.dirname(distDir), 'atlas-secret.txt'), 'segredo');
  const res = await createApp({distDir}).request('/..%2Fatlas-secret.txt');
  expect(await res.text()).not.toContain('segredo');
});

test('healthz reports ok', async () => {
  const res = await createApp({distDir}).request('/healthz');
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ok: true});
});

test('every response asks search engines not to index', async () => {
  const app = createApp({distDir});
  for (const url of ['/healthz', '/', '/models/body-0.bin.gz']) {
    expect((await app.request(url)).headers.get('x-robots-tag')).toBe('noindex, nofollow');
  }
});
