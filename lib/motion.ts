import { Easing, FadeIn, FadeInDown, ReduceMotion, useReducedMotion, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

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
  // Časová škála (motion spec §1.3): mikro 80–150, standard 250–400, oslava 800–1600; nad 2 s jen přeskočitelné.
  micro: 120,
  standard: 320,
  celebrate: 1200,
};

/** Tři pojmenované křivky Teplé litiny (motion spec §1.1). Pružina nikdy na tom, na co uživatel ťuká. */
export const spring = {
  /** Kotouč: těžký, krátký dozvuk (ζ ≈ 0.75). Přesuny karet, odemykání uzlů, kotouč do středu scény. */
  kotouc: { damping: 26, stiffness: 300, mass: 1 } satisfies WithSpringConfig,
  /** Šál: jemný, pomalý přestřel (ζ ≈ 0.64). Jen maskot (šál, hlava). */
  sal: { damping: 14, stiffness: 120, mass: 1 } satisfies WithSpringConfig,
};
/** Cvak: okamžitý, bez překmitu. Tap, záložka, toggle, návrat tlačítka. */
const cvak = { duration: dur.micro, easing: ease.out } satisfies WithTimingConfig;

/** Zpoždění i-tého prvku sledu, s víčkem, aby sled četl jako jeden takt. */
export const stagger = (i: number, step: number = dur.step, cap: number = dur.staggerCap) => Math.min(Math.max(0, i) * step, cap);

export const motion = {
  // ── Nothing Dot (spec 2026-10-05 §3–4) ──
  /** Ambientní rotace kotouče: celá otáčka za idleMs (aktuální uzel currentMs); dojezd po roztočení `decay`, haptický tik po `tickDeg`. */
  plateSpin: { idleMs: 40000, currentMs: 24000, decay: 0.997, tickDeg: 30, activeOffset: 8, failOffsetY: 12 },
  /** Živá tečka stavového řádku: jeden cyklus rozsvícení a zhasnutí. */
  liveBlinkMs: 1200,
  /** Stisk dlaždice: zmenšení, 3D naklopení k bodu dotyku, perspektiva, návrat. */
  tilePress: { scale: 0.97, tiltMaxDeg: 6, perspective: 600, releaseMs: 200 },
  /** Rozsvícení teček při nástupu (sken zleva / spirála). */
  dotScanMs: 600,
  /** Dotyková vlna teček: poloměr vlivu, max odsunutí, doznění po puštění. */
  ripple: { radius: 64, push: 4, decayMs: 500 },
  /** Posun podložky aktivního tabu v plovoucím tab baru. */
  tabSlideMs: 260,
  /** Nástup obrazovky: hlavička → hero → dlaždice ve vlně. */
  screenIn: { headerAt: 0, heroAt: 80, step: 60, durationMs: 480, rise: 12 },

  ui: { duration: dur.ui, easing: ease.out } satisfies WithTimingConfig,
  uiExit: { duration: dur.tap, easing: ease.exit } satisfies WithTimingConfig,
  /** Nástup prvku obsahu (karta, řádek): 260 ms punch. */
  enter: { duration: dur.enter, easing: ease.punch } satisfies WithTimingConfig,
  reveal: { duration: dur.reveal, easing: ease.out } satisfies WithTimingConfig,
  /** Stisk (UI vlákno): rychlé stlačení a rozhodný návrat, bez pružiny. */
  press: { duration: dur.press, easing: ease.press } satisfies WithTimingConfig,
  /** Návrat tlačítka = Cvak (§1.2). */
  release: cvak,
  cvak,
  // Kotouč: pád jako gravitace (zrychluje, ease-in), dopad přebírá `seat`.
  fall: { duration: 440, easing: ease.gravity } satisfies WithTimingConfig,
  // Jediná výjimka z pravidla ζ ≥ 0.6 (motion spec §1.2): zaboření kotouče je záměr.
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
  // Kruh zrození a odemčení uzlu = Kotouč (§1.2).
  pop: spring.kotouc,
  unlock: spring.kotouc,
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
  /** Omezený pohyb: místo pružiny a posunu jen krátké prolnutí (spec §6.7). */
  calmFade: { duration: 200, easing: ease.out } satisfies WithTimingConfig,
  /** Mikrointerakce ovládání (Toggle, přechod slidu): timing, nikdy pružina (fáze 3: 150–250 ms). */
  toggle: cvak,
  slide: { duration: 200, easing: ease.out } satisfies WithTimingConfig,
  /** Posun nového slidu recapu ve směru listování (pt). */
  slideShift: 24,
  /** Count-up čísla při prvním zobrazení (Stat progresu sezóny). */
  countFirstMs: 400,
  /** Dech prstence aktuálního uzlu a bosse (motion spec §3.1): perioda 2.4 s ease.sine, opacita 1 ↔ `low`,
   *  scale 1 → `scale`; s omezeným pohybem statická opacita `still`. Jediný zdroj pro PlateNode i BarbellBoss. */
  breath: { low: 0.6, scale: 1.03, still: 0.8, periodMs: 2400 },
  /** Trim fajfky hotového uzlu (§3.1). */
  checkMs: 300,
  /** Zamčený tap: 3 pt, 4 × 60 ms; omezený pohyb opacita na 0.5 a zpět (2 × 120 ms). */
  lockedShake: { px: 3, stepMs: 60, ms: 120, dim: 0.5 },
  /** Odemčení uzlu (§3.1): fade obrysu a litiny 200 ms, Lock 120 ms, trim prstence 400 ms, scale z 0.92. */
  nodeUnlock: { fadeMs: 200, lockMs: 120, trimMs: 400, from: 0.92 },
  /** Boss se odemyká ze scale `from` (ostatní jako uzel). */
  bossUnlock: { from: 0.8 },
  /** Přeskok opičky na nový uzel (§3.1): zpoždění po dosednutí, výška oblouku, přikrčení a propad (pt). */
  mapHop: { delay: 120, arc: 28, crouch: 3, dip: 3 },
  /** Kreslení tečkované cesty mapy. */
  pathDrawMs: 420,
  /** Popover uzlu: vyroste z `from` a přisune se o `shift` pt. */
  popover: { from: 0.94, shift: 8 },
  /** Výdrž: tep posledních `fromS` sekund (scale `to`, náběh `inMs`). */
  holdPulse: { fromS: 3, to: 1.1, inMs: 90 },
  /** +XP slam začíná na tomto scale. */
  slamFrom: 1.2,
  /** Jantarová hrana šálu: prolnutí při vstupu do celebrate. */
  scarfEdge: { duration: 200, easing: ease.out } satisfies WithTimingConfig,
};

/** Oslava lekce: posuny a délky kotoučů (motion spec §4.1, §3.6). */
export const lessonDone = {
  titleRise: 8,
  /** Odkud kotouč přilétá (pravá strana; levá zrcadlově), pt a stupně. */
  from: { x: 140, rotate: 18 },
  collarMs: 120,
  /** Prohnutí osy po dopadu (pt) a jeho náběh. */
  shakeDepth: 3,
  shakeInMs: 50,
  /** Kotouč série: pád z `drop` pt, rozkmit `rattle` pt za `rattleMs`. */
  seriesDrop: 12,
  seriesRattle: 1,
  seriesRattleMs: 40,
  seriesSeat: { damping: 25, stiffness: 520, mass: 1 } satisfies WithSpringConfig,
};

/**
 * Oslava dokončení lekce (§7.3), jedna časová osa. `launch`/`leftLag` od zobrazení scény, zbytek od
 * dopadu pravého kotouče (UI vlákno → `onImpact`). Ember (`accent`) je do dopadu ve scéně nulový:
 * rozžhaví se v okamžiku dotyku kotouče (`heat`), +XP v emberu ho převezme o 120 ms později.
 */
export const celebration = {
  launch: 250,
  leftLag: 60,
  xp: 120,
  cheer: 480,
  title: 760,
  cta: 1000,
  /** Žár kotouče při dopadu: ember naplno v rámu dotyku, chladne do oceli. */
  heat: { peak: 0.85, coolMs: 640 },
};

/**
 * Stage-up (§7.4, plán B Task 26 Step 3), ms od zobrazení. Smrštění 300–600, nádech 600–700 (plán: smrštění
 * 380 ms; zkráceno, aby se nádech vešel před prasknutí v 700), prasknutí 700, nová opice 720
 * pružinou `motion.pop` → text → CTA.
 */
export const stageUp = {
  shrinkAt: 300,
  shrinkMs: 300,
  /** Nádech před prasknutím (jako zrození): kruh se stáhne na `tense`. */
  tenseMs: 100,
  tense: 0.92,
  burstAt: 700,
  burstMs: 420,
  bornAt: 720,
  textAt: 1300,
  ctaAt: 1500,
  shrunk: 0.35,
  ringTo: 1.4,
  oldOutMs: 80,
};

/** Celková délka jednoho poskoku opice (`motion.hop`). */
export const hopMs = () => motion.hop.crouchMs + motion.hop.riseMs + motion.hop.fallMs + motion.hop.landMs + motion.hop.recoverMs;

/** Nástup prvku, který respektuje omezený pohyb vlastní variantou: `reduced` = fade 200 ms (bez posunu),
 *  jinak `enterRise`. Fade běží i se zapnutým omezením pohybu (ReduceMotion.Never), aby změna nebyla skok. */
export const enterSafe = (reduced: boolean, i = 0, rise = 12) => (reduced
  ? FadeIn.duration(motion.calmFade.duration).reduceMotion(ReduceMotion.Never)
  : enterRise(i, rise));

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

/**
 * Úvodní choreografie obrazovek (brag `cinematic` zkrocený: jeden řízený sled na obrazovku, každý úder
 * dosedne, než přijde další). Časy v ms od zobrazení obsahu. Přehrává se jen při prvním zobrazení
 * v relaci (`useFirstShow`); s omezeným pohybem vše jedním 200ms prolnutím bez posunu.
 */
export const intro = {
  /** Mapa: hlavička po položkách → linka sekce se natáhne → kotouče se usadí shora dolů → opice poslední. */
  map: {
    streak: 0,
    telemetry: 70,
    countMs: 600,
    line: 140,
    lineMs: 520,
    plates: 220,
    plateStep: 55,
    /** Kolik uzlů nad aktuálním se usazuje (výš jsou mimo výřez, stojí hned). */
    plateWindow: 6,
    /** Výška pádu kotouče (pt) před dosednutím pružinou `motion.settle`. */
    plateDrop: 28,
    /** Opice dorazí po dosednutí aktuálního uzlu. */
    mascotLag: 180,
    mascotDrop: 20,
  },
  /** Taby: hlavička → obsah po blocích; vlastní řádek ligy jako vyvrcholení po dojetí scrollu. */
  tab: { step: 70, rise: 12 },
  league: { header: 0, rows: 120, meLag: 140, meRise: 16, stripeMs: 260 },
  /** Mřížka aktivity se vyplní po dnech (35 buněk za ≤ 420 ms). */
  grid: { at: 140, step: 12, cellMs: 180 },
  bars: { at: 260, step: 70, ms: 520 },
  chart: { at: 380, ms: 900 },
  profile: { frameMs: 520, xpAt: 160, countMs: 700 },
  /** Lekce: vnitřní sled karty cviku (silueta → název → množství → popis). */
  card: { step: 50, rise: 10 },
  /** Start výdrže: prstenec se nadechne (0.97) a rozhodně vrátí. */
  holdStart: { dip: 0.97 },
  /** Hero sekce mapy (polish 2026-10-05): mezi hlavičkou (0–70) a linkou (140). Štítek+název → číslo →
   *  činka sekce; každý úder `motion.reveal` (480 ms ease.out), zdvih `rise`. Kompaktní varianta bez činky. */
  hero: { at: 40, step: 60, rise: 8 },
  /** Pódium ligy: stupně vyrostou z podlahy v pořadí 1 → 2 → 3 (`step`), opička dosedne `mascotLag` po
   *  svém stupni (zdvih `mascotRise`, timing, ne pružina), popisky `labelLag` po něm. Stejné časy hraje pódium,
   *  které se objeví až během relace (přechod z prázdného stavu hlavičky). */
  podium: { at: 120, step: 90, mascotLag: 160, mascotRise: 10, labelLag: 120, rise: 6 },
  /** Podstavec PlateStack: stoh vyroste z podlahy (výřez, posun o celou výšku), `motion.reveal`. */
  pedestal: { at: 0 },
  /** Mřížka podlahy panelu lekce: prolne se se zdvihem `rise`, před siluetou (ta jde v `card.step`). */
  floor: { at: 0, rise: 6 },
  /** Editory Cílů: kicker → titulek+lead → obsah po `step`; lišta Zrušit/Uložit stojí (ovládání se nehýbe). */
  goals: { at: 60, step: 70, rise: 10 },
  /** Řádky Cílů v Nastavení: uvnitř sekce po `step` za nástupem sekce; hodnota po načtení se prolne. */
  goalRows: { step: 40 },
  /** Modaly: obsah nastoupí po přechodu listu (Stack modal ~350 ms se překrývá). */
  modal: { at: 60, step: 50, rise: 10 },
};
