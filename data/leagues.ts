import type { LeagueTier } from '@/types';

export const LEAGUE_TIERS: LeagueTier[] = [
  { id: 'wood', name: 'Dřevo', order: 0 }, { id: 'stone', name: 'Kámen', order: 1 },
  { id: 'iron', name: 'Železo', order: 2 }, { id: 'bronze', name: 'Bronz', order: 3 },
  { id: 'silver', name: 'Stříbro', order: 4 }, { id: 'gold', name: 'Zlato', order: 5 },
  { id: 'diamond', name: 'Diamant', order: 6 },
];
export const LEAGUE_RULES = { groupSize: 16, promote: 5, demote: 3 } as const;
