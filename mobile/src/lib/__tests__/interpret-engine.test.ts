/// <reference types="jest" />
import { DREAM_SYMBOLS, PROPHETIC_THEMES, TONES } from '@/data/interpret-library';

import { formatRef, normalizeRef, refText, type BibleText } from '../bible';
import { detectTone, generateLocalInterpretation, matchEntries, parseRef } from '../interpret-engine';
import { normalizeForMatching } from '../insight-engine';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs: { readFileSync(file: string, encoding: 'utf8'): string } = require('fs');
const kjv: BibleText = JSON.parse(fs.readFileSync(`${process.cwd()}/assets/bibles/kjv.bible`, 'utf8'));

const everyRef = [
  ...DREAM_SYMBOLS.flatMap((e) => e.refs),
  ...PROPHETIC_THEMES.flatMap((e) => e.refs),
  ...TONES.map((t) => t.ref),
  // Fallbacks used inside the engine.
  'Psalm 4:8',
  'Psalm 139:23',
  'Daniel 2:28',
  'James 1:5',
  '1 Corinthians 14:3',
  '1 John 4:1',
  'Luke 2:19',
  'Habakkuk 2:3',
  'Psalm 119:105',
  '1 Thessalonians 5:21',
];

describe('interpretation library', () => {
  it.each(everyRef)('%s exists in the bundled Bible', (ref) => {
    const parsed = parseRef(ref);
    expect(parsed).not.toBeNull();
    const normalized = normalizeRef(parsed, kjv);
    expect(normalized).not.toBeNull();
    // Ranges must not be cut short by normalizeRef.
    expect(formatRef(normalized!)).toBe(formatRef(parsed!));
    expect(refText(kjv, parsed!).length).toBeGreaterThan(10);
  });

  it('has unique ids and complete entries', () => {
    for (const library of [DREAM_SYMBOLS, PROPHETIC_THEMES]) {
      expect(new Set(library.map((e) => e.id)).size).toBe(library.length);
      for (const e of library) {
        expect(e.keywords.length).toBeGreaterThan(0);
        expect(e.keywords.every((k) => k === k.toLowerCase())).toBe(true);
        expect(e.body.length).toBeGreaterThan(80);
        expect(e.refs.length).toBe(2);
      }
    }
  });
});

describe('generateLocalInterpretation — dreams', () => {
  const dream =
    'Last night I dreamt I was being chased through a dark forest by a snake. I was terrified, then I found a door with light behind it.';

  it('finds the main images and the tone', () => {
    const normalized = normalizeForMatching(dream);
    const ids = matchEntries(normalized, DREAM_SYMBOLS).map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(['chased', 'snake', 'darkness', 'door', 'light']));
    expect(detectTone(normalized)).toBe('fear');
  });

  it('writes a full, careful interpretation', () => {
    const out = generateLocalInterpretation('dream', dream);
    expect(out.kind).toBe('dream');
    expect(out.source).toBe('on-device');
    expect(out.title.length).toBeGreaterThan(3);
    expect(out.summary.split('\n\n')).toHaveLength(3);
    expect(out.summary).toMatch(/shaken/);
    expect(out.points).toHaveLength(4);
    for (const p of out.points) expect(p.refs.length).toBe(2);
    expect(out.refs.length).toBe(3);
    expect(out.cautions).toHaveLength(3);
    expect(out.cautions[2]).toMatch(/spirit of fear/);
    expect(out.steps).toHaveLength(3);
    expect(out.prayer).toMatch(/Amen\.$/);
    expect(out.crisis).toBe(false);
  });

  it('lets the ending decide a mixed tone, and keeps each meaning in its own clause', () => {
    const out = generateLocalInterpretation(
      'dream',
      'I stood by a river. A storm came and I was afraid, but then a door opened and I felt peace.',
    );
    expect(out.summary).toMatch(/^There is a sense of peace/);
    expect(out.summary).toMatch(/a door often pictures [^;]+; water, life, cleansing and the Holy Spirit; and /);
  });

  it('is deterministic', () => {
    expect(generateLocalInterpretation('dream', dream)).toEqual(generateLocalInterpretation('dream', dream));
  });

  it('still helps when no image is recognised', () => {
    const out = generateLocalInterpretation('dream', 'It was very vague and I hardly remember anything at all.');
    expect(out.title).toBe('A dream to bring to God');
    expect(out.points.length).toBe(2);
    expect(out.refs.length).toBeGreaterThanOrEqual(2);
    expect(out.steps).toHaveLength(3);
  });

  it('flags crisis language', () => {
    expect(generateLocalInterpretation('dream', 'I dreamt about water and I want to kill myself').crisis).toBe(true);
  });
});

describe('generateLocalInterpretation — prophetic words', () => {
  it('weighs the themes in a word', () => {
    const out = generateLocalInterpretation(
      'prophetic',
      'The Lord says He will restore the lost years and open new doors for you in this new season.',
    );
    expect(out.kind).toBe('prophetic');
    expect(out.points.map((p) => p.heading)).toEqual(expect.arrayContaining(['Restoration', 'A new season']));
    expect(out.cautions[0]).toMatch(/1 John 4:1/);
    expect(out.summary).toMatch(/test all things/);
  });

  it.each([
    ['You will marry a man named David', /whom to marry/],
    ['You will become a millionaire by December', /specific time/],
    ['A curse is on your family and someone will die', /curse/],
    ['God says quit your job and move abroad', /major life decision/],
  ])('raises the right caution for "%s"', (word, caution) => {
    const out = generateLocalInterpretation('prophetic', word);
    expect(out.cautions.some((c) => caution.test(c))).toBe(true);
    expect(out.cautions.length).toBeLessThanOrEqual(3);
  });
});
