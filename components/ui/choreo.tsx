import { useEffect, useState, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withTiming, type SharedValue, type WithTimingConfig,
} from 'react-native-reanimated';
import { motion, useMotionSafe } from '@/lib/motion';

/* Choreografie obrazovek (motion-agent, brag): sdílené stavební kameny pro jeden řízený úvodní sled.
 * Vše jsou shared values na UI vlákně, žádný setState za snímek. */

const seen = new Set<string>();

/** `true` jen při prvním zobrazení obsahu s tímto klíčem v relaci (návrat na tab, refetch nebo
 *  remount sled nepřehrají). Rozhodne se jednou při mountu. */
export function useFirstShow(key: string): boolean {
  const [first] = useState(() => !seen.has(key));
  useEffect(() => { seen.add(key); }, [key]);
  return first;
}

/** Jen pro testy. */
export const resetFirstShow = () => seen.clear();

/** Průběh nástupu 0 → 1 se zpožděním. Nehraje-li se, rovnou 1. Omezený pohyb: 200ms fade bez zpoždění
 *  (posun komponenty vynechají), běží i při ReduceMotion (jinak by šlo o skok). */
export function useReveal(play: boolean, delay = 0, config: WithTimingConfig = motion.enter): SharedValue<number> {
  const { reduced } = useMotionSafe();
  const [initial] = useState(play ? 0 : 1);
  const t = useSharedValue(initial);
  useEffect(() => {
    if (initial === 1) return;
    t.value = reduced
      ? withTiming(1, { ...motion.calmFade, reduceMotion: ReduceMotion.Never })
      : withDelay(delay, withTiming(1, config));
    // Sled se rozhoduje jednou při mountu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return t;
}

interface RevealProps {
  play: boolean;
  /** ms od začátku sledu. */
  delay?: number;
  /** Zdvih (pt), s omezeným pohybem 0. */
  rise?: number;
  /** Posun zprava (pt) místo zdvihu. */
  shift?: number;
  config?: WithTimingConfig;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/** Obal nástupu: fade + zdvih (UI timing, žádná pružina, tohle je obsah, ne fyzický prvek). */
export function Reveal({ play, delay = 0, rise = 12, shift = 0, config, style, children }: RevealProps) {
  const { reduced } = useMotionSafe();
  const t = useReveal(play, delay, config);
  const dy = reduced ? 0 : rise;
  const dx = reduced ? 0 : shift;
  const a = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * dy }, { translateX: (1 - t.value) * dx }],
  }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}
