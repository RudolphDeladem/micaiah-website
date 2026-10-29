import books from '@/data/bible-books.json';

/**
 * The full Bible, bundled in several public-domain translations (see scripts/build-bibles.mjs).
 * Text is loaded on demand by bible-loader.ts; this module holds the pure helpers.
 */
export type BibleVersionId = 'kjv' | 'web' | 'asv' | 'bbe';

/** string[book][chapter][verse]; verse n is at index n - 1. Empty string = verse not present in this translation. */
export type BibleText = string[][][];

export const BIBLE_VERSIONS: { id: BibleVersionId; abbr: string; name: string; about: string }[] = [
  { id: 'kjv', abbr: 'KJV', name: 'King James Version', about: 'The classic 1611 translation (1769 text).' },
  { id: 'web', abbr: 'WEB', name: 'World English Bible', about: 'A modern-English update of the ASV.' },
  { id: 'asv', abbr: 'ASV', name: 'American Standard Version', about: 'A precise, literal translation from 1901.' },
  { id: 'bbe', abbr: 'BBE', name: 'Bible in Basic English', about: 'Simple, everyday words — easy to read.' },
];

export const DEFAULT_BIBLE_VERSION: BibleVersionId = 'kjv';

export function asBibleVersion(value: unknown): BibleVersionId {
  return BIBLE_VERSIONS.some((v) => v.id === value) ? (value as BibleVersionId) : DEFAULT_BIBLE_VERSION;
}

export function versionInfo(id: BibleVersionId) {
  return BIBLE_VERSIONS.find((v) => v.id === id) ?? BIBLE_VERSIONS[0];
}

export const BOOKS: { name: string; chapters: number }[] = books;
/** Genesis–Malachi are books 0–38; Matthew–Revelation are 39–65. */
export const OLD_TESTAMENT_BOOKS = 39;

const bookByName = new Map(BOOKS.map((b, i) => [b.name.toLowerCase(), i]));

export function bookIndex(name: string): number {
  return bookByName.get(name.trim().toLowerCase()) ?? -1;
}

/** A reference to one verse or a verse range within a chapter. */
export type ScriptureRef = { book: string; chapter: number; verse: number; endVerse?: number | null };

export function formatRef(ref: ScriptureRef): string {
  const range = ref.endVerse && ref.endVerse > ref.verse ? `-${ref.endVerse}` : '';
  return `${ref.book} ${ref.chapter}:${ref.verse}${range}`;
}

/**
 * Normalizes an untrusted reference (e.g. from the AI service). Returns null when the book or
 * chapter does not exist, or — when Bible text is given — the verse does not exist in it.
 * Ranges are capped at 8 verses.
 */
export function normalizeRef(ref: unknown, text?: BibleText): ScriptureRef | null {
  if (!ref || typeof ref !== 'object') return null;
  const r = ref as Record<string, unknown>;
  if (typeof r.book !== 'string') return null;
  const b = bookIndex(r.book);
  const { chapter, verse } = r;
  if (b < 0 || !Number.isInteger(chapter) || !Number.isInteger(verse)) return null;
  const c = chapter as number;
  const v = verse as number;
  if (c < 1 || c > BOOKS[b].chapters || v < 1) return null;
  const verseCount = text ? text[b][c - 1].length : Infinity;
  if (v > verseCount) return null;
  let end = Number.isInteger(r.endVerse) ? (r.endVerse as number) : null;
  if (end !== null && end <= v) end = null;
  if (end !== null) end = Math.min(end, v + 7, verseCount);
  return { book: BOOKS[b].name, chapter: c, verse: v, endVerse: end };
}

/** The verses a reference covers, skipping any the translation omits. */
export function versesFor(text: BibleText, ref: ScriptureRef): { number: number; text: string }[] {
  const b = bookIndex(ref.book);
  const verses = text[b]?.[ref.chapter - 1];
  if (!verses) return [];
  const end = ref.endVerse ?? ref.verse;
  const out: { number: number; text: string }[] = [];
  for (let n = ref.verse; n <= end; n++) if (verses[n - 1]) out.push({ number: n, text: verses[n - 1] });
  return out;
}

export function refText(text: BibleText, ref: ScriptureRef): string {
  return versesFor(text, ref)
    .map((v) => v.text)
    .join(' ');
}

/** The chapter after (or before) this one, crossing book boundaries; null at either end of the Bible. */
export function adjacentChapter(book: number, chapter: number, step: 1 | -1): { book: number; chapter: number } | null {
  const next = chapter + step;
  if (next >= 1 && next <= BOOKS[book].chapters) return { book, chapter: next };
  const nextBook = book + step;
  if (nextBook < 0 || nextBook >= BOOKS.length) return null;
  return { book: nextBook, chapter: step === 1 ? 1 : BOOKS[nextBook].chapters };
}
