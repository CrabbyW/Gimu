import type { LeagueTier } from '@/types';

export const LEAGUE_TIERS: LeagueTier[] = [
  { id: 'wood', name: 'Wood', order: 0 }, { id: 'stone', name: 'Stone', order: 1 },
  { id: 'iron', name: 'Iron', order: 2 }, { id: 'bronze', name: 'Bronze', order: 3 },
  { id: 'silver', name: 'Silver', order: 4 }, { id: 'gold', name: 'Gold', order: 5 },
  { id: 'diamond', name: 'Diamond', order: 6 },
];
export const LEAGUE_RULES = { groupSize: 16, promote: 5, demote: 3, tierXpStep: 0.03, weeklyNoise: 0.08 } as const;
