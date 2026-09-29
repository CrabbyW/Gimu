export type CosmeticSlot = 'outfit' | 'accessory' | 'mapBackground' | 'lessonEffect' | 'profileFrame';
export type MilestoneRule = { kind: 'milestoneCompleted'; count: number } | { kind: 'streak'; days: number };
export interface Cosmetic {
  id: string; slot: CosmeticSlot; name: string;
  source: 'season' | 'milestone' | 'shop';
  seasonId?: string; milestoneRule?: MilestoneRule; priceBananas?: number;
  /** Index varianty pro Rive number input daného slotu. */
  variantIndex: number;
}
