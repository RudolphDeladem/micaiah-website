import data from '@/data/scripture.json';

import type { Theme, Verse } from './types';

export const TRANSLATION = data.translation;
export const TRANSLATION_NAME = data.translationName;
export const THEMES: Theme[] = data.themes;
export const DEFAULT_THEME_ID = 'peace';

const themeById = new Map(THEMES.map((t) => [t.id, t]));
const verseByRef = new Map<string, Verse>();
for (const theme of THEMES) {
  for (const verse of theme.verses) verseByRef.set(verse.ref, verse);
}

export function getTheme(id: string): Theme | undefined {
  return themeById.get(id);
}

export function getVerse(ref: string): Verse | undefined {
  return verseByRef.get(ref);
}

export function allVerses(): Verse[] {
  return [...verseByRef.values()];
}

/** Deterministic verse for a calendar day, so everyone sees the same verse all day. */
export function verseOfTheDay(date = new Date()): Verse & { themeId: string } {
  const pool = THEMES.flatMap((t) => t.verses.map((v) => ({ ...v, themeId: t.id })));
  const dayIndex = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  return pool[dayIndex % pool.length];
}
