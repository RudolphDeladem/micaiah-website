/// <reference types="jest" />
import { FREE_PER_MONTH, currentUsage, emptyUsage, freeLeft, loadFreeUsage, monthKey, renewsOn, saveFreeUsage, withUse } from '../free-allowance';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const nov = new Date(2026, 10, 10); // November 10, 2026 (local time)
const dec = new Date(2026, 11, 1);

describe('free monthly allowance', () => {
  it('uses the local calendar month', () => {
    expect(monthKey(nov)).toBe('2026-11');
    expect(monthKey(new Date(2026, 0, 31))).toBe('2026-01');
    expect(renewsOn(nov)).toEqual(dec);
  });

  it('counts each kind separately down to zero', () => {
    let usage = emptyUsage(nov);
    expect(freeLeft(usage, 'dream', nov)).toBe(FREE_PER_MONTH);
    for (let i = 0; i < FREE_PER_MONTH; i++) usage = withUse(usage, 'dream', nov);
    expect(freeLeft(usage, 'dream', nov)).toBe(0);
    expect(freeLeft(usage, 'prophetic', nov)).toBe(FREE_PER_MONTH);
    expect(freeLeft(withUse(usage, 'dream', nov), 'dream', nov)).toBe(0);
  });

  it('starts again at zero in a new month', () => {
    const used = withUse(withUse(emptyUsage(nov), 'dream', nov), 'dream', nov);
    expect(freeLeft(used, 'dream', dec)).toBe(FREE_PER_MONTH);
    expect(withUse(used, 'dream', dec)).toEqual({ month: '2026-12', dream: 1, prophetic: 0 });
  });

  it('saves and loads the counts for this month', async () => {
    expect(await loadFreeUsage()).toEqual(emptyUsage());
    const used = withUse(emptyUsage(), 'prophetic');
    await saveFreeUsage(used);
    expect(await loadFreeUsage()).toEqual(used);
  });

  it('treats missing or corrupt stored counts as a fresh month', () => {
    expect(currentUsage(null, nov)).toEqual(emptyUsage(nov));
    expect(currentUsage('nonsense', nov)).toEqual(emptyUsage(nov));
    expect(currentUsage({ month: '2026-11', dream: -4, prophetic: 1.5 }, nov)).toEqual(emptyUsage(nov));
    expect(currentUsage({ month: '2026-11', dream: 2, prophetic: 1 }, nov)).toEqual({ month: '2026-11', dream: 2, prophetic: 1 });
  });
});
