/// <reference types="jest" />
import { parseInterpretation, parseUsage, remaining } from '../interpret';

jest.mock('../install-id', () => ({ getInstallId: async () => `m_${'0'.repeat(32)}` }));

const valid = {
  title: '  Rising water  ',
  summary: 'This dream may speak of feeling overwhelmed.',
  points: [
    { heading: 'Water', body: 'In Scripture, deep waters often picture trouble.', refs: [{ book: 'Isaiah', chapter: 43, verse: 2, endVerse: null }] },
    { heading: '', body: 'dropped: no heading', refs: [] },
  ],
  refs: [
    { book: 'Psalms', chapter: 23, verse: 1, endVerse: 6 },
    { book: 'Hezekiah', chapter: 1, verse: 1, endVerse: null },
  ],
  cautions: ['Do not make a major decision on a dream alone.'],
  steps: ['Pray', 'Read Psalm 23', 'Talk to your pastor', 'extra'],
  prayer: 'Lord, give me peace. Amen.',
  crisis: false,
};

describe('parseInterpretation', () => {
  it('keeps valid content and drops invalid references and points', () => {
    const out = parseInterpretation(valid, 'dream', 'I dreamt the water kept rising');
    expect(out).not.toBeNull();
    expect(out!.title).toBe('Rising water');
    expect(out!.points).toHaveLength(1);
    expect(out!.refs).toEqual([{ book: 'Psalms', chapter: 23, verse: 1, endVerse: 6 }]);
    expect(out!.steps).toHaveLength(3);
    expect(out!.kind).toBe('dream');
  });

  it('flags crisis language on-device even if the service does not', () => {
    const out = parseInterpretation(valid, 'dream', 'I dreamt about wanting to kill myself');
    expect(out!.crisis).toBe(true);
  });

  it('rejects incomplete payloads', () => {
    expect(parseInterpretation(null, 'dream', 'x')).toBeNull();
    expect(parseInterpretation({ ...valid, summary: '' }, 'dream', 'x')).toBeNull();
    expect(parseInterpretation({ ...valid, steps: [] }, 'prophetic', 'x')).toBeNull();
  });
});

describe('usage', () => {
  const usage = {
    plan: 'free',
    subscriptionsEnabled: true,
    resetsAt: '2026-11-01T00:00:00.000Z',
    limits: { free: 1, plus: 20 },
    dream: { used: 1, limit: 1 },
    prophetic: { used: 0, limit: 1 },
  };

  it('parses the service response and computes what is left', () => {
    const parsed = parseUsage(usage);
    expect(parsed).not.toBeNull();
    expect(remaining(parsed, 'dream')).toBe(0);
    expect(remaining(parsed, 'prophetic')).toBe(1);
    expect(remaining(null, 'dream')).toBeNull();
  });

  it('rejects malformed usage', () => {
    expect(parseUsage({ ...usage, plan: 'gold' })).toBeNull();
    expect(parseUsage({ ...usage, dream: { used: -1, limit: 1 } })).toBeNull();
  });
});
