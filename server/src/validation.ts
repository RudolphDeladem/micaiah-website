export const MIN_TEXT = 3;
export const MAX_TEXT = 5000;
const MODES = new Set(['daily', 'prayer', 'gratitude']);

export type InsightRequest = { text: string; mode: 'daily' | 'prayer' | 'gratitude' };

export function parseInsightRequest(body: unknown): InsightRequest | string {
  if (!body || typeof body !== 'object') return 'Body must be a JSON object';
  const { text, mode = 'daily' } = body as Record<string, unknown>;
  if (typeof text !== 'string') return '"text" must be a string';
  const trimmed = text.trim();
  if (trimmed.length < MIN_TEXT || trimmed.length > MAX_TEXT) return `"text" must be ${MIN_TEXT}–${MAX_TEXT} characters`;
  if (typeof mode !== 'string' || !MODES.has(mode)) return '"mode" must be daily, prayer, or gratitude';
  return { text: trimmed, mode: mode as InsightRequest['mode'] };
}

/** Fixed-window, per-key rate limiter kept in memory (one instance per server process). */
export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  allow(key: string, now = Date.now()): boolean {
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      if (this.hits.size > 10_000) this.prune(now);
      return true;
    }
    entry.count++;
    return entry.count <= this.limit;
  }

  private prune(now: number) {
    for (const [key, entry] of this.hits) if (entry.resetAt <= now) this.hits.delete(key);
  }
}
