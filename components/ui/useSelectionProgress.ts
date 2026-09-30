import { useEffect } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { motion, useMotionSafe } from '@/lib/motion';

/** Průběh výběru 0 → 1 pro karty a chipy (UX2): výběr `motion.ui` (180 ms ease-out), zrušení
 *  `motion.uiExit` (150 ms). První render bez animace; s omezeným pohybem skok. */
export function useSelectionProgress(selected: boolean) {
  const { reduced } = useMotionSafe();
  const p = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    const to = selected ? 1 : 0;
    p.value = reduced ? to : withTiming(to, selected ? motion.ui : motion.uiExit);
  }, [selected, reduced, p]);
  return p;
}
