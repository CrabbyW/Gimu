import type { Season } from '@/types';

export const SEASONS: Season[] = [
  { id: 'winter-arc-2026', name: 'Winter Arc', startDate: '2026-09-28', endDate: '2026-12-26',
    themeId: 'winterArc', rewardCosmeticIds: ['outfit-winter-arc-scarf'], badgeId: 'badge-winter-arc-2026' },
];

/** §4 Comeback: opravit jde zameškaný den nejvýš 3 dny zpětně. */
export const SEASON_RULES = { repairWindowDays: 3 } as const;
