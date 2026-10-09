import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { restEnterTiming, restFlow, useMotionSafe } from '@/lib/motion';

interface Props { children: ReactNode; style?: StyleProp<ViewStyle>; play?: boolean }

/** Nástup kroku lekce (cvik → pauza → cvik, UX pass U1): po mountu (klíč = krok) prolnutí a posun zprava
 *  `restFlow.shift` → 0 na UI vlákně, bez pružiny. Worklet čte jen sdílenou hodnotu a číslo. Omezený pohyb: jen
 *  `calmFade` na místě. Obsah je interaktivní hned. `play={false}` = stojí hned (první cvik po otevření lekce). */
export function LessonStepEnter({ children, style, play = true }: Props) {
  const { reduced } = useMotionSafe();
  const p = useSharedValue(play ? 0 : 1);
  const shift = reduced ? 0 : restFlow.shift;
  useEffect(() => {
    if (play) p.value = withTiming(1, restEnterTiming(reduced));
    // Nástup jednou při mountu kroku.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const anim = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateX: (1 - p.value) * shift }] }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}
