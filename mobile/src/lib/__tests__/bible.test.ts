/// <reference types="jest" />
import {
  BIBLE_VERSIONS,
  BOOKS,
  OLD_TESTAMENT_BOOKS,
  adjacentChapter,
  asBibleVersion,
  formatRef,
  normalizeRef,
  refText,
  type BibleText,
} from '../bible';

// Jest runs in Node (from mobile/), where the bundled asset files can be read directly.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs: { readFileSync(file: string, encoding: 'utf8'): string } = require('fs');

function readBible(id: string): BibleText {
  return JSON.parse(fs.readFileSync(`${process.cwd()}/assets/bibles/${id}.bible`, 'utf8'));
}

const kjv = readBible('kjv');

describe('bundled Bibles', () => {
  it('has the 66-book canon', () => {
    expect(BOOKS).toHaveLength(66);
    expect(BOOKS[OLD_TESTAMENT_BOOKS - 1].name).toBe('Malachi');
    expect(BOOKS[OLD_TESTAMENT_BOOKS].name).toBe('Matthew');
  });

  it.each(BIBLE_VERSIONS.map((v) => v.id))('%s matches the book and chapter structure', (id) => {
    const text = id === 'kjv' ? kjv : readBible(id);
    expect(text).toHaveLength(66);
    text.forEach((book, b) => expect(book).toHaveLength(BOOKS[b].chapters));
    const verses = text.flat(2);
    expect(verses.length).toBeGreaterThan(31_000);
    expect(verses.filter((v) => !v).length).toBeLessThan(30);
    expect(text[42][2][15]).toMatch(/God so loved the world|God had such love for the world/);
  });
});

describe('references', () => {
  it('normalizes valid references and caps ranges', () => {
    expect(normalizeRef({ book: 'john', chapter: 3, verse: 16 }, kjv)).toEqual({
      book: 'John',
      chapter: 3,
      verse: 16,
      endVerse: null,
    });
    expect(normalizeRef({ book: 'Psalms', chapter: 23, verse: 1, endVerse: 40 }, kjv)?.endVerse).toBe(6);
    expect(normalizeRef({ book: 'Genesis', chapter: 1, verse: 1, endVerse: 1 })?.endVerse).toBeNull();
  });

  it('rejects references that do not exist', () => {
    expect(normalizeRef({ book: 'Hezekiah', chapter: 3, verse: 16 })).toBeNull();
    expect(normalizeRef({ book: 'Jude', chapter: 2, verse: 1 })).toBeNull();
    expect(normalizeRef({ book: 'John', chapter: 3, verse: 99 }, kjv)).toBeNull();
    expect(normalizeRef({ book: 'John', chapter: 3.5, verse: 1 })).toBeNull();
    expect(normalizeRef('John 3:16')).toBeNull();
  });

  it('formats and resolves text', () => {
    const ref = { book: 'Philippians', chapter: 4, verse: 6, endVerse: 7 };
    expect(formatRef(ref)).toBe('Philippians 4:6-7');
    expect(refText(kjv, ref)).toMatch(/^Be careful for nothing.*Christ Jesus\.$/);
  });

  it('walks across book boundaries', () => {
    expect(adjacentChapter(0, 50, 1)).toEqual({ book: 1, chapter: 1 });
    expect(adjacentChapter(1, 1, -1)).toEqual({ book: 0, chapter: 50 });
    expect(adjacentChapter(0, 1, -1)).toBeNull();
    expect(adjacentChapter(65, 22, 1)).toBeNull();
  });

  it('falls back to KJV for unknown versions', () => {
    expect(asBibleVersion('web')).toBe('web');
    expect(asBibleVersion('niv')).toBe('kjv');
  });
});
