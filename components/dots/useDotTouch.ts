import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { Easing, cancelAnimation, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion, useMotionSafe } from '@/lib/motion';
import type { DotTouch } from './ink';

/** Doznění vlny po puštění: plynulý ease-out, žádná pružina (pole nesmí „pérovat“). */
const RELEASE = { duration: motion.ripple.decayMs, easing: Easing.out(Easing.quad) };

/**
 * Dotyková vlna teček (spec §4.1). Vrací `touch` (do `DotField`/`DotMatrix`/`DotPlate`) a `gesture` pro
 * `GestureDetector` kolem plochy, jejíž souřadnice odpovídají souřadnicím prvku s tečkami.
 *
 * Gesto je `Manual` a nikdy se neaktivuje: jen čte dotyky, takže nekrade scroll, tap ani roztočení kotouče
 * (běží souběžně se vším). Vše na UI vlákně: dotyk nastaví polohu a `strength` 1, pohyb ji vede, puštění
 * nebo převzetí dotyku scrollem nechá vlnu doznít za `motion.ripple.decayMs`.
 * Omezený pohyb: `strength` zůstává 0 (vlna vypnutá), gesto nic nedělá.
 */
export function useDotTouch(enabled = true) {
  const { reduced } = useMotionSafe();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const strength = useSharedValue(0);
  const on = enabled && !reduced;
  const gesture = useMemo(() => Gesture.Manual()
    .enabled(on)
    .shouldCancelWhenOutside(false)
    .onTouchesDown((e) => {
      const t = e.changedTouches[0];
      if (!t) return;
      x.value = t.x;
      y.value = t.y;
      cancelAnimation(strength);
      // Nástup za jeden takt `press` (90 ms): vlna „vyrazí“ z bodu dotyku, ne skokem.
      strength.value = withTiming(1, motion.press);
    })
    .onTouchesMove((e) => {
      const t = e.changedTouches[0];
      if (!t) return;
      x.value = t.x;
      y.value = t.y;
    })
    .onTouchesUp(() => { strength.value = withTiming(0, RELEASE); })
    .onTouchesCancelled(() => { strength.value = withTiming(0, RELEASE); })
    .onFinalize(() => { if (strength.value > 0) strength.value = withTiming(0, RELEASE); }),
  // Sdílené hodnoty jsou stabilní; gesto se přestaví jen se zapnutím.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [on]);
  const touch: DotTouch = useMemo(() => ({ x, y, strength }), [x, y, strength]);
  return { touch, gesture };
}
