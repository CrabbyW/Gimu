import type { MascotStage } from './common';
import type { CosmeticSlot } from './cosmetic';

export type LeagueTierId = 'wood' | 'stone' | 'iron' | 'bronze' | 'silver' | 'gold' | 'diamond';
export interface LeagueTier { id: LeagueTierId; name: string; order: number }
export interface LeagueEntry {
  userId: string; name: string; xpThisWeek: number; stage: MascotStage;
  cosmetics: Partial<Record<CosmeticSlot, string>>; isMe: boolean;
}
