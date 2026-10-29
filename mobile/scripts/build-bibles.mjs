// Builds the bundled Bible translations (all public domain) into compact asset files:
//   assets/bibles/<id>.bible  — JSON: string[book][chapter][verse] (verse n at index n-1; "" if absent)
//   src/data/bible-books.json — canonical book names and chapter counts
// Run from mobile/:  node scripts/build-bibles.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const BOOKS = [
  ['Genesis', 'genesis'], ['Exodus', 'exodus'], ['Leviticus', 'leviticus'], ['Numbers', 'numbers'],
  ['Deuteronomy', 'deuteronomy'], ['Joshua', 'joshua'], ['Judges', 'judges'], ['Ruth', 'ruth'],
  ['1 Samuel', '1samuel'], ['2 Samuel', '2samuel'], ['1 Kings', '1kings'], ['2 Kings', '2kings'],
  ['1 Chronicles', '1chronicles'], ['2 Chronicles', '2chronicles'], ['Ezra', 'ezra'], ['Nehemiah', 'nehemiah'],
  ['Esther', 'esther'], ['Job', 'job'], ['Psalms', 'psalms'], ['Proverbs', 'proverbs'],
  ['Ecclesiastes', 'ecclesiastes'], ['Song of Solomon', 'songofsolomon'], ['Isaiah', 'isaiah'],
  ['Jeremiah', 'jeremiah'], ['Lamentations', 'lamentations'], ['Ezekiel', 'ezekiel'], ['Daniel', 'daniel'],
  ['Hosea', 'hosea'], ['Joel', 'joel'], ['Amos', 'amos'], ['Obadiah', 'obadiah'], ['Jonah', 'jonah'],
  ['Micah', 'micah'], ['Nahum', 'nahum'], ['Habakkuk', 'habakkuk'], ['Zephaniah', 'zephaniah'],
  ['Haggai', 'haggai'], ['Zechariah', 'zechariah'], ['Malachi', 'malachi'], ['Matthew', 'matthew'],
  ['Mark', 'mark'], ['Luke', 'luke'], ['John', 'john'], ['Acts', 'acts'], ['Romans', 'romans'],
  ['1 Corinthians', '1corinthians'], ['2 Corinthians', '2corinthians'], ['Galatians', 'galatians'],
  ['Ephesians', 'ephesians'], ['Philippians', 'philippians'], ['Colossians', 'colossians'],
  ['1 Thessalonians', '1thessalonians'], ['2 Thessalonians', '2thessalonians'], ['1 Timothy', '1timothy'],
  ['2 Timothy', '2timothy'], ['Titus', 'titus'], ['Philemon', 'philemon'], ['Hebrews', 'hebrews'],
  ['James', 'james'], ['1 Peter', '1peter'], ['2 Peter', '2peter'], ['1 John', '1john'], ['2 John', '2john'],
  ['3 John', '3john'], ['Jude', 'jude'], ['Revelation', 'revelation'],
];

const SCROLLMAPPER = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json';
const WEB_SOURCE = 'https://raw.githubusercontent.com/TehShrike/world-english-bible/master/json';

const tidy = (s) => s.replace(/\s+/g, ' ').trim();

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

/** scrollmapper format: { books: [{ chapters: [{ verses: [{ verse, text }] }] }] } */
async function fromScrollmapper(code, clean) {
  const data = await getJson(`${SCROLLMAPPER}/${code}.json`);
  if (data.books.length !== 66) throw new Error(`${code}: expected 66 books`);
  return data.books.map((book) =>
    book.chapters.map((chapter) => {
      const verses = [];
      for (const v of chapter.verses) verses[v.verse - 1] = clean(tidy(v.text));
      return Array.from(verses, (v) => v ?? '');
    }),
  );
}

/** World English Bible: one file per book, a flat list of paragraph/line pieces tagged with chapter & verse. */
async function fromWeb() {
  const books = [];
  for (const [, file] of BOOKS) {
    const pieces = await getJson(`${WEB_SOURCE}/${file}.json`);
    const chapters = [];
    for (const p of pieces) {
      if (typeof p.value !== 'string' || !p.chapterNumber || !p.verseNumber) continue;
      const verses = (chapters[p.chapterNumber - 1] ??= []);
      verses[p.verseNumber - 1] = `${verses[p.verseNumber - 1] ?? ''} ${p.value}`;
    }
    books.push(Array.from(chapters, (verses) => Array.from(verses ?? [], (v) => (v ? tidy(v) : ''))));
  }
  return books;
}

const TRANSLATIONS = [
  { id: 'kjv', load: () => fromScrollmapper('KJV', (t) => t.replace(/–/g, '-')) },
  { id: 'web', load: fromWeb },
  { id: 'asv', load: () => fromScrollmapper('ASV', (t) => t) },
  { id: 'bbe', load: () => fromScrollmapper('BBE', (t) => tidy(t.replace(/\*+/g, ''))) },
];

mkdirSync('assets/bibles', { recursive: true });
let chapterCounts;
for (const { id, load } of TRANSLATIONS) {
  const books = await load();
  const counts = books.map((b) => b.length);
  chapterCounts ??= counts;
  if (counts.join() !== chapterCounts.join()) throw new Error(`${id}: chapter counts differ from KJV`);
  const verses = books.flat(2);
  const empty = verses.filter((v) => !v).length;
  writeFileSync(`assets/bibles/${id}.bible`, JSON.stringify(books));
  console.log(`${id}: ${verses.length} verse slots, ${empty} empty`);
}
writeFileSync(
  'src/data/bible-books.json',
  `[\n${BOOKS.map(([name], i) => ` ${JSON.stringify({ name, chapters: chapterCounts[i] })}`).join(',\n')}\n]\n`,
);
