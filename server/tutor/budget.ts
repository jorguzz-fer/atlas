/** US$ per million tokens. */
export const PRICES: Record<string, {input: number; output: number; cacheRead: number}> = {
  'claude-opus-5-5': {input: 4, output: 20, cacheRead: 0.2},
  'claude-sonnet-5-5': {input: 2, output: 10, cacheRead: 0.2},
  'claude-haiku-5-5': {input: 0.1, output: 0.5, cacheRead: 0.01},
  // Possible server-side fallback targets.
  'claude-opus-4-8': {input: 5, output: 25, cacheRead: 0.5},
  'claude-opus-5': {input: 5, output: 25, cacheRead: 0.5},
};

const MOST_EXPENSIVE = {
  input: Math.max(...Object.values(PRICES).map(p => p.input)),
  output: Math.max(...Object.values(PRICES).map(p => p.output)),
  cacheRead: Math.max(...Object.values(PRICES).map(p => p.cacheRead)),
};

export type Usage = {input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null};

const dayIn = (date: Date, timeZone: string) => new Intl.DateTimeFormat('en-CA', {timeZone, year: 'numeric', month: '2-digit', day: '2-digit'}).format(date);

/** Daily spending cap in dollars, from the real token usage of each answer. Resets at local midnight. */
export class BudgetMeter {
  private day = '';
  private spent = 0;
  constructor(private opts: {dailyUsd: number; now: () => Date; timeZone?: string}) {}

  private roll() {
    const today = dayIn(this.opts.now(), this.opts.timeZone ?? 'America/Sao_Paulo');
    if (today !== this.day) { this.day = today; this.spent = 0; }
  }

  canSpend(): boolean {
    this.roll();
    return this.spent < this.opts.dailyUsd;
  }

  spentToday(): number {
    this.roll();
    return this.spent;
  }

  record(model: string, usage: Usage) {
    this.roll();
    const price = PRICES[model] ?? MOST_EXPENSIVE;
    const input = usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) * 1.25;
    this.spent += (input * price.input + usage.output_tokens * price.output + (usage.cache_read_input_tokens ?? 0) * price.cacheRead) / 1_000_000;
  }
}
