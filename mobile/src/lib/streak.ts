import type { Entry } from './types';

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Consecutive days (in local time) with at least one reflection, ending today
 * or yesterday — a streak is not broken until a full day is missed.
 */
export function currentStreak(entries: Pick<Entry, 'createdAt'>[], now = new Date()): number {
  const days = new Set(entries.map((e) => dayKey(new Date(e.createdAt))));
  let cursor = days.has(dayKey(now)) ? now : addDays(now, -1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(entries: Pick<Entry, 'createdAt'>[]): number {
  const days = [...new Set(entries.map((e) => dayKey(new Date(e.createdAt))))].sort();
  let best = 0;
  let run = 0;
  let previous: Date | null = null;
  for (const key of days) {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    run = previous && dayKey(addDays(previous, 1)) === key ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}
