import { SEASON_RULES, SEASONS } from '@/data/seasons';
import { STAGE_THRESHOLDS } from '@/data/xp';
import { now as clockNow } from '@/lib/clock';
import { toISODate } from '@/logic/dates';
import { applyClaim, buildRecap, rewardFor, seasonProgress, validateSeasonGoal, type SeasonCtx } from '@/logic/season';
import { useDb } from '@/store/db';
import type { Season, SeasonGoal, UserProfile } from '@/types';
import type { SeasonService, SeasonStatus } from '../contracts';

const requireProfile = (): UserProfile => {
  const p = useDb.getState().profile;
  if (!p) throw new Error('Profile does not exist, run onboarding first.');
  return p;
};
const requireSeason = (id: string): Season => {
  const s = SEASONS.find((x) => x.id === id);
  if (!s) throw new Error(`Sezóna ${id} neexistuje.`);
  return s;
};
const ctxFor = (p: UserProfile, season: Season, now: Date): SeasonCtx => ({
  events: p.activity, weights: p.weights, season, today: toISODate(now),
  joinedDay: toISODate(new Date(p.createdAt)), windowDays: SEASON_RULES.repairWindowDays,
});

export class MockSeasonService implements SeasonService {
  async getActive(now: Date) {
    const today = toISODate(now);
    return SEASONS.find((s) => s.startDate <= today && today <= s.endDate) ?? null;
  }

  async getLatest(now: Date): Promise<SeasonStatus | null> {
    const today = toISODate(now);
    const active = SEASONS.find((s) => s.startDate <= today && today <= s.endDate);
    const season = active ?? [...SEASONS].filter((s) => s.endDate < today).sort((a, b) => a.endDate.localeCompare(b.endDate)).at(-1);
    if (!season) return null;
    const p = useDb.getState().profile;
    return {
      season, phase: active ? 'active' : 'ended',
      goal: p?.seasonGoals[season.id] ?? null, claimed: Boolean(p && season.id in p.seasonClaims),
    };
  }

  async setGoal(seasonId: string, goal: SeasonGoal) {
    const p = requireProfile(); const s = requireSeason(seasonId);
    // Cíl jde měnit jen do konce sezóny; „teď“ je čas appky (dev posun), ne reálné hodiny.
    if (toISODate(clockNow()) > s.endDate) throw new Error('The season has ended, the goal can no longer change.');
    const check = validateSeasonGoal(goal, s);
    if (check !== 'ok') throw new Error(check);
    const stored: SeasonGoal = goal.kind === 'milestone' && !Number.isFinite(goal.start) ? { ...goal, start: goal.current } : goal;
    useDb.getState().setProfile({ ...p, seasonGoals: { ...p.seasonGoals, [seasonId]: stored } });
  }

  async getProgress(seasonId: string, now: Date) {
    const p = requireProfile(); const s = requireSeason(seasonId);
    const goal = p.seasonGoals[seasonId];
    if (!goal) throw new Error('Season goal is missing.');
    return seasonProgress(goal, ctxFor(p, s, now));
  }

  async getRecap(seasonId: string, now: Date) {
    const p = requireProfile(); const s = requireSeason(seasonId);
    if (toISODate(now) <= s.endDate) throw new Error('The season has not ended yet.');
    // Recap se počítá ke konci sezóny (dnešek = poslední den), ne k dnešku po ní.
    return buildRecap(p.seasonGoals[seasonId] ?? null, {
      ...ctxFor(p, s, now), today: s.endDate, thresholds: STAGE_THRESHOLDS, weightGoal: p.weightGoal,
    });
  }

  async claimReward(seasonId: string, now: Date) {
    const p = requireProfile();
    const existing = p.seasonClaims[seasonId];
    if (existing) return existing.cosmeticIds;
    const recap = await this.getRecap(seasonId, now);
    const claimed = applyClaim(p, seasonId, rewardFor(recap.rewardEarned, requireSeason(seasonId)), now.toISOString());
    useDb.getState().setProfile({ ...p, ...claimed });
    return claimed.seasonClaims[seasonId]?.cosmeticIds ?? [];
  }
}
