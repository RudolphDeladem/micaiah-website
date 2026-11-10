import AsyncStorage from '@react-native-async-storage/async-storage';

import type { InterpretationKind } from './types';

/**
 * Without the AI service, Micaiah Plus unlocks unlimited on-device Dream Interpretation and
 * Prophetic Word; everyone else gets this many of each per calendar month, counted on the device.
 */
export const FREE_PER_MONTH = 3;

const KEY = 'micaiah.free-usage.v1';

export type FreeUsage = { month: string; dream: number; prophetic: number };

/** Local calendar month, e.g. "2026-11" — the allowance renews on the 1st where the person lives. */
export function monthKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function emptyUsage(now = new Date()): FreeUsage {
  return { month: monthKey(now), dream: 0, prophetic: 0 };
}

/** Counts for the current month; last month's (or unreadable) counts start again at zero. */
export function currentUsage(stored: unknown, now = new Date()): FreeUsage {
  const s = stored as Partial<FreeUsage> | null;
  if (!s || s.month !== monthKey(now)) return emptyUsage(now);
  const count = (n: unknown) => (Number.isInteger(n) && (n as number) >= 0 ? (n as number) : 0);
  return { month: s.month, dream: count(s.dream), prophetic: count(s.prophetic) };
}

export function freeLeft(usage: FreeUsage, kind: InterpretationKind, now = new Date()): number {
  return Math.max(0, FREE_PER_MONTH - currentUsage(usage, now)[kind]);
}

export function withUse(usage: FreeUsage, kind: InterpretationKind, now = new Date()): FreeUsage {
  const current = currentUsage(usage, now);
  return { ...current, [kind]: current[kind] + 1 };
}

/** First day of next month, for "renews on December 1". */
export function renewsOn(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

export async function loadFreeUsage(): Promise<FreeUsage> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return currentUsage(raw ? JSON.parse(raw) : null);
  } catch {
    return emptyUsage();
  }
}

export async function saveFreeUsage(usage: FreeUsage): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(usage));
}
