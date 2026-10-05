import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { easeSafe, motion, useMotionSafe } from '@/lib/motion';

// Stisk z handleru: křivky s ořezaným vstupem (na webu první snímek nesmí vystřelit mimo dráhu).
const PRESS = { duration: motion.press.duration, easing: easeSafe.press };
const RELEASE = { duration: motion.release.duration, easing: easeSafe.out };

/** Odezva na stisk pro UI ovládání (UX2, press-release bez pružiny, spec §6.7):
 *  stlačení za 90 ms (`motion.press`), návrat za 220 ms s rozhodným doběhem (`motion.release`).
 *  Vše na UI vlákně. S omezeným pohybem se místo zmenšení jen krátce ztlumí opacita. */
export function usePressFeedback(pressedScale: number) {
  const { reduced } = useMotionSafe();
  const pressed = useSharedValue(0);
  const style = useAnimatedStyle(() => (reduced
    ? { opacity: 1 - pressed.value * 0.3 }
    : { transform: [{ scale: 1 - pressed.value * (1 - pressedScale) }] }));
  return {
    style,
    onPressIn: () => { pressed.value = withTiming(1, reduced ? { duration: 0 } : PRESS); },
    onPressOut: () => { pressed.value = withTiming(0, reduced ? motion.uiExit : RELEASE); },
  };
}
