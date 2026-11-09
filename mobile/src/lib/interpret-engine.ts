import { DREAM_SYMBOLS, PROPHETIC_THEMES, TONES, type LibraryEntry, type Tone } from '@/data/interpret-library';

import { BOOKS, bookIndex, formatRef, type ScriptureRef } from './bible';
import { detectCrisis } from './crisis';
import { hashString, keywordScore, normalizeForMatching } from './insight-engine';
import type { Interpretation, InterpretationKind, InterpretationPoint } from './types';

const MAX_POINTS = 4;
const BOOK_ALIASES: Record<string, string> = { psalm: 'Psalms' };

/** Parses "Book C:V" or "Book C:V-V" into a reference; null when the book is unknown. */
export function parseRef(ref: string): ScriptureRef | null {
  const m = /^(.+?) (\d+):(\d+)(?:-(\d+))?$/.exec(ref.trim());
  if (!m) return null;
  const name = BOOK_ALIASES[m[1].toLowerCase()] ?? m[1];
  const book = bookIndex(name);
  if (book < 0) return null;
  return { book: BOOKS[book].name, chapter: Number(m[2]), verse: Number(m[3]), endVerse: m[4] ? Number(m[4]) : null };
}

function refs(list: string[]): ScriptureRef[] {
  return list.map(parseRef).filter((r): r is ScriptureRef => r !== null);
}

function pick<T>(items: T[], seed: number, offset = 0): T {
  return items[(seed + offset) % items.length];
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** Library entries found in the text, strongest first; ties go to whichever appears earlier. */
export function matchEntries(normalized: string, library: LibraryEntry[]): LibraryEntry[] {
  const position = (entry: LibraryEntry) =>
    Math.min(...entry.keywords.map((k) => normalized.indexOf(` ${k}`)).filter((i) => i >= 0));
  return library
    .map((entry) => ({ entry, score: keywordScore(normalized, entry.keywords) }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || position(a.entry) - position(b.entry))
    .map((m) => m.entry);
}

/** The strongest feeling in the text; on a tie, the one mentioned last (how a dream ended matters most). */
export function detectTone(normalized: string): Tone | null {
  const last = (keywords: string[]) => Math.max(...keywords.map((k) => normalized.lastIndexOf(` ${k}`)));
  const best = TONES.map((t) => ({ tone: t.tone, score: keywordScore(normalized, t.keywords), at: last(t.keywords) })).sort(
    (a, b) => b.score - a.score || b.at - a.at,
  )[0];
  return best && best.score > 0 ? best.tone : null;
}

/** "water often pictures X; a door, Y; and light, Z" — one clause per image so meanings stay readable. */
function describeMeanings(entries: LibraryEntry[], verb: string): string {
  const clauses = entries.map((e, i) =>
    i === 0 ? `${e.heading.toLowerCase()} ${verb} ${e.meaning}` : `${e.heading.toLowerCase()}, ${e.meaning}`,
  );
  if (clauses.length <= 1) return clauses.join('');
  return `${clauses.slice(0, -1).join('; ')}; and ${clauses[clauses.length - 1]}`;
}

const DREAM_OPENINGS: Record<Tone | 'none', string> = {
  fear: 'It sounds like this dream left you shaken. Take a breath — you are safe, and God is with you as you think it through.',
  peace: 'There is a sense of peace in what you describe. Peace is often a quiet sign of God’s nearness.',
  joy: 'This sounds like a dream that left you glad, and that is worth thanking God for.',
  sorrow: 'There is sadness in this dream, and God is close to the brokenhearted — you can bring that feeling straight to Him.',
  confusion: 'Dreams can be strange and hard to make sense of. That is normal, and God gives wisdom to those who ask.',
  none: 'Thank you for writing this dream down. Let’s bring it to Scripture with humility and an open heart.',
};

const DREAM_CLOSINGS = [
  'Rather than reading this as a fixed code, treat these images as invitations to pray: ask God what He may be highlighting, and hold any meaning loosely until it is confirmed by His Word and by people who know you well.',
  'Not every dream carries a message, but every dream can become a conversation with God. Ask Him what, if anything, He wants you to notice — and let Scripture have the final word.',
];

const DREAM_FALLBACK_POINTS: { heading: string; body: string; refs: string[] }[] = [
  {
    heading: 'The feeling it left',
    body: 'Often the most important part of a dream is how it made you feel. Name that feeling and bring it to God — He cares about what stirs in you, even while you sleep.',
    refs: ['Psalm 4:8', 'Psalm 139:23'],
  },
  {
    heading: 'Bring it to God',
    body: 'Joseph and Daniel both said that understanding belongs to God. Ask Him for wisdom, and do not feel pressure to find meaning where there may be none.',
    refs: ['Daniel 2:28', 'James 1:5'],
  },
];

const PROPHETIC_FALLBACK_POINTS: { heading: string; body: string; refs: string[] }[] = [
  {
    heading: 'Test the word',
    body: 'Ask three questions: does it agree with Scripture, does it point you to Jesus, and does it build up, encourage or comfort? A word from God will not contradict His written Word.',
    refs: ['1 Corinthians 14:3', '1 John 4:1'],
  },
  {
    heading: 'Hold it with open hands',
    body: 'Mary treasured what she heard and pondered it in her heart. You can do the same — pray, wait, and let God confirm His word in His time.',
    refs: ['Luke 2:19', 'Habakkuk 2:3'],
  },
];

/** Specific concerns in a prophetic word, checked before the general cautions. */
const PROPHETIC_FLAGS: { pattern: RegExp; caution: string }[] = [
  {
    pattern:
      /\b(by|before|in|on|within)\s+(january|february|march|april|may|june|july|august|september|october|november|december|\d{4}|next (week|month|year)|\d+ (days|weeks|months|years))\b/,
    caution:
      'This word mentions a specific time. Scripture says a word that does not come to pass was not spoken by the Lord (Deuteronomy 18:22) — wait and see rather than planning your life around a date.',
  },
  {
    pattern: /\b(marry|married|marriage|husband|wife|spouse|engaged)\b/,
    caution:
      'Be very careful with any word about whom to marry. That decision belongs to you before God, with prayer, wisdom and counsel — not to a prophecy.',
  },
  {
    pattern: /\b(money|rich|wealth|millionaire|lottery|financial breakthrough|debt free|seed|offering)\b/,
    caution:
      'Treat promises of money with care, and be wary of any word that is linked to giving money to the person who shared it.',
  },
  {
    pattern: /\b(die|death|dead|curse|cursed|witchcraft|bewitched)\b/,
    caution:
      'A word that announces death or a curse over you should not be received in fear. In Christ you are redeemed from the curse (Galatians 3:13), and your life is in God’s hands.',
  },
  {
    pattern: /\b(quit|resign|divorce|sell everything|leave (your|my) (job|church|husband|wife|family))\b/,
    caution:
      'Do not make a major life decision — leaving a job, a church or a marriage — on the basis of one word. Wait for clear confirmation and seek wise counsel.',
  },
];

const PROPHETIC_CAUTIONS = [
  'Test every word: does it agree with Scripture and point you to Jesus? (1 John 4:1)',
  'True prophecy builds up, encourages and comforts (1 Corinthians 14:3). It should never control, frighten or condemn you.',
  'Share this word with a mature pastor or leader and pray before acting on it.',
];

const FEARFUL_IMAGES = new Set(['snake', 'chased', 'falling', 'death', 'darkness', 'flood', 'trapped', 'battle', 'blood', 'shaking', 'lion']);

function dreamCautions(tone: Tone | null, entries: LibraryEntry[]): string[] {
  const frightening = tone === 'fear' || entries.some((e) => FEARFUL_IMAGES.has(e.id));
  return [
    'Not every dream carries a message — some simply come from the busyness of the day (Ecclesiastes 5:3).',
    'Never make an important decision on the basis of a dream alone. Seek God in Scripture and ask for wise counsel (Proverbs 11:14).',
    frightening
      ? 'A frightening dream does not mean something bad will happen. God has not given you a spirit of fear (2 Timothy 1:7).'
      : 'This is a reflection to help you pray, not a prophecy or a word from God. Share the dream with a mature believer you trust.',
  ];
}

function dreamPrayer(tone: Tone | null): string {
  switch (tone) {
    case 'fear':
      return 'Lord, this dream unsettled me. Thank You that You are with me in the night as well as the day. Quiet my heart, take away all fear, and show me anything You want me to see. Amen.';
    case 'peace':
    case 'joy':
      return 'Father, thank You for this dream and the peace it left with me. If You are speaking, give me ears to hear; if not, let it simply draw me closer to You. Amen.';
    case 'sorrow':
      return 'Lord, You see the sadness this dream stirred in me. Comfort my heart, heal what hurts, and help me rest in Your love tonight. Amen.';
    default:
      return 'Lord, I bring this dream to You. Give me wisdom to understand what is from You, peace to let go of what is not, and a heart that trusts You either way. Amen.';
  }
}

const PROPHETIC_PRAYERS = [
  'Father, I bring this word before You. If it is from You, confirm it and bring it to pass in Your time. If it is not, guard my heart from confusion. Keep me anchored in Your Word and close to Jesus. Amen.',
  'Lord, give me a discerning heart. Let me hold on to what is good, let go of what is not from You, and walk faithfully in what You have already shown me in Scripture. Amen.',
];

/**
 * Interprets a dream or a prophetic word entirely on the device: finds the images or themes in
 * the text, reads its emotional tone, and composes a Scripture-based reflection with the right
 * cautions. Nothing leaves the device.
 */
export function generateLocalInterpretation(
  kind: InterpretationKind,
  text: string,
): Omit<Interpretation, 'id' | 'createdAt'> {
  const normalized = normalizeForMatching(text);
  const seed = hashString(text.trim().toLowerCase());
  const entries = matchEntries(normalized, kind === 'dream' ? DREAM_SYMBOLS : PROPHETIC_THEMES).slice(0, MAX_POINTS);
  const tone = detectTone(normalized);
  const toneRef = tone ? TONES.find((t) => t.tone === tone)?.ref : undefined;

  const points: InterpretationPoint[] = (
    entries.length > 0 ? entries : kind === 'dream' ? DREAM_FALLBACK_POINTS : PROPHETIC_FALLBACK_POINTS
  ).map((e) => ({ heading: e.heading, body: e.body, refs: refs(e.refs) }));

  const readRefs: ScriptureRef[] = [];
  const addRef = (ref: string | undefined) => {
    const parsed = ref ? parseRef(ref) : null;
    if (parsed && !readRefs.some((r) => formatRef(r) === formatRef(parsed))) readRefs.push(parsed);
  };
  entries.slice(0, 2).forEach((e) => addRef(e.refs[0]));
  addRef(toneRef);
  for (const fallback of kind === 'dream' ? ['Psalm 119:105', 'James 1:5'] : ['1 Thessalonians 5:21', '1 John 4:1']) {
    if (readRefs.length < 3) addRef(fallback);
  }

  const lead = entries.slice(0, 3);
  const names = lead.map((e) => e.heading.toLowerCase());
  let summary: string[];
  let title: string;
  let cautions: string[];
  let steps: string[];
  let prayer: string;

  if (kind === 'dream') {
    title = entries[0]?.title ?? 'A dream to bring to God';
    summary = [
      DREAM_OPENINGS[tone ?? 'none'],
      entries.length > 0
        ? `${names.length === 1 ? 'The image that stands out is' : 'The images that stand out are'} ${joinList(names)}. In Scripture, ${describeMeanings(lead, 'often pictures')}.`
        : 'This dream doesn’t contain images with a clear parallel in Scripture, and that is okay — many dreams simply help us process the day. Notice the feeling it left with you, and bring that to God in prayer.',
      pick(DREAM_CLOSINGS, seed),
    ];
    cautions = dreamCautions(tone, entries);
    steps = [
      'Write the dream down with today’s date, and note how you felt when you woke.',
      readRefs[0]
        ? `Read ${formatRef(readRefs[0])} slowly and ask God what, if anything, He wants you to see.`
        : 'Spend five quiet minutes asking God, “Is there anything You want me to notice?”',
      pick(
        [
          'Share the dream with a mature believer you trust and pray about it together.',
          'Thank God that He watches over you by night as well as by day, and rest in that tonight.',
        ],
        seed,
      ),
    ];
    prayer = dreamPrayer(tone);
  } else {
    title = entries[0]?.title ?? 'A word to weigh';
    summary = [
      'Thank you for sharing this word. Scripture encourages us not to despise prophecy, but to test all things and hold fast to what is good (1 Thessalonians 5:20-21).',
      entries.length > 0
        ? `The main ${names.length === 1 ? 'theme' : 'themes'} in it ${names.length === 1 ? 'is' : 'are'} ${joinList(names)}. In Scripture, ${describeMeanings(lead, 'speaks of')}. Where a word agrees with God’s character and His written Word, it can encourage and strengthen you.`
        : 'This word doesn’t point to one clear biblical theme, so weigh it slowly. Ask whether it draws you closer to Jesus, agrees with Scripture, and bears good fruit.',
      'Where it adds specific promises — dates, names, amounts or major decisions — hold it carefully and wait for clear confirmation.',
    ];
    const flagged = PROPHETIC_FLAGS.filter((f) => f.pattern.test(normalized)).map((f) => f.caution);
    cautions = [...flagged, ...PROPHETIC_CAUTIONS].slice(0, 3);
    steps = [
      'Write the word down exactly as you received it, with the date and who shared it.',
      readRefs[0]
        ? `Read ${formatRef(readRefs[0])} and compare the word with what Scripture says.`
        : 'Compare the word carefully with what Scripture says.',
      'Pray about it for a week, then share it with your pastor or a mature leader before acting on it.',
    ];
    prayer = pick(PROPHETIC_PRAYERS, seed);
  }

  return {
    kind,
    text,
    title,
    summary: summary.join('\n\n'),
    points,
    refs: readRefs.slice(0, 3),
    cautions,
    steps,
    prayer,
    crisis: detectCrisis(text),
    source: 'on-device',
  };
}
