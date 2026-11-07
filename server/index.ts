import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {serve} from '@hono/node-server';
import {getConnInfo} from '@hono/node-server/conninfo';
import {createApp} from './app';
import {createTutor} from './tutor/routes';
import {loadCatalog} from './tutor/catalog';
import {BudgetMeter} from './tutor/budget';
import {RateLimiter} from './tutor/rate-limit';
import {createClaudeTurn} from './tutor/llm';

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = process.env.DIST_DIR ?? path.resolve(here, '../dist');
const port = Number(process.env.PORT ?? 3000);
const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
const model = process.env.TUTOR_MODEL || 'claude-opus-5-5';
const dataRoot = fs.existsSync(path.join(distDir, 'models/atlas.json')) ? distDir : path.resolve(here, '../public');

const tutor = createTutor({
  catalog: loadCatalog(dataRoot),
  budget: new BudgetMeter({dailyUsd: Number(process.env.TUTOR_DAILY_BUDGET_USD ?? 1), now: () => new Date()}),
  limiter: new RateLimiter({perHour: Number(process.env.TUTOR_RATE_LIMIT_PER_HOUR ?? 30), now: () => Date.now()}),
  llm: apiKey ? createClaudeTurn({apiKey, model}) : null,
  maxConcurrent: Number(process.env.TUTOR_MAX_CONCURRENT ?? 3),
  remoteOf: c => { try { return getConnInfo(c).remote.address ?? ''; } catch { return ''; } },
});

serve({fetch: createApp({distDir, tutor}).fetch, port}, info => {
  console.log(`Atlas ouvindo em http://localhost:${info.port} (tutor: ${apiKey ? model : 'desligado, falta ANTHROPIC_API_KEY'})`);
});
