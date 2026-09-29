import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion, useMotionSafe } from '@/lib/motion';

/** Odezva na stisk pro UI ovládání: zmenšení v timingu, bez pružiny (spec §6.7).
 *  S omezeným pohybem se místo zmenšení jen krátce ztlumí opacita. */
export function usePressFeedback(pressedScale: number) {
  const { reduced } = useMotionSafe();
  const pressed = useSharedValue(0);
  const style = useAnimatedStyle(() => (reduced
    ? { opacity: 1 - pressed.value * 0.3 }
    : { transform: [{ scale: 1 - pressed.value * (1 - pressedScale) }] }));
  return {
    style,
    onPressIn: () => { pressed.value = withTiming(1, motion.ui); },
    onPressOut: () => { pressed.value = withTiming(0, motion.uiExit); },
  };
}
