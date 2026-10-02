import { useMemo } from 'react';
import { now } from '@/lib/clock';
import { toISODate } from '@/logic/dates';
import { activityGrid, weightChartModel } from '@/logic/progress';
import { services } from '@/services';
import type { UserProfile } from '@/types';

/** Odvozená data tabu Progres: mřížka aktivity (5 týdnů) a model grafu váhy (null = bez grafu). */
export function useProgressView(profile: UserProfile | null | undefined) {
  const today = toISODate(now());
  return useMemo(() => (profile ? {
    grid: activityGrid(profile.activity, today),
    chart: weightChartModel(profile.weightGoal, profile.weights),
    milestones: profile.milestones,
    dreamBody: profile.dreamBody,
  } : null), [profile, today]);
}

export const progressActions = {
  updateMilestone: (id: string, current: number) => services.user.updateMilestone(id, current),
  logWeight: (kg: number) => services.user.logWeight(kg, now()),
};
