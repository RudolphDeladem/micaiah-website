import assert from 'node:assert/strict';
import { test } from 'node:test';

import { InsightSchema, THEME_IDS, VERSE_REFS } from '../src/insight.ts';
import { RateLimiter, parseInsightRequest } from '../src/validation.ts';

test('accepts a valid request and trims text', () => {
  assert.deepEqual(parseInsightRequest({ text: '  I am anxious  ', mode: 'prayer' }), {
    text: 'I am anxious',
    mode: 'prayer',
  });
  assert.deepEqual(parseInsightRequest({ text: 'Thank you Lord' }), { text: 'Thank you Lord', mode: 'daily' });
});

test('rejects bad requests', () => {
  assert.equal(typeof parseInsightRequest(null), 'string');
  assert.equal(typeof parseInsightRequest({ text: 'hi' }), 'string');
  assert.equal(typeof parseInsightRequest({ text: 'x'.repeat(5001) }), 'string');
  assert.equal(typeof parseInsightRequest({ text: 'hello world', mode: 'hack' }), 'string');
});

test('rate limiter allows up to the limit per window', () => {
  const limiter = new RateLimiter(2, 1000);
  assert.ok(limiter.allow('a', 0));
  assert.ok(limiter.allow('a', 10));
  assert.ok(!limiter.allow('a', 20));
  assert.ok(limiter.allow('b', 20));
  assert.ok(limiter.allow('a', 1001));
});

test('output schema only admits library themes and verse references', () => {
  assert.ok(THEME_IDS.includes('anxiety'));
  assert.ok(VERSE_REFS.includes('Philippians 4:6-7'));
  const ok = InsightSchema.safeParse({
    themeId: 'anxiety',
    interpretation: 'x',
    verseRefs: ['1 Peter 5:7'],
    steps: ['a', 'b', 'c'],
    prayer: 'Amen.',
    crisis: false,
  });
  assert.ok(ok.success);
  const bad = InsightSchema.safeParse({ ...ok.data, verseRefs: ['Hezekiah 3:16'] });
  assert.ok(!bad.success);
});
