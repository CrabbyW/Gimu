import type { XpRules } from '@/types';

export const XP_RULES: XpRules = { lesson: 20, boss: 40, replay: 10, firstOfDay: 10, streakPerDay: 2, streakBonusCap: 14 };
/** Minimální celkové XP pro stage 1, 2, 3. */
export const STAGE_THRESHOLDS = [0, 500, 2000] as const;
