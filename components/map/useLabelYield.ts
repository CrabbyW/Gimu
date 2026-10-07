import { useEffect } from 'react';
import { ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { ease, labelYield } from '@/lib/motion';

/**
 * Popisek ustoupí bublině repliky prolnutím (`labelYield`) a vrátí se až po jejím odchodu. Jen krytí
 * (žádný posun), proto stejně i s omezeným pohybem. Stav `hidden` platí hned (a11y), prolnutí ho jen znázorní.
 */
export function useLabelYield(hidden: boolean) {
  const o = useSharedValue(hidden ? 0 : 1);
  useEffect(() => {
    o.value = hidden
      ? withTiming(0, { duration: labelYield.outMs, easing: ease.exit, reduceMotion: ReduceMotion.Never })
      : withDelay(labelYield.backDelayMs, withTiming(1, { duration: labelYield.inMs, easing: ease.out, reduceMotion: ReduceMotion.Never }), ReduceMotion.Never);
  }, [hidden, o]);
  return useAnimatedStyle(() => ({ opacity: o.value }));
}
