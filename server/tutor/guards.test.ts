import {BudgetMeter, PRICES} from './budget';
import {RateLimiter} from './rate-limit';
import {clientIp} from './client-ip';

describe('BudgetMeter', () => {
  test('one dollar is used up by 100k input + 30k output tokens on Opus 5.5', () => {
    let now = new Date('2026-11-07T15:00:00Z');
    const meter = new BudgetMeter({dailyUsd: 1, now: () => now});
    expect(meter.canSpend()).toBe(true);
    meter.record('claude-opus-5-5', {input_tokens: 100_000, output_tokens: 30_000});
    expect(meter.spentToday()).toBeCloseTo(1.0);
    expect(meter.canSpend()).toBe(false);
  });

  test('resets at midnight in São Paulo, not at UTC midnight', () => {
    let now = new Date('2026-11-07T23:30:00-03:00');
    const meter = new BudgetMeter({dailyUsd: 1, now: () => now});
    meter.record('claude-opus-5-5', {input_tokens: 250_000, output_tokens: 0});
    now = new Date('2026-11-08T02:30:00Z'); // 23:30 in São Paulo, still the same local day
    expect(meter.canSpend()).toBe(false);
    now = new Date('2026-11-08T00:00:30-03:00');
    expect(meter.canSpend()).toBe(true);
  });

  test('cache reads are billed at the cache price and unknown models at the most expensive price', () => {
    const meter = new BudgetMeter({dailyUsd: 100, now: () => new Date()});
    meter.record('claude-sonnet-5-5', {input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 1_000_000});
    expect(meter.spentToday()).toBeCloseTo(PRICES['claude-sonnet-5-5'].cacheRead);
    meter.record('modelo-desconhecido', {input_tokens: 1_000_000, output_tokens: 0});
    expect(meter.spentToday()).toBeCloseTo(PRICES['claude-sonnet-5-5'].cacheRead + Math.max(...Object.values(PRICES).map(p => p.input)));
  });
});

describe('RateLimiter', () => {
  test('the 31st question within an hour is refused, and allowed again after the hour', () => {
    let t = 0;
    const limiter = new RateLimiter({perHour: 30, now: () => t});
    for (let i = 0; i < 30; i++) expect(limiter.take('1.2.3.4')).toBe(true);
    expect(limiter.take('1.2.3.4')).toBe(false);
    expect(limiter.take('5.6.7.8')).toBe(true);
    t = 60 * 60 * 1000 + 1;
    expect(limiter.take('1.2.3.4')).toBe(true);
  });
});

describe('clientIp', () => {
  test('uses the right-most X-Forwarded-For entry, the one the proxy appended', () => {
    expect(clientIp(new Headers({'x-forwarded-for': '6.6.6.6, 203.0.113.9'}), '10.0.0.2')).toBe('203.0.113.9');
  });
  test('falls back to the socket address', () => {
    expect(clientIp(new Headers(), '10.0.0.2')).toBe('10.0.0.2');
  });
});
