import assert from 'node:assert/strict';
import { test } from 'node:test';

import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

import { BOOK_NAMES, validateRef } from '../src/bible.ts';
import { hasActiveEntitlement } from '../src/entitlements.ts';
import { InterpretationSchema, sanitize } from '../src/interpret.ts';
import { UsageStore, monthKey, monthResetsAt } from '../src/usage.ts';
import { parseInterpretRequest, parseUserId } from '../src/validation.ts';

const USER = `m_${'a'.repeat(32)}`;

test('validates interpret requests and install IDs', () => {
  assert.deepEqual(parseInterpretRequest({ kind: 'dream', text: '  I dreamt of a river  ' }), {
    kind: 'dream',
    text: 'I dreamt of a river',
  });
  assert.equal(typeof parseInterpretRequest({ kind: 'tarot', text: 'I dreamt of a river' }), 'string');
  assert.equal(typeof parseInterpretRequest({ kind: 'prophetic', text: 'short' }), 'string');
  assert.equal(parseUserId(USER), USER);
  assert.equal(parseUserId('m_123'), null);
  assert.equal(parseUserId(undefined), null);
});

test('only real Bible references survive', () => {
  assert.equal(BOOK_NAMES.length, 66);
  assert.deepEqual(validateRef({ book: 'Genesis', chapter: 41, verse: 1, endVerse: 50 }), {
    book: 'Genesis',
    chapter: 41,
    verse: 1,
    endVerse: 8,
  });
  assert.equal(validateRef({ book: 'Jude', chapter: 2, verse: 1, endVerse: null }), null);
  assert.equal(validateRef({ book: 'John', chapter: 3, verse: 40, endVerse: null }), null);
});

test('sanitize drops invented references and trims lists', () => {
  const out = sanitize({
    title: 'Rising water',
    summary: 's',
    points: [{ heading: 'Water', body: 'b', refs: [{ book: 'Psalms', chapter: 151, verse: 1, endVerse: null }] }],
    refs: [
      { book: 'Joel', chapter: 2, verse: 28, endVerse: null },
      { book: 'Joel', chapter: 2, verse: 28, endVerse: null },
      { book: 'Daniel', chapter: 2, verse: 19, endVerse: 22 },
    ],
    cautions: ['a', 'b', 'c', 'd'],
    steps: ['1', '2', '3', '4'],
    prayer: 'Amen.',
    crisis: false,
  });
  assert.deepEqual(out.points[0].refs, []);
  assert.equal(out.refs.length, 2);
  assert.equal(out.cautions.length, 3);
  assert.equal(out.steps.length, 3);
});

test('the output schema converts to a structured-output format', () => {
  const format = betaZodOutputFormat(InterpretationSchema);
  assert.equal(format.type, 'json_schema');
  assert.ok(JSON.stringify(format.schema).includes('Revelation'));
});

test('usage store enforces monthly limits per kind and releases failed uses', () => {
  const store = new UsageStore();
  const month = '2026-10';
  assert.ok(store.tryReserve(USER, 'dream', 2, month));
  assert.ok(store.tryReserve(USER, 'dream', 2, month));
  assert.ok(!store.tryReserve(USER, 'dream', 2, month));
  assert.ok(store.tryReserve(USER, 'prophetic', 2, month));
  assert.ok(store.tryReserve(USER, 'dream', 2, '2026-11'));
  store.release(USER, 'dream', month);
  assert.equal(store.used(USER, 'dream', month), 1);
  assert.equal(monthKey(new Date('2026-12-31T23:59:00Z')), '2026-12');
  assert.equal(monthResetsAt(new Date('2026-12-31T23:59:00Z')), '2027-01-01T00:00:00.000Z');
});

test('RevenueCat entitlement check honours expiry and grace periods', () => {
  const now = Date.parse('2026-10-29T00:00:00Z');
  const sub = (e: object) => ({ subscriber: { entitlements: { plus: e } } });
  assert.ok(hasActiveEntitlement(sub({ expires_date: '2026-11-01T00:00:00Z' }), 'plus', now));
  assert.ok(!hasActiveEntitlement(sub({ expires_date: '2026-10-01T00:00:00Z' }), 'plus', now));
  assert.ok(
    hasActiveEntitlement(sub({ expires_date: '2026-10-01T00:00:00Z', grace_period_expires_date: '2026-11-01T00:00:00Z' }), 'plus', now),
  );
  assert.ok(hasActiveEntitlement(sub({ expires_date: null }), 'plus', now));
  assert.ok(!hasActiveEntitlement({ subscriber: { entitlements: {} } }, 'plus', now));
});
