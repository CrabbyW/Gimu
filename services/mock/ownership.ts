import { activeDays, longestStreak } from '@/logic/streak';
import type { OwnershipCtx } from '@/logic/cosmetics';
import type { UserProfile } from '@/types';

/** Kontext vlastnictví kosmetiky z profilu (milníky, nejdelší streak, vlastněné). */
export const ownershipCtx = (p: Pick<UserProfile, 'owned' | 'milestones' | 'activity'>): OwnershipCtx => ({
  owned: p.owned, milestones: p.milestones, longestStreak: longestStreak(activeDays(p.activity)),
});
