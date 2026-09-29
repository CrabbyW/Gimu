import type { Milestone } from '@/types';
import {
  buildInitialProfile, buildOnboardingInput, customMilestone, isDreamValid, MILESTONES_MAX, MILESTONES_MIN, mockWeightHistory,
  parseMilestoneTarget, parseWeight, toggleMilestone, validateWeightGoal, weightFieldErrors, type OnboardingDraftValues,
} from '@/logic/onboarding';

test('parseWeight přijme čárku i tečku a odmítne nesmysly', () => {
  expect(parseWeight('72,5')).toBe(72.5); expect(parseWeight(' 80 ')).toBe(80);
  expect(parseWeight('')).toBeNull(); expect(parseWeight('abc')).toBeNull(); expect(parseWeight('7O')).toBeNull();
});
test('parseWeight odmítne dvě desetinná místa (mockWeightHistory zaokrouhluje na jedno)', () => {
  expect(parseWeight('72,55')).toBeNull(); expect(parseWeight('72.5')).toBe(72.5);
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

describe('isDreamValid', () => {
  test('stačí 3 znaky po oříznutí mezer', () => {
    expect(isDreamValid('abc')).toBe(true); expect(isDreamValid('  ab  ')).toBe(false); expect(isDreamValid('')).toBe(false);
  });
});

describe('toggleMilestone', () => {
  const m = (id: string): Milestone => ({ id, label: id, target: 1, unit: 'done', current: 0, custom: false });
  test('přidá nevybraný a odebere vybraný', () => {
    expect(toggleMilestone([], m('a'))).toEqual({ milestones: [m('a')], rejected: false });
    expect(toggleMilestone([m('a'), m('b')], m('a'))).toEqual({ milestones: [m('b')], rejected: false });
  });
  test('čtvrtý se odmítne a seznam zůstane beze změny', () => {
    const three = [m('a'), m('b'), m('c')];
    const r = toggleMilestone(three, m('d'));
    expect(r.rejected).toBe(true); expect(r.milestones).toBe(three);
  });
  test('při plném výběru jde vybraný pořád odebrat', () => {
    expect(toggleMilestone([m('a'), m('b'), m('c')], m('c')).milestones).toEqual([m('a'), m('b')]);
  });
  test('limity výběru odpovídají spec §7.1 (2 až 3)', () => {
    expect(MILESTONES_MIN).toBe(2); expect(MILESTONES_MAX).toBe(3);
  });
});

describe('parseMilestoneTarget', () => {
  test.each([['10', 10], [' 60 ', 60], ['1', 1], ['9999', 9999]])('%p → %p', (raw, out) => { expect(parseMilestoneTarget(raw)).toBe(out); });
  test.each(['', '0', '-5', '2,5', 'abc', '10000'])('%p se odmítne', (raw) => { expect(parseMilestoneTarget(raw)).toBeNull(); });
});

describe('customMilestone', () => {
  test('id z času vytvoření, oříznutý název, current 0, custom true', () => {
    expect(customMilestone(' Stojka ', 30, 'seconds', 1_700_000_000_000)).toEqual({
      id: 'custom-1700000000000', label: 'Stojka', target: 30, unit: 'seconds', current: 0, custom: true,
    });
  });
  test('jednotka splněno má vždy cíl 1', () => {
    expect(customMilestone('Salto', 7, 'done', 1).target).toBe(1);
  });
});

describe('weightFieldErrors (Review Focus 5)', () => {
  test('72,5 s čárkou projde', () => {
    expect(weightFieldErrors('lose', '72,5', '68', true)).toEqual({ current: null, target: null });
  });
  test('cíl proti směru je chyba u cílové váhy', () => {
    expect(weightFieldErrors('lose', '72,5', '80', false)).toEqual({ current: null, target: 'loseDirection' });
    expect(weightFieldErrors('gain', '80', '72,5', false)).toEqual({ current: null, target: 'gainDirection' });
    expect(weightFieldErrors('lose', '80', '80', false).target).toBe('loseDirection');
  });
  test('mimo rozsah nebo nesmysl je invalid u daného pole', () => {
    expect(weightFieldErrors('lose', '20', '68', false)).toEqual({ current: 'invalid', target: null });
    expect(weightFieldErrors('gain', '70', '7O', false)).toEqual({ current: null, target: 'invalid' });
  });
  test('prázdné pole je chyba jen při pokusu o pokračování', () => {
    expect(weightFieldErrors('lose', '80', '', false)).toEqual({ current: null, target: null });
    expect(weightFieldErrors('lose', '80', ' ', true)).toEqual({ current: null, target: 'invalid' });
  });
});

describe('buildOnboardingInput', () => {
  const ms: Milestone[] = [
    { id: 'a', label: 'A', target: 1, unit: 'done', current: 0, custom: false },
    { id: 'b', label: 'B', target: 1, unit: 'done', current: 0, custom: false },
  ];
  const draft = { path: 'power' as const, dreamBody: ' Muscle-up ', milestones: ms, weightKind: 'none' as const, currentKg: '', targetKg: '' };
  test('bez cíle váhy → weightGoal none, vize oříznutá', () => {
    expect(buildOnboardingInput(draft)).toEqual({ path: 'power', dreamBody: 'Muscle-up', milestones: ms, weightGoal: { kind: 'none' } });
  });
  test('Neřeším ignoruje rozepsaná pole váhy', () => {
    expect(buildOnboardingInput({ ...draft, currentKg: 'x', targetKg: '1' })?.weightGoal).toEqual({ kind: 'none' });
  });
  test('hubnutí s čárkou → parsované hodnoty', () => {
    expect(buildOnboardingInput({ ...draft, weightKind: 'lose', currentKg: '72,5', targetKg: '68' })?.weightGoal)
      .toEqual({ kind: 'lose', startKg: 72.5, targetKg: 68 });
  });
  test.each<[string, Partial<OnboardingDraftValues>]>([
    ['bez cesty', { path: null }],
    ['krátká vize', { dreamBody: 'ab' }],
    ['jeden milník', { milestones: ms.slice(0, 1) }],
    ['čtyři milníky', { milestones: [...ms, { ...ms[0]!, id: 'c' }, { ...ms[0]!, id: 'd' }] }],
    ['cíl proti směru', { weightKind: 'gain', currentKg: '80', targetKg: '70' }],
    ['prázdná váha', { weightKind: 'lose', currentKg: '', targetKg: '' }],
  ])('neúplný koncept (%s) → null', (_, patch) => {
    expect(buildOnboardingInput({ ...draft, ...patch })).toBeNull();
  });
});
