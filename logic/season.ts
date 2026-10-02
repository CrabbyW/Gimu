import type { ActivityEvent, ISODate, MascotStage, Season, SeasonGoal, UserProfile, WeightEntry, WeightGoal } from '@/types';
import { isLessonEvent, lessonEventsBetween } from './activity';
import { addDays, diffDays, parseISODate, weekStart } from './dates';
import { stageForXp } from './mascot';
import { longestStreak } from './streak';

export type DayState = 'active' | 'repaired' | 'missed' | 'today' | 'future';
export interface SeasonProgress {
  goal: SeasonGoal; value: number; target: number; met: boolean; reachable: boolean;
  daysLeft: number; repairWindow: ISODate[]; dayStates: { day: ISODate; state: DayState }[];
}
export interface RecapBeforeAfter {
  kind: 'weight' | 'milestone' | 'activeDays' | 'lessons'; before: number; after: number;
  unit: 'kg' | 'reps' | 'seconds' | 'days' | 'lessons'; label: string;
}
export interface SeasonRecap {
  lessons: number; longestStreak: number; stageStart: MascotStage; stageEnd: MascotStage;
  beforeAfter: RecapBeforeAfter | null; rewardEarned: boolean; rewardCosmeticIds: string[]; badgeIds: string[];
}

export interface SeasonSpan { startDate: ISODate; endDate: ISODate }

/** Všechny dny sezóny včetně obou krajů. */
export function seasonDays(s: SeasonSpan): ISODate[] {
  const n = diffDays(s.endDate, s.startDate) + 1;
  return Array.from({ length: n }, (_, i) => addDays(s.startDate, i));
}

/**
 * Zameškané dny v comeback okně (today-1 … today-windowDays), oříznuté na sezónu a na den založení profilu.
 * Zameškaný = žádná lekční událost a žádná oprava. Nejstarší první. Opravy platí jen pro cíl sezóny, ne pro streak.
 */
export function repairableDays(events: ActivityEvent[], s: SeasonSpan, today: ISODate, windowDays: number, joinedDay: ISODate): ISODate[] {
  const active = new Set(events.filter(isLessonEvent).map((e) => e.day));
  const repaired = new Set(events.flatMap((e) => (e.repairsDate ? [e.repairsDate] : [])));
  const out: ISODate[] = [];
  for (let k = windowDays; k >= 1; k--) {
    const d = addDays(today, -k);
    if (d < s.startDate || d > s.endDate || d < joinedDay) continue;
    if (!active.has(d) && !repaired.has(d)) out.push(d);
  }
  return out;
}

/** Den, který opraví právě dokončovaná lekce: jen druhá a další lekce dne v běžící sezóně. */
export function repairTarget(before: ActivityEvent[], s: SeasonSpan | null, today: ISODate, windowDays: number, joinedDay: ISODate): ISODate | null {
  if (!s || today < s.startDate || today > s.endDate) return null;
  if (!before.some((e) => isLessonEvent(e) && e.day === today)) return null;
  return repairableDays(before, s, today, windowDays, joinedDay)[0] ?? null;
}

export interface SeasonCtx { events: ActivityEvent[]; weights: WeightEntry[]; season: Season; today: ISODate; joinedDay: ISODate; windowDays: number }
export interface SeasonReward { cosmeticIds: string[]; badgeIds: string[] }
type ClaimProfile = Pick<UserProfile, 'owned' | 'badges' | 'seasonClaims'>;

const inSeason = (d: ISODate, s: SeasonSpan) => s.startDate <= d && d <= s.endDate;
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Lekční a opravené dny sezóny, jen do dneška. */
function daySets(ctx: SeasonCtx): { active: Set<ISODate>; repaired: Set<ISODate> } {
  const { season: s, today } = ctx;
  const to = today < s.endDate ? today : s.endDate;
  const active = new Set(lessonEventsBetween(ctx.events, s.startDate, to).map((e) => e.day));
  const repaired = new Set(ctx.events.flatMap((e) => (e.repairsDate && inSeason(e.repairsDate, s) && e.repairsDate <= today ? [e.repairsDate] : [])));
  return { active, repaired };
}

/** Cílová hodnota; u váhy absolutní hodnota změny. */
export function goalTarget(g: SeasonGoal): number {
  switch (g.kind) {
    case 'activeDays': return g.days;
    case 'lessons': return g.count;
    case 'milestone': return g.target;
    case 'weight': return Math.abs(g.deltaKg);
  }
}

const byWeek = (w: WeightEntry[]) => [...w].sort((a, b) => a.weekStart.localeCompare(b.weekStart));

/** Ruling 7: první záznam od týdne startu sezóny, jinak poslední před ním, jinak null. */
export function weightBaseline(weights: WeightEntry[], s: SeasonSpan): number | null {
  const from = weekStart(parseISODate(s.startDate));
  const sorted = byWeek(weights);
  const first = sorted.find((w) => w.weekStart >= from);
  if (first) return first.kg;
  return sorted.filter((w) => w.weekStart < from).at(-1)?.kg ?? null;
}

/** Poslední záznam s `weekStart <= endDate`. */
export function weightLatest(weights: WeightEntry[], s: SeasonSpan): number | null {
  return byWeek(weights).filter((w) => w.weekStart <= s.endDate).at(-1)?.kg ?? null;
}

export function goalValue(g: SeasonGoal, ctx: SeasonCtx): number {
  switch (g.kind) {
    case 'activeDays': {
      const { active, repaired } = daySets(ctx);
      return new Set([...active, ...repaired]).size;
    }
    case 'lessons': return lessonEventsBetween(ctx.events, ctx.season.startDate, ctx.season.endDate).length;
    case 'milestone': return g.current;
    case 'weight': {
      const base = weightBaseline(ctx.weights, ctx.season);
      const latest = weightLatest(ctx.weights, ctx.season);
      if (base === null || latest === null) return 0;
      return round1(g.deltaKg < 0 ? base - latest : latest - base);
    }
  }
}

/** Stav každého dne sezóny. Dny před založením profilu jsou `missed` (ruling 6), v okně oprav ale nejsou. */
export function dayStates(ctx: SeasonCtx): { day: ISODate; state: DayState }[] {
  const { active, repaired } = daySets(ctx);
  return seasonDays(ctx.season).map((day) => {
    const state: DayState = day === ctx.today ? 'today'
      : active.has(day) ? 'active'
        : repaired.has(day) ? 'repaired'
          : day > ctx.today ? 'future' : 'missed';
    return { day, state };
  });
}

export function seasonProgress(g: SeasonGoal, ctx: SeasonCtx): SeasonProgress {
  const { season: s, today } = ctx;
  const value = goalValue(g, ctx);
  const target = goalTarget(g);
  const repairWindow = repairableDays(ctx.events, s, today, ctx.windowDays, ctx.joinedDay);
  // Ruling 11: dnešek se počítá, po konci 0.
  const daysLeft = Math.max(0, diffDays(s.endDate, today) + 1);
  let reachable = true;
  if (g.kind === 'activeDays') {
    const { active, repaired } = daySets(ctx);
    const open = seasonDays(s).filter((d) => d > today || (d === today && !active.has(d) && !repaired.has(d))).length;
    reachable = value + open + repairWindow.length >= target;
  }
  return { goal: g, value, target, met: value >= target, reachable, daysLeft, repairWindow, dayStates: dayStates(ctx) };
}

/** Ruling 8: bez dat k porovnání vrací null a recap slide vynechá. */
function recapBeforeAfter(g: SeasonGoal | null, ctx: SeasonCtx, weightGoal: WeightGoal): RecapBeforeAfter | null {
  if (g?.kind === 'milestone') return { kind: 'milestone', before: g.start, after: g.current, unit: g.unit, label: g.label };
  if (g?.kind === 'activeDays') return { kind: 'activeDays', before: 0, after: goalValue(g, ctx), unit: 'days', label: 'activeDays' };
  if (g?.kind === 'lessons') return { kind: 'lessons', before: 0, after: goalValue(g, ctx), unit: 'lessons', label: 'lessons' };
  if (g?.kind === 'weight' || weightGoal.kind !== 'none') {
    const before = weightBaseline(ctx.weights, ctx.season);
    const after = weightLatest(ctx.weights, ctx.season);
    return before === null || after === null ? null : { kind: 'weight', before, after, unit: 'kg', label: 'weight' };
  }
  return null;
}

export function participationBadgeId(s: Season): string { return `${s.badgeId}-ucast`; }

/** Ruling 10: odznak účasti vždy, při splnění navíc odznak sezóny a kosmetika. */
export function rewardFor(met: boolean, s: Season): SeasonReward {
  return met
    ? { cosmeticIds: [...s.rewardCosmeticIds], badgeIds: [participationBadgeId(s), s.badgeId] }
    : { cosmeticIds: [], badgeIds: [participationBadgeId(s)] };
}

export function buildRecap(g: SeasonGoal | null, ctx: SeasonCtx & { thresholds: readonly number[]; weightGoal: WeightGoal }): SeasonRecap {
  const s = ctx.season;
  const lessons = lessonEventsBetween(ctx.events, s.startDate, s.endDate);
  const xpWhere = (pred: (d: ISODate) => boolean) => ctx.events.reduce((sum, e) => (pred(e.day) ? sum + e.xp : sum), 0);
  const met = g ? seasonProgress(g, ctx).met : false;
  const reward = rewardFor(met, s);
  return {
    lessons: lessons.length,
    longestStreak: longestStreak([...new Set(lessons.map((e) => e.day))]),
    stageStart: stageForXp(xpWhere((d) => d < s.startDate), ctx.thresholds),
    stageEnd: stageForXp(xpWhere((d) => d <= s.endDate), ctx.thresholds),
    beforeAfter: recapBeforeAfter(g, ctx, ctx.weightGoal),
    rewardEarned: met, rewardCosmeticIds: reward.cosmeticIds, badgeIds: reward.badgeIds,
  };
}

const union = (a: string[], b: string[]): string[] => [...new Set([...a, ...b])];

/** Idempotentní převzetí odměny: už převzatá sezóna vrací vstup beze změny. */
export function applyClaim(p: ClaimProfile, seasonId: string, reward: SeasonReward, at: string): ClaimProfile {
  if (p.seasonClaims[seasonId]) return p;
  return {
    owned: union(p.owned, reward.cosmeticIds),
    badges: union(p.badges, reward.badgeIds),
    seasonClaims: { ...p.seasonClaims, [seasonId]: { at, cosmeticIds: reward.cosmeticIds, badgeIds: reward.badgeIds } },
  };
}

export type SeasonGoalCheck = 'ok' | 'daysRange' | 'countRange' | 'targetRange' | 'deltaRange';
const intIn = (n: number, lo: number, hi: number) => Number.isInteger(n) && n >= lo && n <= hi;

/** Rozsahy cíle sezóny (plán B, Task 24). activeDays navíc nesmí přesáhnout délku sezóny. */
export function validateSeasonGoal(g: SeasonGoal, s?: SeasonSpan): SeasonGoalCheck {
  switch (g.kind) {
    case 'activeDays': return intIn(g.days, 1, Math.min(90, s ? seasonDays(s).length : 90)) ? 'ok' : 'daysRange';
    case 'lessons': return intIn(g.count, 1, 500) ? 'ok' : 'countRange';
    case 'milestone': return intIn(g.target, 1, 1000) && g.current >= 0 ? 'ok' : 'targetRange';
    case 'weight': return Number.isFinite(g.deltaKg) && g.deltaKg !== 0 && Math.abs(g.deltaKg) <= 30 ? 'ok' : 'deltaRange';
  }
}
