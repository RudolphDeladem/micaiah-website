import { detectCrisis } from './crisis';
import { generateLocalInsight } from './insight-engine';
import { getTheme, getVerse } from './scripture';
import type { Insight, ReflectionMode, Verse } from './types';

/**
 * Optional cloud insight endpoint (see /server). When unset, the app runs
 * fully on-device. Set EXPO_PUBLIC_INSIGHT_API_URL at build time to enable.
 */
export const INSIGHT_API_URL = (process.env.EXPO_PUBLIC_INSIGHT_API_URL ?? '').replace(/\/+$/, '');
export const cloudInsightAvailable = INSIGHT_API_URL.length > 0;

const REQUEST_TIMEOUT_MS = 25_000;

type CloudResponse = {
  themeId: string;
  interpretation: string;
  verseRefs: string[];
  steps: string[];
  prayer: string;
  crisis?: boolean;
};

function isNonEmptyString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

/** Validates an untrusted server payload and maps verse references onto the bundled KJV text. */
export function parseCloudResponse(payload: unknown, text: string): Insight | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Partial<CloudResponse>;
  const theme = typeof p.themeId === 'string' ? getTheme(p.themeId) : undefined;
  if (!theme) return null;
  if (!isNonEmptyString(p.interpretation, 1500) || !isNonEmptyString(p.prayer, 1000)) return null;
  if (!Array.isArray(p.steps) || !Array.isArray(p.verseRefs)) return null;

  const steps = p.steps.filter((s): s is string => isNonEmptyString(s, 300)).slice(0, 5);
  // Scripture text always comes from the bundled library, never from the model.
  const verses = p.verseRefs
    .map((ref) => (typeof ref === 'string' ? getVerse(ref) : undefined))
    .filter((v): v is Verse => Boolean(v))
    .filter((v, i, all) => all.findIndex((x) => x.ref === v.ref) === i)
    .slice(0, 3);
  if (steps.length === 0) return null;
  if (verses.length === 0) verses.push(...theme.verses.slice(0, 2));

  return {
    themeId: theme.id,
    themeLabel: theme.label,
    interpretation: p.interpretation.trim(),
    verses,
    steps,
    prayer: p.prayer.trim(),
    source: 'cloud',
    crisis: detectCrisis(text) || p.crisis === true,
  };
}

export async function fetchCloudInsight(
  text: string,
  mode: ReflectionMode,
  signal?: AbortSignal,
): Promise<Insight> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  try {
    const response = await fetch(`${INSIGHT_API_URL}/v1/insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, mode }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Insight service returned ${response.status}`);
    const insight = parseCloudResponse(await response.json(), text);
    if (!insight) throw new Error('Insight service returned an invalid response');
    return insight;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export type InsightResult = { insight: Insight; usedFallback: boolean };

/**
 * Uses the cloud service only when it is configured AND the user has opted in;
 * otherwise (or on any failure) generates the insight on-device.
 */
export async function generateInsight(
  text: string,
  mode: ReflectionMode,
  options: { cloudConsent: boolean | null; signal?: AbortSignal },
): Promise<InsightResult> {
  if (cloudInsightAvailable && options.cloudConsent === true) {
    try {
      return { insight: await fetchCloudInsight(text, mode, options.signal), usedFallback: false };
    } catch (error) {
      if (options.signal?.aborted) throw error;
      return { insight: generateLocalInsight(text, mode), usedFallback: true };
    }
  }
  return { insight: generateLocalInsight(text, mode), usedFallback: false };
}
