import type { ActivityEvent, CosmeticSlot, ISODate, LeagueEntry, LeagueOutcome, LeagueTierId, MascotStage, UserProfile } from '@/types';
import { isLessonEvent, xpBetween } from './activity';
import { addDays, parseISODate, weekStart } from './dates';
import { hashString, mulberry32 } from './random';

export interface Rival { userId: string; name: string; weeklyBase: number; stage: MascotStage; cosmetics: Partial<Record<CosmeticSlot, string>> }
export interface LeagueRules { groupSize: number; promote: number; demote: number; tierXpStep: number; weeklyNoise: number }
type LeagueState = Pick<UserProfile, 'leagueTier' | 'leagueWeek' | 'lastLeagueResult'>;
interface MeView { name: string; stage: MascotStage; cosmetics: Partial<Record<CosmeticSlot, string>> }

export const TIER_ORDER = ['wood', 'stone', 'iron', 'bronze', 'silver', 'gold', 'diamond'] as const satisfies readonly LeagueTierId[];
const DAY_MS = 86_400_000;

const tierIndex = (tier: LeagueTierId): number => TIER_ORDER.indexOf(tier);
const rng = (r: Rival, tier: LeagueTierId, week: ISODate) => mulberry32(hashString(`${r.userId}|${week}|${tier}`));

/** Celkové XP soupeře za týden: základ × stupeň ligy × týdenní šum (deterministické). */
export function rivalWeekTotal(r: Rival, tier: LeagueTierId, week: ISODate, rules: LeagueRules): number {
  const rnd = rng(r, tier, week);
  const noise = 1 + (rnd() * 2 - 1) * rules.weeklyNoise;
  return Math.round(r.weeklyBase * (1 + tierIndex(tier) * rules.tierXpStep) * noise);
}

/** XP soupeře v čase `now`: monotónní průběh s denním šumem, 0 v pondělí 0:00, celek po 7 dnech. */
export function rivalXpAt(r: Rival, tier: LeagueTierId, week: ISODate, now: Date, rules: LeagueRules): number {
  const total = rivalWeekTotal(r, tier, week, rules);
  const rnd = rng(r, tier, week);
  rnd(); // první číslo spotřeboval týdenní šum
  const w = Array.from({ length: 7 }, () => 0.6 + rnd() * 0.8);
  const sum = w.reduce((a, b) => a + b, 0);
  const elapsed = Math.min(Math.max((now.getTime() - parseISODate(week).getTime()) / DAY_MS, 0), 7);
  const full = Math.floor(elapsed);
  if (full >= 7) return total;
  const cum = w.slice(0, full).reduce((a, b) => a + b, 0) + (w[full] ?? 0) * (elapsed - full);
  return Math.floor((total * cum) / sum);
}

/** Pořadí skupiny sestupně; při shodě XP je uživatel nad soupeřem. */
export function standings(rivals: Rival[], me: Omit<LeagueEntry, 'isMe' | 'userId'>, tier: LeagueTierId, week: ISODate, now: Date, rules: LeagueRules): LeagueEntry[] {
  const rows: LeagueEntry[] = rivals.slice(0, rules.groupSize - 1).map((r) => ({
    userId: r.userId, name: r.name, stage: r.stage, cosmetics: r.cosmetics, isMe: false, xpThisWeek: rivalXpAt(r, tier, week, now, rules),
  }));
  rows.push({ ...me, userId: 'me', isMe: true });
  return rows.sort((a, b) => b.xpThisWeek - a.xpThisWeek || Number(b.isMe) - Number(a.isMe) || a.userId.localeCompare(b.userId));
}

export function resolveWeek(entries: LeagueEntry[], tier: LeagueTierId, rules: LeagueRules): { rank: number; outcome: LeagueOutcome } {
  const rank = entries.findIndex((e) => e.isMe) + 1;
  const outcome: LeagueOutcome =
    rank <= rules.promote && tier !== 'diamond' ? 'promote'
      : rank > entries.length - rules.demote && tier !== 'wood' ? 'demote' : 'stay';
  return { rank, outcome };
}

export function nextTier(tier: LeagueTierId, outcome: LeagueOutcome): LeagueTierId {
  const i = tierIndex(tier) + (outcome === 'promote' ? 1 : outcome === 'demote' ? -1 : 0);
  return TIER_ORDER[Math.min(Math.max(i, 0), TIER_ORDER.length - 1)]!;
}

/** Vyhodnotí uplynulý týden účasti (jen jeden, max o 1 stupeň) a přesune uživatele do aktuálního týdne. Idempotentní. */
export function settleLeague(
  p: Pick<UserProfile, 'leagueTier' | 'leagueWeek' | 'activity' | 'lastLeagueResult'>,
  rivals: Rival[], meView: MeView, now: Date, rules: LeagueRules,
): LeagueState {
  const current = weekStart(now);
  if (p.leagueWeek >= current) return { leagueTier: p.leagueTier, leagueWeek: p.leagueWeek, lastLeagueResult: p.lastLeagueResult };
  const end = parseISODate(addDays(p.leagueWeek, 7));
  const xp = xpBetween(p.activity, p.leagueWeek, addDays(p.leagueWeek, 6));
  const entries = standings(rivals, { ...meView, xpThisWeek: xp }, p.leagueTier, p.leagueWeek, end, rules);
  const { rank, outcome } = resolveWeek(entries, p.leagueTier, rules);
  const toTier = nextTier(p.leagueTier, outcome);
  return { leagueTier: toTier, leagueWeek: current, lastLeagueResult: { weekStart: p.leagueWeek, rank, outcome, fromTier: p.leagueTier, toTier } };
}

/** Zbývající čas po celých minutách; záporné = 0. */
export function formatCountdown(ms: number): { d: number; h: number; m: number } {
  const m = Math.max(0, Math.floor(ms / 60_000));
  return { d: Math.floor(m / 1440), h: Math.floor((m % 1440) / 60), m: m % 60 };
}

/** Liga je zamčená, dokud uživatel nedokončil žádnou lekci (dev-xp se nepočítá). Bez lekce by pořadí nic neměřilo. */
export const isLeagueLocked = (activity: Pick<ActivityEvent, 'lessonId'>[]): boolean => !activity.some(isLessonEvent);
