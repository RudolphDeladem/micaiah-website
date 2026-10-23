/**
 * Detects language suggesting someone may be at risk of harm, so the app can
 * surface crisis resources before any devotional content. Deliberately broad:
 * a false positive shows a caring resource card; a false negative could miss
 * someone in danger.
 */
const CRISIS_PATTERNS: RegExp[] = [
  /\bkill(ing)? my ?self\b/,
  /\bsuicid(e|al)\b/,
  /\bend (my|it all|my own) li(fe|ves)\b/,
  /\bend it all\b/,
  /\btake my (own )?life\b/,
  /\bwant(ed)? to die\b/,
  /\bwish i (was|were) dead\b/,
  /\bbetter off dead\b/,
  /\bbetter off without me\b/,
  /\bno reason to live\b/,
  /\bdon'?t want to (live|be alive|wake up)\b/,
  /\b(hurt(ing)?|harm(ing)?|cut(ting)?|starv(e|ing)) my ?self\b/,
  /\bself[- ]?harm\b/,
  /\boverdose\b/,
  /\b(hits|hit|beats|beat|abuses|abused|chokes|choked|strangles|strangled|rapes|raped) me\b/,
  /\babusive (husband|wife|partner|boyfriend|girlfriend|parent|father|mother|home|relationship)\b/,
  /\bbeing abused\b/,
  /\bnot safe at home\b/,
];

export function detectCrisis(text: string): boolean {
  const normalized = text.toLowerCase().replace(/[’‘]/g, "'");
  return CRISIS_PATTERNS.some((pattern) => pattern.test(normalized));
}

export type CrisisResource = {
  region: string;
  name: string;
  detail: string;
  /** tel: or https: link; omitted when the number depends on the user's country. */
  url?: string;
};

export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    region: 'Emergency',
    name: 'Call your local emergency number',
    detail: 'If you or someone else is in immediate danger, call emergency services now (911 in the US, 999 in the UK, 112 in the EU).',
  },
  {
    region: 'United States & Canada',
    name: '988 Suicide & Crisis Lifeline',
    detail: 'Call or text 988 — free, confidential, 24/7.',
    url: 'tel:988',
  },
  {
    region: 'United Kingdom & Ireland',
    name: 'Samaritans',
    detail: 'Call 116 123 — free, 24/7.',
    url: 'tel:116123',
  },
  {
    region: 'Worldwide',
    name: 'Find a Helpline',
    detail: 'Free, confidential support lines in over 100 countries.',
    url: 'https://findahelpline.com',
  },
];
