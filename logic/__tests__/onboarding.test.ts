import { buildInitialProfile, mockWeightHistory, parseWeight, validateWeightGoal } from '@/logic/onboarding';

test('parseWeight přijme čárku i tečku a odmítne nesmysly', () => {
  expect(parseWeight('72,5')).toBe(72.5); expect(parseWeight(' 80 ')).toBe(80);
  expect(parseWeight('')).toBeNull(); expect(parseWeight('abc')).toBeNull(); expect(parseWeight('7O')).toBeNull();
});
test.each([
  ['lose', 80, 75, 'ok'], ['lose', 80, 85, 'loseDirection'], ['gain', 70, 75, 'ok'], ['gain', 70, 65, 'gainDirection'],
  ['lose', 20, 15, 'invalid'], ['gain', null, 75, 'invalid'], ['lose', 80, 80, 'loseDirection'],
] as const)('%s %p → %p = %s', (kind, cur, tgt, out) => { expect(validateWeightGoal(kind, cur, tgt)).toBe(out); });
test('mockWeightHistory: 8 týdnů, pondělky, trend k cíli, poslední týden je aktuální', () => {
  const now = new Date(2026, 8, 29);
  const h = mockWeightHistory({ kind: 'lose', startKg: 84, targetKg: 78 }, now, 1);
  expect(h).toHaveLength(8); expect(h.at(-1)!.weekStart).toBe('2026-09-28');
  expect(h[0]!.kg).toBeGreaterThan(h.at(-1)!.kg);
  expect(h.at(-1)!.kg).toBe(84);
});
test('bez cíle se historie váhy negeneruje', () => {
  const p = buildInitialProfile({ path: 'power', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } }, new Date());
  expect(p.weights).toEqual([]); expect(p.leagueTier).toBe('wood'); expect(p.activity).toEqual([]);
});
