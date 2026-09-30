import { LEAGUE_RULES as R } from '@/data/leagues';
import { LEAGUE_RIVALS } from '@/data/leagueUsers';
import { formatCountdown, nextTier, resolveWeek, rivalWeekTotal, rivalXpAt, settleLeague, standings, TIER_ORDER } from '@/logic/league';
import type { LeagueEntry, LeagueTierId } from '@/types';

const W = '2026-09-28'; // pondělí
const me = { name: 'Ty', xpThisWeek: 0, stage: 1 as const, cosmetics: {} };
const rival = LEAGUE_RIVALS[0]!;

test('data: přesně 15 soupeřů, skupina 16', () => { expect(LEAGUE_RIVALS).toHaveLength(15); expect(R.groupSize).toBe(16); });

test('determinismus: stejný vstup = stejné XP', () => {
  const now = new Date(2026, 8, 30, 15);
  expect(rivalXpAt(rival, 'iron', W, now, R)).toBe(rivalXpAt(rival, 'iron', W, now, R));
});
test('jiný týden → jiné XP (šum)', () => {
  expect(rivalWeekTotal(rival, 'iron', W, R)).not.toBe(rivalWeekTotal(rival, 'iron', '2026-10-05', R));
});
test('průběh týdne: 0 na začátku, monotónní, na konci = celkový součet', () => {
  expect(rivalXpAt(rival, 'wood', W, new Date(2026, 8, 28, 0, 0), R)).toBe(0);
  let prev = 0;
  for (let h = 0; h <= 7 * 24; h += 5) {
    const x = rivalXpAt(rival, 'wood', W, new Date(2026, 8, 28, h), R);
    expect(x).toBeGreaterThanOrEqual(prev); prev = x;
  }
  expect(rivalXpAt(rival, 'wood', W, new Date(2026, 9, 5, 0, 0), R)).toBe(rivalWeekTotal(rival, 'wood', W, R));
});

const entries = (xpMe: number, tier: LeagueTierId, week = W) =>
  standings(LEAGUE_RIVALS, { ...me, xpThisWeek: xpMe }, tier, week, new Date(2026, 9, 5, 0, 0), R);

test('standings: 16 řádků, seřazeno sestupně, přesně jeden isMe', () => {
  const e = entries(200, 'iron');
  expect(e).toHaveLength(16); expect(e.filter((x) => x.isMe)).toHaveLength(1);
  for (let i = 1; i < e.length; i++) expect(e[i - 1]!.xpThisWeek).toBeGreaterThanOrEqual(e[i]!.xpThisWeek);
});
test('remíza: uživatel se stejným XP je nad soupeřem', () => {
  const e = entries(0, 'iron'); const top = e.find((x) => !x.isMe)!;
  const tied = standings(LEAGUE_RIVALS, { ...me, xpThisWeek: top.xpThisWeek }, 'iron', W, new Date(2026, 9, 5), R);
  expect(tied[0]!.isMe).toBe(true);
});

test.each(TIER_ORDER.filter((t) => t !== 'diamond'))('kalibrace %s: 350 XP (2 lekce denně) = postupová zóna ve 12 týdnech', (tier) => {
  for (let w = 0; w < 12; w++) {
    const week = new Date(2026, 8, 28 + 7 * w); const iso = `${week.getFullYear()}-${String(week.getMonth() + 1).padStart(2, '0')}-${String(week.getDate()).padStart(2, '0')}`;
    expect(resolveWeek(entries(350, tier, iso), tier, R).outcome).toBe('promote');
  }
});

test('postup: 5. místo postupuje, 6. zůstává', () => {
  const at = (rank: number): LeagueEntry[] => Array.from({ length: 16 }, (_, i) => ({ userId: `u${i}`, name: '', xpThisWeek: 100 - i, stage: 1, cosmetics: {}, isMe: i === rank - 1 }));
  expect(resolveWeek(at(5), 'iron', R)).toEqual({ rank: 5, outcome: 'promote' });
  expect(resolveWeek(at(6), 'iron', R)).toEqual({ rank: 6, outcome: 'stay' });
  expect(resolveWeek(at(13), 'iron', R)).toEqual({ rank: 13, outcome: 'stay' });
  expect(resolveWeek(at(14), 'iron', R)).toEqual({ rank: 14, outcome: 'demote' });
  expect(resolveWeek(at(16), 'iron', R)).toEqual({ rank: 16, outcome: 'demote' });
});
test('v Dřevu se nesestupuje, v Diamantu se nepostupuje', () => {
  const at = (rank: number): LeagueEntry[] => Array.from({ length: 16 }, (_, i) => ({ userId: `u${i}`, name: '', xpThisWeek: 100 - i, stage: 1, cosmetics: {}, isMe: i === rank - 1 }));
  expect(resolveWeek(at(16), 'wood', R).outcome).toBe('stay');
  expect(resolveWeek(at(1), 'diamond', R).outcome).toBe('stay');
});
test('nextTier', () => {
  expect(nextTier('wood', 'promote')).toBe('stone'); expect(nextTier('stone', 'demote')).toBe('wood');
  expect(nextTier('diamond', 'promote')).toBe('diamond'); expect(nextTier('wood', 'demote')).toBe('wood');
  expect(nextTier('iron', 'stay')).toBe('iron');
});

const meView = { name: 'Ty', stage: 1 as const, cosmetics: {} };
const lessonsPerDay = (from: string, days: number, perDay: number, xp = 50) => Array.from({ length: days * perDay }, (_, i) => {
  const d = new Date(2026, 8, 28 + Math.floor(i / perDay)); const day = `2026-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { id: `e${i}`, at: d.toISOString(), day, lessonId: 'bc-1-1', xp };
});

test('settleLeague: stejný týden = beze změny (idempotentní)', () => {
  const p = { leagueTier: 'iron' as const, leagueWeek: W, activity: [], lastLeagueResult: null };
  expect(settleLeague(p, LEAGUE_RIVALS, meView, new Date(2026, 8, 30), R)).toEqual({ leagueTier: 'iron', leagueWeek: W, lastLeagueResult: null });
});
test('settleLeague: nový týden po aktivním týdnu → postup o jeden stupeň', () => {
  const p = { leagueTier: 'iron' as const, leagueWeek: W, activity: lessonsPerDay(W, 7, 1, 60), lastLeagueResult: null };
  const out = settleLeague(p, LEAGUE_RIVALS, meView, new Date(2026, 9, 6, 9), R);
  expect(out).toMatchObject({ leagueTier: 'bronze', leagueWeek: '2026-10-05', lastLeagueResult: { weekStart: W, outcome: 'promote', fromTier: 'iron', toTier: 'bronze' } });
});
test('settleLeague: po 3 týdnech nepřítomnosti se vyhodnotí jen poslední týden účasti (max o 1 stupeň)', () => {
  const p = { leagueTier: 'iron' as const, leagueWeek: W, activity: [], lastLeagueResult: null };
  const out = settleLeague(p, LEAGUE_RIVALS, meView, new Date(2026, 9, 21, 9), R);
  expect(out).toMatchObject({ leagueTier: 'stone', leagueWeek: '2026-10-19', lastLeagueResult: { outcome: 'demote' } });
});

test('formatCountdown', () => {
  expect(formatCountdown(((3 * 24 + 14) * 60 + 22) * 60_000 + 59_000)).toEqual({ d: 3, h: 14, m: 22 });
  expect(formatCountdown(-5)).toEqual({ d: 0, h: 0, m: 0 });
});
