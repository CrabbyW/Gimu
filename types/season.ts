import type { ISODate } from './common';

export type SeasonThemeId = 'winterArc' | 'summerBody';
export type SeasonGoal =
  | { kind: 'activeDays'; days: number }
  | { kind: 'lessons'; count: number }
  | { kind: 'milestone'; label: string; target: number; unit: 'reps' | 'seconds'; current: number }
  | { kind: 'weight'; deltaKg: number };
export interface Season {
  id: string; name: string; startDate: ISODate; endDate: ISODate;
  themeId: SeasonThemeId; rewardCosmeticIds: string[]; badgeId: string;
}
