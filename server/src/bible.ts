import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const bibleDir = process.env.BIBLE_DIR ?? path.resolve(here, '../../mobile');

/** The app's book list and KJV text (mobile/scripts/build-bibles.mjs), used to validate references the model cites. */
const books: { name: string; chapters: number }[] = JSON.parse(
  readFileSync(path.join(bibleDir, 'src/data/bible-books.json'), 'utf8'),
);
const kjv: string[][][] = JSON.parse(readFileSync(path.join(bibleDir, 'assets/bibles/kjv.bible'), 'utf8'));

export const BOOK_NAMES = books.map((b) => b.name) as [string, ...string[]];

export type ScriptureRef = { book: string; chapter: number; verse: number; endVerse: number | null };

/** Returns the reference if it exists in the KJV (ranges capped at 8 verses), otherwise null. */
export function validateRef(ref: ScriptureRef): ScriptureRef | null {
  const b = BOOK_NAMES.indexOf(ref.book);
  const verses = kjv[b]?.[ref.chapter - 1];
  if (!verses || !Number.isInteger(ref.verse) || ref.verse < 1 || ref.verse > verses.length) return null;
  let end = Number.isInteger(ref.endVerse) && ref.endVerse! > ref.verse ? ref.endVerse! : null;
  if (end !== null) end = Math.min(end, ref.verse + 7, verses.length);
  return { book: ref.book, chapter: ref.chapter, verse: ref.verse, endVerse: end };
}

export function validRefs(refs: ScriptureRef[], max: number): ScriptureRef[] {
  const seen = new Set<string>();
  const out: ScriptureRef[] = [];
  for (const ref of refs) {
    const valid = validateRef(ref);
    const key = valid && `${valid.book} ${valid.chapter}:${valid.verse}`;
    if (!valid || seen.has(key!)) continue;
    seen.add(key!);
    out.push(valid);
    if (out.length === max) break;
  }
  return out;
}
