import { activityGrid, newlyCompleted, weightChartModel } from '@/logic/progress';

const weights = [{ weekStart: '2026-09-21', kg: 84.2 }, { weekStart: '2026-09-28', kg: 83.6 }];

describe('graf váhy jen pro lose/gain', () => {
  test('cíl none → null (graf se neukáže), i když váhy existují', () => {
    expect(weightChartModel({ kind: 'none' }, weights)).toBeNull();
  });
  test('lose → model', () => {
    const m = weightChartModel({ kind: 'lose', startKg: 84, targetKg: 78 }, weights)!;
    expect(m.targetKg).toBe(78); expect(m.points).toHaveLength(2);
    expect(m.yMin).toBeLessThanOrEqual(78); expect(m.yMax).toBeGreaterThanOrEqual(84.2);
  });
  test('gain → model, cíl nad body', () => {
    const m = weightChartModel({ kind: 'gain', startKg: 62, targetKg: 68 }, [{ weekStart: '2026-09-28', kg: 62 }])!;
    expect(m.yMax).toBeGreaterThanOrEqual(68);
  });
  test('lose/gain bez vah → model s prázdnými body', () => {
    expect(weightChartModel({ kind: 'lose', startKg: 84, targetKg: 78 }, [])?.points).toEqual([]);
  });
  test('bere posledních 8 týdnů, seřazeno', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ weekStart: `2026-${String(7 + Math.floor(i / 4)).padStart(2, '0')}-0${1 + (i % 4)}`, kg: 80 + i }));
    const m = weightChartModel({ kind: 'gain', startKg: 80, targetKg: 95 }, [...many].reverse())!;
    expect(m.points).toHaveLength(8); expect(m.points[0]!.kg).toBe(84);
  });
  test('osa: celá kg, 4 tick hodnoty rostoucí v rozsahu', () => {
    const m = weightChartModel({ kind: 'lose', startKg: 84, targetKg: 78 }, weights)!;
    expect(Number.isInteger(m.yMin) && Number.isInteger(m.yMax)).toBe(true);
    expect(m.yTicks).toHaveLength(4); expect(m.yTicks[0]).toBe(m.yMin); expect(m.yTicks[3]).toBe(m.yMax);
    expect([...m.yTicks].sort((a, b) => a - b)).toEqual(m.yTicks);
  });
});

test('activityGrid: 35 buněk po–ne, dnes, budoucí prázdné, dev-xp neaktivní', () => {
  const g = activityGrid([{ id: '1', at: '', day: '2026-09-29', lessonId: 'bc-1-1', xp: 30 }, { id: '2', at: '', day: '2026-09-30', lessonId: 'dev-xp', xp: 500 }], '2026-10-01');
  expect(g).toHaveLength(35);
  expect(g[0]!.day).toBe('2026-08-31'); expect(g[34]!.day).toBe('2026-10-04');
  const at = (d: string) => g.find((c) => c.day === d)?.state;
  expect([at('2026-09-29'), at('2026-09-30'), at('2026-10-01'), at('2026-10-02')]).toEqual(['active', 'empty', 'today', 'future']);
});

test('newlyCompleted: jen přechod z nesplněného na splněný', () => {
  const m = (current: number) => [{ id: 'a', label: '', target: 10, unit: 'reps' as const, current, custom: false }];
  expect(newlyCompleted(m(9), m(10))).toEqual(['a']);
  expect(newlyCompleted(m(10), m(12))).toEqual([]);
  expect(newlyCompleted(m(10), m(3))).toEqual([]);
});
