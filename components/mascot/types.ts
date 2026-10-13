import type { SharedValue } from 'react-native-reanimated';
import type { IdleActionId } from '@/logic/mascotIdle';
import type { MascotPoseId } from '@/logic/mascotPoses';
import type { ReactionId } from '@/logic/mascotReactions';
import type { CosmeticSlot, MascotStage, Mood } from '@/types';

/** Přehrání reakce: nový `key` = přehrát znovu. `null`/chybějící = klid (probudí spící opičku). */
export interface MascotReaction { id: ReactionId; key: number }
/** Bod pohledu v souřadnicích okna (pt, jako `absoluteX/Y` gest); `null` = pohled zpět dopředu. */
/** Přehrání idle akce (život v klidu): nový `key` = přehrát. Reakce ji kdykoli přeruší. */
export interface MascotIdle { id: IdleActionId; key: number }
export type MascotGaze = SharedValue<{ x: number; y: number } | null>;

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
  /** Jantarová (`accentGraphic`) horní hrana šálu (spec §4: každá oslava). Prolnutí řídí motion. */
  scarfEdge?: boolean;
  /** Reakce opičky (fáze 3, spec §4.4). Přehrání je jen znázornění: nálada z `mood` platí dál a reakce ji
   *  na chvíli přebije. Omezený pohyb řeší volající přes `degrade` (hook `useMascotReactions`). */
  reaction?: MascotReaction | null;
  /** Sdílený bod pohledu: pupily (a bez omezeného pohybu i hlava) sledují prst. */
  gaze?: MascotGaze;
  /** Úhel kotouče (rad) pro reakci `spinFollow` (`usePlateSpin().spin`). */
  spin?: SharedValue<number>;
  /** Idle akce z `useMascotIdle` (jen pohyb, bez omezeného pohybu). */
  idle?: MascotIdle | null;
  /** Směr scrollu mapy −1 (nahoru) … 1 (dolů): pupily a hlava se natočí za ním. */
  scrollLook?: SharedValue<number>;
  /** Opice v2: explicitní statická póza (`logic/mascotPoses`); bez ní póza z reakce / nálady. */
  pose?: MascotPoseId;
  /** Statická opice bez jakéhokoli pohybu (jako omezený pohyb): náhledy v galerii, kde by 31 živých smyček zbytečně zatížilo UI vlákno. */
  still?: boolean;
}

export const MASCOT_SIZES = { S: 56, M: 120, L: 200, XL: 280 } as const;

export const resolveMascotSize = (size: MascotSize): number => (typeof size === 'number' ? size : MASCOT_SIZES[size]);
