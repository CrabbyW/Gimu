import { Easing, useReducedMotion, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

// Spec §6.7: UI prvky jen timing 150–200 ms, pružiny výhradně na herní odměny.
export const motion = {
  ui: { duration: 180, easing: Easing.bezier(0.22, 1, 0.36, 1) } satisfies WithTimingConfig,
  uiExit: { duration: 150, easing: Easing.bezier(0.4, 0, 0.2, 1) } satisfies WithTimingConfig,
  reveal: { duration: 480, easing: Easing.bezier(0.22, 1, 0.36, 1) } satisfies WithTimingConfig,
  // Kotouč: pád jako gravitace (zrychluje, ease-in), dopad přebírá `seat`.
  fall: { duration: 440, easing: Easing.bezier(0.55, 0, 0.9, 0.5) } satisfies WithTimingConfig,
  // Dosednutí kotouče na osu: pružina z 0 s rychlostí dopadu (pt/s, dolů). ζ ≈ 0.55 → zaboří se ~6 pt
  // a vrátí s přestřelem < 1 pt nad osu, doznění ~250 ms. Těžké, čisté zacvaknutí.
  seat: { damping: 25, stiffness: 520, mass: 1, velocity: 260 } satisfies WithSpringConfig,
  // Rozkmit osy po dopadu: krátký, ζ ≈ 0.45 (jeden zákmit ~0.6 pt nad klid, doznění ~250 ms).
  rattle: { damping: 22, stiffness: 600 } satisfies WithSpringConfig,
  pop: { damping: 9, stiffness: 260, mass: 0.8 } satisfies WithSpringConfig, // +XP
  unlock: { damping: 14, stiffness: 200 } satisfies WithSpringConfig, // odemčení uzlu
  hop: { damping: 12, stiffness: 240 } satisfies WithSpringConfig, // opice
  // Opice: zvednutí paží do celebrate (a zpět), 220 ms ease-out.
  armsRaise: { duration: 220, easing: Easing.bezier(0.22, 1, 0.36, 1) } satisfies WithTimingConfig,
  // Opice: přechod do smutku a z něj (uši, pohled, pusa, dosednutí), 300 ms bez pružiny: smutek neodskakuje.
  moodShift: { duration: 300, easing: Easing.bezier(0.22, 1, 0.36, 1) } satisfies WithTimingConfig,
  // Opice celebrate: pauza na zemi mezi opakovanými poskoky (ms).
  celebrateRestMs: 600,
};

/** Při zapnutém omezení pohybu se pružiny nahradí 200ms fade a pulzování se vypne. */
export const useMotionSafe = () => ({ reduced: useReducedMotion() });
