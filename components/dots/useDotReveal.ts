import { useEffect, useRef } from 'react';
import { Easing, ReduceMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { motion, useMotionSafe } from '@/lib/motion';

/** Nejkratší přeběh při změně počtu (např. série +1): jedna tečka se rozsvítí znatelně, ne bliknutím. */
const STEP_MIN_MS = 280;
const NEVER = { reduceMotion: ReduceMotion.Never };

/**
 * Animovaný počet rozsvícených teček (UI vlákno). Při mountu s `intro` se tečky rozsvítí skenem 0 → `target`
 * stálou rychlostí (celá řada za `motion.dotScanMs`), po `delay` ms. Každá další změna `target` (postup lekcí,
 * série +1, odpočet) doběhne z aktuální hodnoty, `STEP_MIN_MS`–`dotScanMs`. Desetinná část = rozsvěcovaná tečka.
 * Omezený pohyb: počet skočí hned a celek se jen prolne (`fade`, 200 ms) při nástupu.
 */
export function useDotReveal(target: number, total: number, intro: boolean | number = true) {
  const { reduced } = useMotionSafe();
  const play = intro !== false;
  const delay = typeof intro === 'number' ? intro : 0;
  const count = useSharedValue(play && !reduced ? 0 : target);
  const fade = useSharedValue(play && reduced ? 0 : 1);
  const mounted = useRef(false);
  useEffect(() => {
    const per = motion.dotScanMs / Math.max(1, total);
    if (!mounted.current) {
      mounted.current = true;
      if (!play) return;
      if (reduced) { fade.value = withDelay(delay, withTiming(1, { ...motion.calmFade, ...NEVER })); return; }
      count.value = withDelay(delay, withTiming(target, { duration: Math.max(1, target) * per, easing: Easing.linear, ...NEVER }));
      return;
    }
    if (reduced) { count.value = target; return; }
    const ms = Math.min(motion.dotScanMs, Math.max(STEP_MIN_MS, Math.abs(target - count.value) * per));
    count.value = withTiming(target, { duration: ms, easing: Easing.out(Easing.quad), ...NEVER });
    // Nástup se rozhoduje jednou; další běhy reagují jen na změnu cíle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, total]);
  return { count, fade };
}
