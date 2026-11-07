const HOUR = 60 * 60 * 1000;

/** Sliding one-hour window of questions per IP, kept in memory. */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(private opts: {perHour: number; now: () => number}) {}

  take(ip: string): boolean {
    const now = this.opts.now();
    const recent = (this.hits.get(ip) ?? []).filter(t => now - t < HOUR);
    if (recent.length >= this.opts.perHour) {
      this.hits.set(ip, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(ip, recent);
    if (this.hits.size > 10_000) for (const [key, list] of this.hits) if (!list.some(t => now - t < HOUR)) this.hits.delete(key);
    return true;
  }
}
