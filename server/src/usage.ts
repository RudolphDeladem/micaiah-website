import { readFileSync, renameSync, writeFileSync } from 'node:fs';

import type { Kind } from './interpret.ts';

export type Plan = 'free' | 'plus';

function intEnv(name: string, fallback: number): number {
  const n = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Interpretations allowed per month, per kind (dream and prophetic are counted separately). */
export const LIMITS: Record<Plan, number> = {
  free: intEnv('FREE_INTERPRETATIONS_PER_MONTH', 1),
  plus: intEnv('PLUS_INTERPRETATIONS_PER_MONTH', 20),
};

/** Calendar month in UTC, e.g. "2026-10". */
export function monthKey(now = new Date()): string {
  return now.toISOString().slice(0, 7);
}

/** First instant of the next UTC month. */
export function monthResetsAt(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

/**
 * Monthly interpretation counts per install ID. Kept in memory and, when USAGE_FILE is set,
 * mirrored to a JSON file (mount a volume there so counts survive restarts and deploys).
 * Only counts are stored — never the text people submit.
 */
export class UsageStore {
  private counts = new Map<string, number>();
  private readonly file: string | undefined;
  private saveTimer: NodeJS.Timeout | undefined;

  constructor(file?: string) {
    this.file = file;
    if (!file) return;
    try {
      const saved = JSON.parse(readFileSync(file, 'utf8')) as Record<string, number>;
      const month = monthKey();
      for (const [key, count] of Object.entries(saved)) if (key.startsWith(month)) this.counts.set(key, count);
    } catch {
      // No file yet (first run) — start empty.
    }
  }

  private key(user: string, kind: Kind, month: string) {
    return `${month}|${kind}|${user}`;
  }

  used(user: string, kind: Kind, month = monthKey()): number {
    return this.counts.get(this.key(user, kind, month)) ?? 0;
  }

  /** Reserves one use if the limit allows; returns false when the limit is reached. */
  tryReserve(user: string, kind: Kind, limit: number, month = monthKey()): boolean {
    const key = this.key(user, kind, month);
    const used = this.counts.get(key) ?? 0;
    if (used >= limit) return false;
    this.counts.set(key, used + 1);
    this.scheduleSave();
    return true;
  }

  /** Gives a reserved use back (the interpretation failed). */
  release(user: string, kind: Kind, month = monthKey()) {
    const key = this.key(user, kind, month);
    const used = this.counts.get(key) ?? 0;
    if (used <= 1) this.counts.delete(key);
    else this.counts.set(key, used - 1);
    this.scheduleSave();
  }

  private scheduleSave() {
    if (!this.file || this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = undefined;
      const month = monthKey();
      for (const key of this.counts.keys()) if (!key.startsWith(month)) this.counts.delete(key);
      try {
        writeFileSync(`${this.file}.tmp`, JSON.stringify(Object.fromEntries(this.counts)));
        renameSync(`${this.file}.tmp`, this.file!);
      } catch (error) {
        console.error(JSON.stringify({ event: 'usage_save_error', message: (error as Error).message }));
      }
    }, 2000);
    this.saveTimer.unref();
  }
}
