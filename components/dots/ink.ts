import type { SharedValue } from 'react-native-reanimated';
import { vec } from '@shopify/react-native-skia';
import { dots, useTheme } from '@/theme';

/** Barvy tečkového jazyka (spec §2.1). `glow` jen v dark: v light je aktivní tečka plná čerň bez záře. */
export function useDotInk() {
  const { c, scheme } = useTheme();
  return { on: c.text, off: c.dotOff, dim: c.dotDim, glow: scheme === 'dark' ? c.glow : null };
}

/** Dotyk pro vlnu teček (spec §4.1). Plní ho `useDotTouch` (motion-agent): poloha prstu v souřadnicích
 *  prvku a síla 0–1 (1 při dotyku, po puštění doznívá `motion.ripple.decayMs`). */
export interface DotTouch { x: SharedValue<number>; y: SharedValue<number>; strength: SharedValue<number> }

/** Přesah záře kolem tečky průměru `d` (plátno se o něj zvětší, aby se záře neořízla). */
export const glowPad = (d: number) => (d * (dots.glow.scale - 1)) / 2 + dots.glow.blur * 2;

/** Pole bodů pro Skia `Points` (jeden draw call na skupinu teček). */
export const toPoints = (pts: readonly { x: number; y: number }[], dx = 0, dy = 0) => pts.map((p) => vec(p.x + dx, p.y + dy));
