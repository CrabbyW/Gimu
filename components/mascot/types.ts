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
  /** Vlastní dech těla (výchozí ano). Na uzlu mapy vypnutý: dýchá prstenec uzlu, ne opička (motion spec §3.1). */
  breathe?: boolean;
  /** Poskoky nálady happy/celebrate (výchozí ano). Oslava lekce chce `celebrate` bez poskoku (§4.1),
   *  mapa kreslí přeskok na nový uzel sama (oblouk). */
  hop?: boolean;
}

export const MASCOT_SIZES = { S: 56, M: 120, L: 200, XL: 280 } as const;

export const resolveMascotSize = (size: MascotSize): number => (typeof size === 'number' ? size : MASCOT_SIZES[size]);
