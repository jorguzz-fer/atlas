import fs from 'node:fs/promises';
import path from 'node:path';
import {Hono} from 'hono';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  // Model chunks: the browser decompresses them itself, so they are served as opaque bytes.
  '.gz': 'application/octet-stream',
  '.glb': 'model/gltf-binary',
};

async function readInside(root: string, urlPath: string): Promise<Buffer | null> {
  const file = path.resolve(root, '.' + decodeURIComponent(urlPath));
  if (file !== root && !file.startsWith(root + path.sep)) return null;
  try {
    const stat = await fs.stat(file);
    return stat.isFile() ? await fs.readFile(file) : null;
  } catch {
    return null;
  }
}

export function createApp(opts: {distDir: string; tutor?: Hono}): Hono {
  const root = path.resolve(opts.distDir);
  const app = new Hono();

  app.use('*', async (c, next) => {
    await next();
    c.header('X-Robots-Tag', 'noindex, nofollow');
  });

  app.get('/healthz', c => c.json({ok: true}));
  if (opts.tutor) app.route('/api/tutor', opts.tutor);

  app.get('*', async c => {
    const urlPath = new URL(c.req.url).pathname;
    const body = await readInside(root, urlPath);
    if (body) {
      const ext = path.extname(urlPath);
      const immutable = urlPath.startsWith('/models/') || urlPath.startsWith('/assets/');
      return c.body(new Uint8Array(body), 200, {
        'Content-Type': TYPES[ext] ?? 'application/octet-stream',
        'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
      });
    }
    const index = await readInside(root, '/index.html');
    if (!index) return c.text('Not found', 404);
    return c.body(new Uint8Array(index), 200, {'Content-Type': TYPES['.html'], 'Cache-Control': 'no-cache'});
  });

  return app;
}
