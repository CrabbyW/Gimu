import { SEASONS } from '@/data/seasons';
import { STAGE_THRESHOLDS } from '@/data/xp';
import {
  applyClaim, buildRecap, dayStates, goalTarget, goalValue, participationBadgeId, repairableDays, repairTarget, rewardFor, seasonDays, seasonProgress, weightBaseline,
} from '@/logic/season';
import type { ActivityEvent } from '@/types';

const S = { startDate: '2026-09-28', endDate: '2026-12-26' };
const ev = (day: string, lessonId = 'bc-1-1', repairsDate?: string): ActivityEvent => ({ id: `${day}-${Math.random()}`, at: `${day}T10:00:00.000Z`, day, lessonId, xp: 20, ...(repairsDate ? { repairsDate } : {}) });

test('Winter Arc má 90 dní', () => { expect(seasonDays(S)).toHaveLength(90); });

test('okno je max 3 dny zpětně, nejstarší první', () => {
  // aktivní jen 28. 9.; dnes 5. 10. → zameškané 29.9.–4.10., opravitelné jen 2.–4. 10.
  expect(repairableDays([ev('2026-09-28')], S, '2026-10-05', 3, '2026-09-28')).toEqual(['2026-10-02', '2026-10-03', '2026-10-04']);
});
test('den 4 dny zpátky už opravit nejde', () => {
  expect(repairableDays([ev('2026-10-02'), ev('2026-10-03'), ev('2026-10-04')], S, '2026-10-05', 3, '2026-09-28')).toEqual([]);
});
test('opravený den už v okně není', () => {
  expect(repairableDays([ev('2026-10-05', 'bc-1-2', '2026-10-02')], S, '2026-10-05', 3, '2026-09-28')).toEqual(['2026-10-03', '2026-10-04']);
});
test('dny před začátkem sezóny a před založením profilu se neopravují', () => {
  expect(repairableDays([], S, '2026-09-29', 3, '2026-09-20')).toEqual(['2026-09-28']);
  expect(repairableDays([], S, '2026-10-05', 3, '2026-10-04')).toEqual(['2026-10-04']);
});
test('dev-xp den je pořád zameškaný', () => {
  expect(repairableDays([ev('2026-10-04', 'dev-xp')], S, '2026-10-05', 3, '2026-09-28')).toContain('2026-10-04');
});
test('mimo sezónu (null) se neopravuje nic', () => { expect(repairTarget([ev('2026-10-05')], null, '2026-10-05', 3, '2026-09-28')).toBeNull(); });
test('první lekce dne neopravuje, druhá opraví nejstarší', () => {
  expect(repairTarget([], S, '2026-10-05', 3, '2026-09-28')).toBeNull();
  expect(repairTarget([ev('2026-10-05')], S, '2026-10-05', 3, '2026-09-28')).toBe('2026-10-02');
});
test('dev-xp dnes se jako „první lekce“ nepočítá', () => {
  expect(repairTarget([ev('2026-10-05', 'dev-xp')], S, '2026-10-05', 3, '2026-09-28')).toBeNull();
});
test('dnešek mimo rozsah sezóny neopravuje', () => {
  expect(repairTarget([ev('2026-12-27')], S, '2026-12-27', 3, '2026-09-28')).toBeNull();
});

// ——— Task 23: cíl sezóny, recap, odměna ———
const season = SEASONS[0]!;
const ctx = (over: Partial<Parameters<typeof seasonProgress>[1]> = {}) => ({ events: [], weights: [], season, today: '2026-10-05', joinedDay: '2026-09-28', windowDays: 3, ...over });

describe('goalValue všech typů', () => {
  const events = [ev('2026-09-28'), ev('2026-09-28', 'bc-1-2'), ev('2026-09-29'), ev('2026-10-01', 'bc-1-3', '2026-09-30'), ev('2026-09-27'), ev('2026-10-02', 'dev-xp')];
  test('activeDays = aktivní + opravené dny v sezóně, bez dev-xp a dnů před sezónou', () => {
    expect(goalValue({ kind: 'activeDays', days: 60 }, ctx({ events }))).toBe(4); // 28, 29, 30 (oprava), 1
  });
  test('lessons = lekční události v sezóně', () => { expect(goalValue({ kind: 'lessons', count: 50 }, ctx({ events }))).toBe(4); });
  test('milestone = ručně zadaná hodnota', () => {
    expect(goalValue({ kind: 'milestone', label: '15 shybů', target: 15, unit: 'reps', current: 7, start: 3 }, ctx())).toBe(7);
  });
  test('weight = rozdíl od první váhy v sezóně ve směru cíle', () => {
    const weights = [{ weekStart: '2026-09-21', kg: 85 }, { weekStart: '2026-09-28', kg: 84 }, { weekStart: '2026-10-05', kg: 82.4 }];
    expect(goalValue({ kind: 'weight', deltaKg: -4 }, ctx({ weights }))).toBe(1.6);
    expect(goalValue({ kind: 'weight', deltaKg: 3 }, ctx({ weights }))).toBe(-1.6);
  });
  test('weightBaseline: bez záznamu v sezóně bere poslední před ní, bez vah null', () => {
    expect(weightBaseline([{ weekStart: '2026-09-14', kg: 90 }, { weekStart: '2026-09-21', kg: 89 }], season)).toBe(89);
    expect(weightBaseline([], season)).toBeNull();
    expect(goalValue({ kind: 'weight', deltaKg: -4 }, ctx())).toBe(0);
  });
  test('goalTarget: weight bere absolutní hodnotu', () => { expect(goalTarget({ kind: 'weight', deltaKg: -4 })).toBe(4); });
});

describe('vyhodnocení cíle', () => {
  test('přesně 100 % = splněno', () => {
    expect(seasonProgress({ kind: 'lessons', count: 2 }, ctx({ events: [ev('2026-09-28'), ev('2026-09-29')] })).met).toBe(true);
  });
  test('99 % = nesplněno', () => {
    expect(seasonProgress({ kind: 'lessons', count: 3 }, ctx({ events: [ev('2026-09-28'), ev('2026-09-29')] })).met).toBe(false);
  });
  test('activeDays nedosažitelný jen když nestačí ani zbývající dny + okno oprav', () => {
    // 90denní sezóna, 12. 12.: zbývá 15 dní vč. dneška, okno 3 dny, 0 aktivních → max 18
    const late = ctx({ today: '2026-12-12' });
    expect(seasonProgress({ kind: 'activeDays', days: 18 }, late).reachable).toBe(true);
    expect(seasonProgress({ kind: 'activeDays', days: 19 }, late).reachable).toBe(false);
    expect(seasonProgress({ kind: 'activeDays', days: 19 }, late).repairWindow).toHaveLength(3);
  });
  test('lessons/milestone/weight jsou vždy dosažitelné', () => {
    expect(seasonProgress({ kind: 'lessons', count: 999 }, ctx({ today: '2026-12-26' })).reachable).toBe(true);
  });
  test('daysLeft počítá dnešek, po konci 0', () => {
    expect(seasonProgress({ kind: 'lessons', count: 1 }, ctx({ today: '2026-12-26' })).daysLeft).toBe(1);
    expect(seasonProgress({ kind: 'lessons', count: 1 }, ctx({ today: '2026-12-30' })).daysLeft).toBe(0);
  });
});

test('dayStates: 90 dní, dnes má přednost, opravené, zameškané, budoucí', () => {
  const s = dayStates(ctx({ events: [ev('2026-09-28'), ev('2026-10-05'), ev('2026-10-05', 'bc-1-2', '2026-09-30')] }));
  const at = (d: string) => s.find((x) => x.day === d)?.state;
  expect(s).toHaveLength(90);
  expect([at('2026-09-28'), at('2026-09-29'), at('2026-09-30'), at('2026-10-05'), at('2026-10-06')]).toEqual(['active', 'missed', 'repaired', 'today', 'future']);
});

describe('recap', () => {
  const events = [ev('2026-09-20', 'bc-1-1'), ...Array.from({ length: 5 }, (_, i) => ev(`2026-10-0${i + 1}`))].map((e, i) => ({ ...e, xp: i === 0 ? 450 : 30 }));
  const r = buildRecap({ kind: 'milestone', label: '15 shybů', target: 15, unit: 'reps', current: 12, start: 4 },
    { ...ctx({ events, today: '2026-12-27' }), thresholds: STAGE_THRESHOLDS, weightGoal: { kind: 'none' } });
  test('počty a stage', () => { expect(r).toMatchObject({ lessons: 5, longestStreak: 5, stageStart: 1, stageEnd: 2 }); });
  test('před/po milestone', () => { expect(r.beforeAfter).toEqual({ kind: 'milestone', before: 4, after: 12, unit: 'reps', label: '15 shybů' }); });
  test('nesplněno: bez šály, ale s odznakem účasti', () => {
    expect(r.rewardEarned).toBe(false); expect(r.rewardCosmeticIds).toEqual([]); expect(r.badgeIds).toEqual([participationBadgeId(season)]);
  });
  test('bez cíle a bez váhového cíle → beforeAfter null', () => {
    expect(buildRecap(null, { ...ctx({ today: '2026-12-27' }), thresholds: STAGE_THRESHOLDS, weightGoal: { kind: 'none' } }).beforeAfter).toBeNull();
  });
});

test('rewardFor: splněno = šála + odznak + odznak účasti', () => {
  expect(rewardFor(true, season)).toEqual({ cosmeticIds: ['outfit-winter-arc-scarf'], badgeIds: ['badge-winter-arc-2026-ucast', 'badge-winter-arc-2026'] });
});
test('applyClaim je idempotentní a bez duplicit', () => {
  const p0 = { owned: ['acc-headband'], badges: [], seasonClaims: {} };
  const p1 = applyClaim(p0, season.id, rewardFor(true, season), '2026-12-27T09:00:00.000Z');
  const p2 = applyClaim(p1, season.id, rewardFor(true, season), '2026-12-28T09:00:00.000Z');
  expect(p2).toBe(p1);
  expect(p1.owned).toEqual(['acc-headband', 'outfit-winter-arc-scarf']);
  expect(p1.badges).toEqual(['badge-winter-arc-2026-ucast', 'badge-winter-arc-2026']);
});
