import { LEAGUE_RULES } from '@/data/leagues';
import { LEAGUE_RIVALS } from '@/data/leagueUsers';
import { STAGE_THRESHOLDS } from '@/data/xp';
import { copy } from '@/data/copy';
import { xpBetween } from '@/logic/activity';
import { addDays, weekEndsAt } from '@/logic/dates';
import { resolveWeek, settleLeague, standings } from '@/logic/league';
import { stageForXp } from '@/logic/mascot';
import { totalXp } from '@/logic/xp';
import { useDb } from '@/store/db';
import type { LeagueService, LeagueWeekView } from '../contracts';

const requireProfile = () => {
  const p = useDb.getState().profile;
  if (!p) throw new Error('Profil neexistuje, nejdřív onboarding.');
  return p;
};

export class MockLeagueService implements LeagueService {
  async getCurrentWeek(now: Date): Promise<LeagueWeekView> {
    let p = requireProfile();
    const meView = { name: copy.league.me, stage: stageForXp(totalXp(p.activity), STAGE_THRESHOLDS), cosmetics: p.equipped };
    const settled = settleLeague(p, LEAGUE_RIVALS, meView, now, LEAGUE_RULES);
    if (settled.leagueTier !== p.leagueTier || settled.leagueWeek !== p.leagueWeek || settled.lastLeagueResult !== p.lastLeagueResult) {
      p = { ...p, ...settled };
      useDb.getState().setProfile(p);
    }
    const week = p.leagueWeek;
    const me = { ...meView, xpThisWeek: xpBetween(p.activity, week, addDays(week, 6)) };
    const entries = standings(LEAGUE_RIVALS, me, p.leagueTier, week, now, LEAGUE_RULES);
    const { rank } = resolveWeek(entries, p.leagueTier, LEAGUE_RULES);
    return {
      tier: p.leagueTier, entries, weekStart: week, myRank: rank, lastResult: p.lastLeagueResult,
      promoteCount: p.leagueTier === 'diamond' ? 0 : LEAGUE_RULES.promote,
      demoteCount: p.leagueTier === 'wood' ? 0 : LEAGUE_RULES.demote,
      endsAt: weekEndsAt(now),
    };
  }
  async dismissLastResult() {
    const p = requireProfile();
    if (p.lastLeagueResult) useDb.getState().setProfile({ ...p, lastLeagueResult: null });
  }
}
