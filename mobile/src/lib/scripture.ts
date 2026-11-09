import extra from '@/data/scripture-extra.json';
import data from '@/data/scripture.json';

import type { ReflectionMode, Theme, Verse } from './types';

type ThemeExtra = Pick<Theme, 'interpretations' | 'steps' | 'prayers' | 'questions' | 'verses'>;
const extraThemes = extra.themes as Record<string, ThemeExtra>;

export const TRANSLATION = data.translation;
export const TRANSLATION_NAME = data.translationName;
/** Core themes merged with the extra devotional content (scripture-extra.json). */
export const THEMES: Theme[] = data.themes.map((theme) => {
  const more = extraThemes[theme.id];
  return {
    ...theme,
    interpretations: [...theme.interpretations, ...(more?.interpretations ?? [])],
    steps: [...theme.steps, ...(more?.steps ?? [])],
    prayers: [...theme.prayers, ...(more?.prayers ?? [])],
    questions: more?.questions ?? [],
    verses: [...theme.verses, ...(more?.verses ?? []).filter((v) => !theme.verses.some((t) => t.ref === v.ref))],
  };
});

/** Opening lines that acknowledge how the person came (reflection, prayer or gratitude). */
export const OPENINGS: Record<ReflectionMode, string[]> = extra.openings;
/** Lines that connect a second theme found in the same reflection; `{theme}` is replaced. */
export const BRIDGES: string[] = extra.bridges;
/** One closing step per mode, added after the theme's steps. */
export const MODE_STEPS: Record<ReflectionMode, string[]> = extra.modeSteps;
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
