import { detectCrisis } from './crisis';
import { DEFAULT_THEME_ID, THEMES, getTheme, getVerse } from './scripture';
import type { Insight, ReflectionMode, Theme, Verse } from './types';

export const MIN_REFLECTION_LENGTH = 3;
export const MAX_REFLECTION_LENGTH = 5000;

/** Small, stable string hash (FNV-1a) used to vary wording deterministically. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const keywordPatterns = new Map<string, RegExp>();
function keywordPattern(keyword: string): RegExp {
  let pattern = keywordPatterns.get(keyword);
  if (!pattern) {
    // Whole-word match, allowing a trailing plural/verb "s" (e.g. "worry" -> "worrys" is harmless).
    pattern = new RegExp(`\\b${escapeRegExp(keyword)}s?\\b`, 'g');
    keywordPatterns.set(keyword, pattern);
  }
  pattern.lastIndex = 0;
  return pattern;
}

export type ThemeScore = { theme: Theme; score: number };

export function scoreThemes(text: string, mode: ReflectionMode = 'daily'): ThemeScore[] {
  const normalized = ` ${text.toLowerCase().replace(/[’‘]/g, "'")} `;
  const scores = THEMES.map((theme) => {
    let score = 0;
    for (const keyword of theme.keywords) {
      const matches = normalized.match(keywordPattern(keyword));
      if (matches) {
        // Multi-word phrases are more specific than single words.
        score += matches.length * (keyword.includes(' ') ? 2 : 1);
      }
    }
    if (mode === 'gratitude' && theme.id === 'gratitude') score += 2;
    return { theme, score };
  });
  return scores.sort((a, b) => b.score - a.score);
}

function pick<T>(items: T[], seed: number, offset = 0): T {
  return items[(seed + offset) % items.length];
}

/** Shown instead of ordinary devotional content when a reflection suggests someone may be in danger. */
function crisisInsight(): Insight {
  return {
    themeId: 'crisis',
    themeLabel: 'You are not alone',
    interpretation:
      'What you shared sounds incredibly heavy, and your life matters deeply — to God and to the people around you. Please reach out right now to someone who can help: a crisis line, emergency services, or a trusted person nearby. Scripture says the Lord is close to the brokenhearted; reaching out for help is not a lack of faith.',
    verses: ['Psalm 34:18', 'Isaiah 41:10', 'Matthew 11:28']
      .map((ref) => getVerse(ref))
      .filter((v): v is Verse => Boolean(v)),
    steps: [
      'Call or text a crisis line now, or your local emergency number if you are in danger.',
      'Tell one trusted person how you are really feeling today.',
      'If you can, stay with someone or go somewhere safe while you wait for support.',
    ],
    prayer: 'Lord, I am hurting and I need You. Hold me close, surround me with people who can help, and give me the strength to reach out today. Amen.',
    source: 'on-device',
    crisis: true,
  };
}

/**
 * Generates a Scripture-based insight entirely on the device. Picks the
 * dominant spiritual theme by keyword analysis and composes curated, theme
 * specific guidance, steps, a prayer, and public-domain KJV verses.
 */
export function generateLocalInsight(text: string, mode: ReflectionMode = 'daily'): Insight {
  if (detectCrisis(text)) return crisisInsight();
  const ranked = scoreThemes(text, mode);
  const top = ranked[0];
  const primary = top.score > 0 ? top.theme : (getTheme(DEFAULT_THEME_ID) as Theme);
  const secondary = ranked.find((r) => r.theme.id !== primary.id && r.score > 0)?.theme;
  const seed = hashString(text.trim().toLowerCase());

  const verses: Verse[] = [pick(primary.verses, seed), pick(primary.verses, seed, 1)];
  if (secondary) {
    const extra = pick(secondary.verses, seed);
    if (!verses.some((v) => v.ref === extra.ref)) verses.push(extra);
  }

  return {
    themeId: primary.id,
    themeLabel: primary.label,
    interpretation: pick(primary.interpretations, seed),
    verses,
    steps: pick(primary.steps, seed),
    prayer: pick(primary.prayers, seed),
    source: 'on-device',
    crisis: false,
  };
}
