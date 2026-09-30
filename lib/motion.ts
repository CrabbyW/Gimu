import { Easing, FadeInDown, useReducedMotion, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

/*
 * Pohybová osobnost „Posilovna“ (UX2, odvozeno z brag tónu `cinematic`, zkrocené pro appku):
 * - UI mluví krátce a rozhodně: silný ease-out, žádný zákmit, 90–300 ms. Ovládání nikdy nepéruje.
 * - Odměny mají váhu: pád zrychluje jako závaží, dopad je tvrdý (punch „kamery“, úder, zvuk),
 *   dosednutí je kontrolovaná pružina ζ 0.7–0.85 (znát, ne vidět). Čísla přiletí shora (scale 1.2 → 1).
 * - Postupné nástupy drží jeden takt: celý sled ≤ ~360 ms (hyperframes: items × stagger ≤ 0.5 s).
 * - Omezení pohybu: timing a pružiny z reanimated mají výchozí ReduceMotion.System (skočí na konec);
 *   kde by to rozbilo scénu, komponenty mají vlastní klidovou variantu (fade 200 ms).
 */

/** Pojmenované křivky. Hladké rodiny podle energie (hyperframes): calm → standard → punch. */
export const ease = {
  /** Standardní nástup UI (spec §6.7 entrance, ≈ power3/expo.out). */
  out: Easing.bezier(0.22, 1, 0.36, 1),
  /** Punch: velmi rychlý začátek, dlouhé doběhnutí (≈ expo.out). Nástupy odměn, slam čísla. */
  punch: Easing.bezier(0.16, 1, 0.3, 1),
  /** Odchod UI (spec §6.7 exit). */
  exit: Easing.bezier(0.4, 0, 0.2, 1),
  /** Gravitace: zrychluje do dopadu (pád kotouče, doskok opice). */
  gravity: Easing.bezier(0.55, 0, 0.9, 0.5),
  /** Stlačení při stisku: lineárně rychlé, bez měkkosti (press-release: press je power1.in). */
  press: Easing.bezier(0.5, 0, 0.75, 0),
  /** Klidná smyčka (dech, puls). */
  sine: Easing.bezier(0.37, 0, 0.63, 1),
};

/** Délky (ms). UI 150–300, odměny delší. */
export const dur = {
  press: 90,
  release: 220,
  tap: 150,
  ui: 180,
  enter: 260,
  reveal: 480,
  step: 45,
  staggerCap: 360,
};

/** Zpoždění i-tého prvku sledu, s víčkem, aby sled četl jako jeden takt. */
export const stagger = (i: number, step: number = dur.step, cap: number = dur.staggerCap) => Math.min(Math.max(0, i) * step, cap);

export const motion = {
  ui: { duration: dur.ui, easing: ease.out } satisfies WithTimingConfig,
  uiExit: { duration: dur.tap, easing: ease.exit } satisfies WithTimingConfig,
  /** Nástup prvku obsahu (karta, řádek): 260 ms punch. */
  enter: { duration: dur.enter, easing: ease.punch } satisfies WithTimingConfig,
  reveal: { duration: dur.reveal, easing: ease.out } satisfies WithTimingConfig,
  /** Stisk (UI vlákno): rychlé stlačení a rozhodný návrat, bez pružiny. */
  press: { duration: dur.press, easing: ease.press } satisfies WithTimingConfig,
  release: { duration: dur.release, easing: ease.punch } satisfies WithTimingConfig,
  // Kotouč: pád jako gravitace (zrychluje, ease-in), dopad přebírá `seat`.
  fall: { duration: 440, easing: ease.gravity } satisfies WithTimingConfig,
  // Dosednutí kotouče na osu: pružina z 0 s rychlostí dopadu (pt/s, dolů). ζ ≈ 0.55 → zaboří se ~6 pt
  // a vrátí s přestřelem < 1 pt nad osu, doznění ~250 ms. Těžké, čisté zacvaknutí.
  seat: { damping: 25, stiffness: 520, mass: 1, velocity: 260 } satisfies WithSpringConfig,
  // Rozkmit osy po dopadu: krátký, ζ ≈ 0.45 (jeden zákmit ~0.6 pt nad klid, doznění ~250 ms).
  rattle: { damping: 22, stiffness: 600 } satisfies WithSpringConfig,
  /** Punch scény při dopadu: nádech 1 → 1.018 za 60 ms, pak doběh `release`. */
  punch: { scale: 1.018, inMs: 60 },
  /** +XP slam: scale 1.2 → 1, ζ ≈ 0.8 (iOS register, přestřel ~1 %, znát, ne vidět). */
  slam: { damping: 33, stiffness: 420, mass: 1 } satisfies WithSpringConfig,
  /** Count-up +XP (expo.out: čísla naskočí a dojedou). */
  countMs: 700,
  // Odměny: pružiny jen tady (spec §6.7). Laděno na ζ 0.7–0.85 (hyperframes: fyzický dozvuk, ne kreslený zákmit).
  pop: { damping: 21, stiffness: 220, mass: 1 } satisfies WithSpringConfig, // ζ ≈ 0.7, kruh zrození
  unlock: { damping: 22, stiffness: 260 } satisfies WithSpringConfig, // ζ ≈ 0.68, odemčení uzlu
  /** Dosednutí opice (zrození, návrat z pózy): ζ ≈ 0.85. */
  settle: { damping: 29, stiffness: 300 } satisfies WithSpringConfig,
  /** Poskok opice: přikrčení → odraz (ease-out) → pád (gravitace) → dopad (squash). Bez pružiny,
   *  takže nikdy neklesne pod klid (dřív pružina `hop` ζ 0.39 propadla ~16 pt pod zem). */
  hop: { crouchMs: 70, riseMs: 150, fallMs: 170, landMs: 60, recoverMs: 180, squash: 0.06 },
  /** Shock kruh při odemčení uzlu: 1 → 1.45, opacita 0.7 → 0, 420 ms punch. */
  shock: { to: 1.45, from: 0.7, duration: 420 },
  // Opice: zvednutí paží do celebrate (a zpět), 220 ms ease-out.
  armsRaise: { duration: 220, easing: ease.out } satisfies WithTimingConfig,
  // Opice: přechod do smutku a z něj (uši, pohled, pusa, dosednutí), 300 ms bez pružiny: smutek neodskakuje.
  moodShift: { duration: 300, easing: ease.out } satisfies WithTimingConfig,
  // Opice celebrate: pauza na zemi mezi opakovanými poskoky (ms).
  celebrateRestMs: 600,
  // DotLoader (port @dotmatrix dotm-square-11 „Echo Ring“): mřížka 5×5, cyklus 1500 ms / speed,
  // výchozí speed 1.25, trojice opacit z dotmatrix-loader.css (--dmx-opacity-*).
  dotLoader: { cycleMs: 1500, speed: 1.25, opacityBase: 0.16, opacityMid: 0.32, opacityPeak: 1 },
};

/** Layout animace nástupu: fade + zdvih o `rise` pt (FadeInDown), i-tý prvek sledu se zpožděním
 *  `stagger(i)`, `motion.enter`. Builder (ne vlastní worklet), aby běžel i na webu (CSS keyframy);
 *  na nativu na UI vlákně. S omezeným pohybem reanimated přeskočí na konečný stav (ReduceMotion.System). */
export const enterRise = (i = 0, rise = 12) => FadeInDown
  .duration(dur.enter)
  .easing(ease.punch)
  .delay(stagger(i))
  .withInitialValues({ opacity: 0, transform: [{ translateY: rise }] });

/** Při zapnutém omezení pohybu se pružiny nahradí 200ms fade a pulzování se vypne. */
export const useMotionSafe = () => ({ reduced: useReducedMotion() });
