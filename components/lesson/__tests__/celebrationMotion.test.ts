import { MAX_XP_TICKS, once, xpTickStep, xpTickValues } from '../celebration';

test('count-up XP má nejvýš 8 ticků a končí přesně na součtu', () => {
  for (const total of [1, 7, 8, 9, 20, 30, 33, 64, 999]) {
    const v = xpTickValues(total);
    expect(v.length).toBeLessThanOrEqual(MAX_XP_TICKS);
    expect(v[v.length - 1]).toBe(total);
    expect(v).toEqual([...v].sort((a, b) => a - b));
  }
});

test('nulové XP nemá žádný tick, krok je aspoň 1', () => {
  expect(xpTickValues(0)).toEqual([]);
  expect(xpTickStep(0)).toBe(1);
  expect(xpTickStep(30)).toBe(4);
});

test('skipToEnd brána je idempotentní', () => {
  const fn = jest.fn();
  const g = once(fn);
  expect(g.done).toBe(false);
  g.run(); g.run(); g.run();
  expect(fn).toHaveBeenCalledTimes(1);
  expect(g.done).toBe(true);
});
