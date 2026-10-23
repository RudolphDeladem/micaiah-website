/// <reference types="jest" />
import { parseCloudResponse } from '../cloud-insight';
import { detectCrisis } from '../crisis';
import { generateLocalInsight, scoreThemes } from '../insight-engine';
import { THEMES, getVerse, verseOfTheDay } from '../scripture';
import { currentStreak, longestStreak } from '../streak';

describe('scripture library', () => {
  it('has well-formed themes', () => {
    const ids = new Set<string>();
    for (const theme of THEMES) {
      expect(ids.has(theme.id)).toBe(false);
      ids.add(theme.id);
      expect(theme.verses.length).toBeGreaterThanOrEqual(4);
      expect(theme.interpretations.length).toBeGreaterThanOrEqual(2);
      expect(theme.prayers.length).toBeGreaterThanOrEqual(2);
      for (const steps of theme.steps) expect(steps).toHaveLength(3);
      for (const keyword of theme.keywords) expect(keyword).toBe(keyword.toLowerCase());
    }
  });

  it('never has two different texts for the same reference', () => {
    const seen = new Map<string, string>();
    for (const verse of THEMES.flatMap((t) => t.verses)) {
      if (seen.has(verse.ref)) expect(seen.get(verse.ref)).toBe(verse.text);
      seen.set(verse.ref, verse.text);
    }
  });

  it('picks a stable verse of the day', () => {
    const day = new Date(2026, 9, 23, 8);
    expect(verseOfTheDay(day)).toEqual(verseOfTheDay(new Date(2026, 9, 23, 22)));
  });
});

describe('generateLocalInsight', () => {
  it.each([
    ['I feel so anxious and overwhelmed about everything', 'anxiety'],
    ['I am scared and afraid of what will happen', 'fear'],
    ['My grandmother passed away last week and I miss her', 'grief'],
    ['I am so thankful and grateful for my family', 'gratitude'],
    ['I need guidance on a big decision about a job offer', 'guidance'],
    ['I feel so lonely, like no one cares', 'loneliness'],
    ['I keep feeling guilty and ashamed of my mistake', 'forgiveness'],
    ['I am exhausted and burned out', 'weariness'],
  ])('maps "%s" to %s', (text, themeId) => {
    expect(generateLocalInsight(text).themeId).toBe(themeId);
  });

  it('falls back to the peace theme when nothing matches', () => {
    expect(generateLocalInsight('Hello there').themeId).toBe('peace');
  });

  it('biases gratitude mode toward gratitude', () => {
    expect(scoreThemes('today', 'gratitude')[0].theme.id).toBe('gratitude');
  });

  it('is deterministic and returns complete content', () => {
    const a = generateLocalInsight('Lord, I am worried about my exams');
    const b = generateLocalInsight('Lord, I am worried about my exams');
    expect(a).toEqual(b);
    expect(a.verses.length).toBeGreaterThanOrEqual(2);
    expect(a.steps).toHaveLength(3);
    expect(a.prayer.length).toBeGreaterThan(10);
    expect(a.source).toBe('on-device');
    expect(new Set(a.verses.map((v) => v.ref)).size).toBe(a.verses.length);
  });

  it('flags crisis language and responds with safety-first content', () => {
    const crisis = generateLocalInsight('I want to end my life');
    expect(crisis.crisis).toBe(true);
    expect(crisis.steps[0]).toMatch(/crisis line/);
    expect(crisis.verses.length).toBe(3);
    expect(generateLocalInsight('I want to grow in my prayer life').crisis).toBe(false);
  });
});

describe('detectCrisis', () => {
  it.each([
    'I want to kill myself',
    'sometimes I feel suicidal',
    'everyone would be better off without me',
    "I don't want to wake up tomorrow",
    'I have been cutting myself',
    'My husband hits me',
  ])('detects "%s"', (text) => expect(detectCrisis(text)).toBe(true));

  it.each(['I am dying to see my family', 'the deadline is killing me', 'I want to live for God'])(
    'does not flag "%s"',
    (text) => expect(detectCrisis(text)).toBe(false),
  );
});

describe('streaks', () => {
  const at = (y: number, m: number, d: number) => ({ createdAt: new Date(y, m - 1, d, 9).toISOString() });

  it('counts consecutive days ending today', () => {
    const entries = [at(2026, 10, 23), at(2026, 10, 22), at(2026, 10, 21), at(2026, 10, 19)];
    expect(currentStreak(entries, new Date(2026, 9, 23, 20))).toBe(3);
  });

  it('keeps the streak alive until a full day is missed', () => {
    const entries = [at(2026, 10, 22), at(2026, 10, 21)];
    expect(currentStreak(entries, new Date(2026, 9, 23, 7))).toBe(2);
    expect(currentStreak(entries, new Date(2026, 9, 24, 7))).toBe(0);
  });

  it('finds the longest run, across month boundaries', () => {
    const entries = [at(2026, 9, 29), at(2026, 9, 30), at(2026, 10, 1), at(2026, 10, 5)];
    expect(longestStreak(entries)).toBe(3);
  });
});

describe('parseCloudResponse', () => {
  const valid = {
    themeId: 'anxiety',
    interpretation: 'You are carrying a lot.',
    verseRefs: ['Philippians 4:6-7', 'Made Up 1:1', '1 Peter 5:7'],
    steps: ['Breathe', 'Pray', 'Rest'],
    prayer: 'Lord, give me peace. Amen.',
  };

  it('keeps only verses from the bundled library, with bundled text', () => {
    const insight = parseCloudResponse(valid, 'worried')!;
    expect(insight.verses.map((v) => v.ref)).toEqual(['Philippians 4:6-7', '1 Peter 5:7']);
    expect(insight.verses[0].text).toBe(getVerse('Philippians 4:6-7')!.text);
    expect(insight.source).toBe('cloud');
  });

  it('rejects unknown themes and malformed payloads', () => {
    expect(parseCloudResponse({ ...valid, themeId: 'nope' }, 'x')).toBeNull();
    expect(parseCloudResponse({ ...valid, steps: 'not an array' }, 'x')).toBeNull();
    expect(parseCloudResponse(null, 'x')).toBeNull();
  });

  it('falls back to theme verses when the model cites none from the library', () => {
    const insight = parseCloudResponse({ ...valid, verseRefs: ['Made Up 1:1'] }, 'x')!;
    expect(insight.verses.length).toBeGreaterThan(0);
  });

  it('applies on-device crisis detection regardless of the server', () => {
    expect(parseCloudResponse(valid, 'I want to kill myself')!.crisis).toBe(true);
  });
});
