import { SEASONS } from '@/data/seasons';
import { toISODate } from '@/logic/dates';
import type { SeasonService } from '../contracts';
import { notImplemented } from './notImplemented';

export class MockSeasonService implements SeasonService {
  async getActive(now: Date) {
    const today = toISODate(now);
    return SEASONS.find((s) => s.startDate <= today && today <= s.endDate) ?? null;
  }
  getLatest = notImplemented('season.getLatest');
  setGoal = notImplemented('season.setGoal');
  getProgress = notImplemented('season.getProgress');
  getRecap = notImplemented('season.getRecap');
  claimReward = notImplemented('season.claimReward');
}
