import { toISODate } from '@/logic/dates';
import { now } from '@/lib/clock';
import { services } from '@/services';
import { useServiceQuery } from './useServiceQuery';

/** Aktivní nebo poslední skončená sezóna s cílem a stavem převzetí. Klíč = dnešek (dev posun času). */
export const useSeasonStatus = () => useServiceQuery(() => services.season.getLatest(now()), [toISODate(now())]);

/** Progres cíle; bez id (sezóna bez cíle) se nevolá. */
export const useSeasonProgress = (seasonId: string | undefined) =>
  useServiceQuery(() => services.season.getProgress(seasonId!, now()), [seasonId, toISODate(now())], { enabled: Boolean(seasonId) });

export const useRecap = (seasonId: string | undefined) =>
  useServiceQuery(() => services.season.getRecap(seasonId!, now()), [seasonId, toISODate(now())], { enabled: Boolean(seasonId) });

export const seasonActions = {
  setGoal: (...a: Parameters<typeof services.season.setGoal>) => services.season.setGoal(...a),
  claimReward: (seasonId: string) => services.season.claimReward(seasonId, now()),
};
