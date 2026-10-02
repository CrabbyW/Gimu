import type { CosmeticSlot, MascotStage, Mood } from '@/types';

export type MascotSize = number | 'S' | 'M' | 'L' | 'XL';

export interface MascotProps {
  stage: MascotStage;
  cosmetics: Partial<Record<CosmeticSlot, string>>;
  mood: Mood;
  /** Strana čtvercového plátna v pt, nebo pojmenovaná velikost z `MASCOT_SIZES`. */
  size: MascotSize;
  accessibilityLabel?: string;
  /** Dekorativní opice (např. v řádku ligy, kde label nese celý řádek): skrytá pro čtečku. */
  decorative?: boolean;
}

export const MASCOT_SIZES = { S: 56, M: 120, L: 200, XL: 280 } as const;

export const resolveMascotSize = (size: MascotSize): number => (typeof size === 'number' ? size : MASCOT_SIZES[size]);
