import { createContext, forwardRef, useContext, useMemo, type ReactNode } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { motion } from '@/lib/motion';

// Čísla mimo workletu: worklet zachytává jen čísla a sdílené hodnoty (local/no-worklet-object-capture).
const SLOP = motion.scrollIntent.slop;
const RATIO = motion.scrollIntent.verticalRatio;

/**
 * „Hrací“ gesto tečkového pozadí: rozhoduje, komu tah patří. Po posunu `slop` pt:
 * - jasně svislý tah (|dy| > `verticalRatio`·|dx|) → gesto selže a scroll (který na něj čeká) se rozjede;
 * - vodorovný nebo šikmý tah → gesto se aktivuje, scroll se nerozjede (a nativní scroll RNGH zruší) a prst
 *   si hraje s tečkami (vlnu kreslí souběžné `useDotTouch`).
 * Vnořená gesta s menším prahem (roztočení kotouče 8 pt, tab bar 6 pt) vyhrají dřív; tap a podržení se
 * nehýbou, takže gesto se vůbec neaktivuje. Chování nezávisí na omezeném pohybu (vlnu vypíná `useDotTouch`).
 */
export function useScrollIntent(enabled = true) {
  const sx = useSharedValue(0);
  const sy = useSharedValue(0);
  return useMemo(() => Gesture.Manual()
    .enabled(enabled)
    .shouldCancelWhenOutside(false)
    .onTouchesDown((e, manager) => {
      const t = e.allTouches[0];
      if (!t) return;
      // Druhý prst (pinch apod.) nechává rozhodnutí na ostatních.
      if (e.numberOfTouches > 1) { manager.fail(); return; }
      sx.value = t.absoluteX;
      sy.value = t.absoluteY;
    })
    .onTouchesMove((e, manager) => {
      const t = e.allTouches[0];
      if (!t) return;
      const dx = Math.abs(t.absoluteX - sx.value);
      const dy = Math.abs(t.absoluteY - sy.value);
      if (dx * dx + dy * dy < SLOP * SLOP) return;
      if (dy > RATIO * dx) manager.fail();
      else manager.activate();
    })
    .onTouchesUp((e, manager) => { if (e.numberOfTouches <= 1) manager.end(); })
    .onTouchesCancelled((_e, manager) => { manager.fail(); }),
  // Sdílené hodnoty jsou stabilní.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [enabled]);
}

const ScrollIntentContext = createContext<GestureType | null>(null);

export function ScrollIntentProvider({ gesture, children }: { gesture: GestureType | null; children?: ReactNode }) {
  return <ScrollIntentContext.Provider value={gesture}>{children}</ScrollIntentContext.Provider>;
}

/**
 * ScrollView, který se rozjede jen při jasně svislém tahu: čeká, až „hrací“ gesto nejbližšího
 * reaktivního pozadí selže. Mimo pozadí se chová jako obyčejný ScrollView.
 */
export const IntentScrollView = forwardRef<ScrollView, ScrollViewProps>(function IntentScrollView(props, ref) {
  const intent = useContext(ScrollIntentContext);
  const native = useMemo(() => (intent ? Gesture.Native().requireExternalGestureToFail(intent) : null), [intent]);
  const view = <ScrollView ref={ref} {...props} />;
  return native ? <GestureDetector gesture={native}>{view}</GestureDetector> : view;
});
