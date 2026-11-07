import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {serve} from '@hono/node-server';
import {createApp} from './app';

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = process.env.DIST_DIR ?? path.resolve(here, '../dist');
const port = Number(process.env.PORT ?? 3000);

serve({fetch: createApp({distDir}).fetch, port}, info => {
  console.log(`Atlas ouvindo em http://localhost:${info.port}`);
});
