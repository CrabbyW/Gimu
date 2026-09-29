import { Easing, useReducedMotion, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

// Spec §6.7: UI prvky jen timing 150–200 ms, pružiny výhradně na herní odměny.
export const motion = {
  ui: { duration: 180, easing: Easing.bezier(0.22, 1, 0.36, 1) } satisfies WithTimingConfig,
  uiExit: { duration: 150, easing: Easing.bezier(0.4, 0, 0.2, 1) } satisfies WithTimingConfig,
  reveal: { duration: 480, easing: Easing.bezier(0.22, 1, 0.36, 1) } satisfies WithTimingConfig,
  snap: { damping: 11, stiffness: 180, mass: 1.1 } satisfies WithSpringConfig, // kotouč: znatelný přestřel
  pop: { damping: 9, stiffness: 260, mass: 0.8 } satisfies WithSpringConfig, // +XP
  unlock: { damping: 14, stiffness: 200 } satisfies WithSpringConfig, // odemčení uzlu
  hop: { damping: 12, stiffness: 240 } satisfies WithSpringConfig, // opice
};

/** Při zapnutém omezení pohybu se pružiny nahradí 200ms fade a pulzování se vypne. */
export const useMotionSafe = () => ({ reduced: useReducedMotion() });
