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
  /** Přesun z místa na místo (splash: nápis do nadpisu mapy). */
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
};

/** Bezier s ořezaným vstupem 0–1. Na webu dostane první snímek animace spuštěné z efektu občas záporný čas
 *  (start po časovém razítku snímku) a bezier by extrapoloval mimo dráhu (podložka tabu uskočila o −90 pt). */
const clampedBezier = (x1: number, y1: number, x2: number, y2: number) => {
  const f = Easing.bezierFn(x1, y1, x2, y2);
  return (t: number) => {
    'worklet';
    return f(Math.min(1, Math.max(0, t)));
  };
};
/** Stejné křivky jako `ease`, bezpečné pro animace spouštěné přímo z efektů a handlerů (UI prvky). */
export const easeSafe = { out: clampedBezier(0.22, 1, 0.36, 1), press: clampedBezier(0.5, 0, 0.75, 0) };

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
  /** Okamžité přepnutí uvnitř časované sekvence (withDelay/withSequence potřebují animaci, ne přiřazení): 1 snímek. */
  instant: { duration: 1 } satisfies WithTimingConfig,
  // ── Nothing Dot (spec 2026-10-05 §3–4) ──
  /** Ambientní rotace kotouče: celá otáčka za idleMs (aktuální uzel currentMs); dojezd po roztočení `decay`, haptický tik po `tickDeg`. */
  plateSpin: { idleMs: 40000, currentMs: 24000, decay: 0.997, tickDeg: 30, activeOffset: 8, failOffsetY: 12 },
  /** Živá tečka stavového řádku: jeden cyklus rozsvícení a zhasnutí. */
  liveBlinkMs: 1200,
  /** Stisk dlaždice: zmenšení, 3D naklopení k bodu dotyku, perspektiva, návrat. */
  tilePress: { scale: 0.97, tiltMaxDeg: 6, perspective: 600, releaseMs: 200 },
  /** Smyčka tečkové siluety cviku (U3): tam a zpět přes `phase`, sine (½ − ½·cos). Perioda = celé opakování
   *  (tam i zpět). Opakování svižně, výdrž pomalý dech. Překreslení omezeno na `fps` (JS vlákno, ~40 teček). */
  silhouette: { repsMs: 1800, holdMs: 3600, fps: 30 },
  /** Rozsvícení teček při nástupu (sken zleva / spirála). */
  dotScanMs: 600,
  /** Dotyková vlna teček: poloměr vlivu, max odsunutí, doznění po puštění, opacita rozjasněných teček (`text`). */
  ripple: { radius: 64, push: 4, decayMs: 500, lit: 0.85 },
  /** Ambient mapy: jedna hodina pro všechny kotouče; perioda je společný násobek `idleMs` a `currentMs`
   *  (40 s × 3 = 24 s × 5), takže smyčka nemá skok. Kometa oběhne aktuální kotouč za `cometMs`. */
  ambient: { clockMs: 120000, cometMs: 8000 },
  /** Posun podložky aktivního tabu v plovoucím tab baru. */
  tabSlideMs: 260,
  /** Přejetí prstem po tab baru: od kolika pt vodorovného posunu je to tah, ne tap. */
  tabScrub: { activeOffset: 6 },
  /** Záměr scrollu nad tečkovým pozadím: po `slop` pt se rozhodne; scroll jen když |dy| > `verticalRatio`·|dx| (do ~27° od svislé), jinak tah patří tečkám. */
  scrollIntent: { slop: 10, verticalRatio: 2 },
  /** Nástup obrazovky: hlavička → hero → dlaždice ve vlně. */
  screenIn: { headerAt: 0, heroAt: 80, step: 60, durationMs: 480, rise: 12, maxTiles: 8 },

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
  /** StateView (elite fáze 4): skeleton se ukáže až po `skeletonDelayMs`, ať rychlé načtení nebliká. Pulz dodá motion. */
  /**
   * StateView (elite fáze 4): skeleton se ukáže po `skeletonDelayMs`, vstoupí krátkým prolnutím s posunem
   * `revealRise` pt a pak tečkové řady pomalu dýchají vlnou shora dolů (fáze řady = index × `rowStagger`
   * cyklu). Žádný spinner. Omezený pohyb: statický skeleton bez pulzu i posunu.
   */
  stateView: { skeletonDelayMs: 300, revealMs: 220, revealRise: 6, pulseMs: 1800, pulseMin: 0.45, pulseMax: 1, rowStagger: 0.14 },
  dotLoader: { cycleMs: 1500, speed: 1.25, opacityBase: 0.16, opacityMid: 0.32, opacityPeak: 1 },
  /** Omezený pohyb: místo pružiny a posunu jen krátké prolnutí (spec §6.7). ReduceMotion.Never: jinak by
   *  reanimated se zapnutým omezením prolnutí přeskočil a náhrada by byla skok (elite fáze 4 audit). */
  calmFade: { duration: 200, easing: ease.out, reduceMotion: ReduceMotion.Never } satisfies WithTimingConfig,
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
  /** UX pass U5: obrys aktuálního uzlu (`dotplate-outline`) dýchá s hodinou `breath` (stejná fáze jako záře):
   *  opacita 1 ↔ `low`, scale 1 ↔ `scale`. Po mountu začne na vrcholu (plný obrys = „tady“ hned) a do dechu
   *  se prolne za `blendMs`, takže předání z odemčení (obrys roste s trimem prstence) neskočí.
   *  Omezený pohyb: statický plný obrys. */
  outlinePulse: { low: 0.45, scale: 1.04, blendMs: 500, periodMs: 3600 },
  /** UX pass U5: první mapa nového uživatele: opička po dosednutí na kotouč jednou zamává („pojď“, reakce
   *  `wave` přes `screenOpen`) po `afterLandMs` od příchodu. Jednou za běh appky. Omezený pohyb: `degrade` → pohled. */
  firstRunGreet: { afterLandMs: 420 },
  /** UX pass U5: nástup opičky v zamčené funkci a prázdném stavu: zdvih `rise` pt + prolnutí (`enterSafe`).
   *  Omezený pohyb: `calmFade`. */
  mascotReveal: { rise: 10 },
  /** Rozpad DotRing na tečky (`DotBurst`, zrození): výlet vnitřních teček `inner` × poloměr, vnějšího
   *  rastru `outer` ×, rozptyl ±`jitter`; délka `ms` ease.punch, tečky dohasnou. */
  dotBurst: { inner: 0.7, outer: 0.45, jitter: 0.3, ms: 560 },
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
  /** Skok opice k aktuální lekci po splashi (studený start, `lib/introHop`): opice vyskočí zpoza hlavičky
   *  (`fromX` pt od levé hrany, `fromAbove` pt nad horní hranou výřezu mapy) a obloukem `arc` pt dopadne na uzel
   *  za `ms` (rovnoměrně + parabola výšky `arc`, jako `mapHop`), dopad = `mapHop.dip` + `settle`, haptika `monkeyHop`.
   *  Start `delay` ms po konci splashe (nápis dojel do nadpisu). Omezený pohyb: jen prolnutí `calmFade` na místě. */
  splashHop: { delay: 80, fromX: 56, fromAbove: 24, arc: 64, ms: 560 },
  /**
   * Pull-to-refresh mapy (opičí hlava, póza `loading`). Tah dolů na začátku mapy: obsah jede za prstem s odporem
   * `resist` (nejvýš `max` pt), hlava se vynoří a natáčí úměrně tahu (`dragTurns` otáčky na `threshold`).
   * Po prahu `threshold` lehká haptika `pullArm`; puštění nad prahem = hlava zaparkuje na `rest` pt a točí se
   * (`spinMs` na otáčku, lineárně), dokud se data nenačtou, aspoň `minSpinMs` (ať to nebliká), pak se obsah
   * i hlava vrátí za `hideMs` (`ease.out`). Puštění pod prahem = návrat za `hideMs`. Slop `slop` pt, svislý tah
   * jako `scrollIntent.verticalRatio`. Omezený pohyb: bez rotace, hlava jen prolíná a při načítání pulzuje
   * opacitou `pulseLow` ↔ 1 po `pulseMs`.
   */
  pullRefresh: { slop: 8, resist: 0.5, max: 112, threshold: 72, rest: 64, dragTurns: 0.75, spinMs: 900, minSpinMs: 600, hideMs: 240, parkMs: 180, pulseMs: 700, pulseLow: 0.4 },
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
  /**
   * Reakce opičky (Nothing Dot fáze 3, spec §4.4). Výšky a zdvihy jsou zlomky strany plátna (nezávislé na
   * velikosti), úhly ve stupních, posuny hlavy a pupil v jednotkách viewBoxu 200. Návraty hlavy a pupil jdou
   * pružinou `spring.sal` (opička není ovládací prvek, ťuknutí na ni je hra). Omezený pohyb: `degrade` z
   * `logic/mascotReactions` zbaví reakci skoků a rotací, zbude nálada a oči.
   */
  reactions: {
    /** Poskok na ťuknutí: časy z `motion.hop`, výška `height`. */
    hop: { height: 0.12 },
    /** Salto: přikrčení, výskok s otočkou 360° kolem středu, doskok se zmáčknutím. */
    flip: { height: 0.34, crouchMs: 90, riseMs: 280, fallMs: 300, landMs: 70, recoverMs: 220, squash: 0.1 },
    /** Mazlení: oči zavřené, radost, zmáčknutí `squeeze` (náběh `inMs`, výdrž `holdMs`). */
    cuddle: { squeeze: 0.06, inMs: 160, holdMs: 1100 },
    /** Pohled: `reach` pt od opičky = plná výchylka; pupily ±`pupilX`/`pupilY`, hlava ±`headDeg` a posun `headShift`.
     *  Samostatná reakce (a degradované wave/nod/shrug) = mrknutí očima do strany a zpět. */
    gaze: { reach: 140, pupilX: 3, pupilY: 2.5, headDeg: 6, headShift: 2, glanceMs: 220, holdMs: 360 },
    /** Pohled dolů při scrollu: `droop` (uši a pohled) na `holdMs`, náběh a návrat `motion.moodShift`. */
    lookDown: { holdMs: 700 },
    /** Závrať: kývání hlavy ±`deg`, `swings` půlkmitů po `swingMs`, každý o `decay` menší. */
    dizzy: { deg: 12, swings: 6, swingMs: 110, decay: 0.72 },
    /** Spánek: oči se zavřou za `closeMs`, hlava klesne o `headDip`, dech pomalejší a hlubší. */
    sleep: { closeMs: 500, headDip: 3, breathHalfMs: 2200, breathScale: 0.03 },
    /** Mávnutí: náklon těla kolem chodidel ±`deg`, `times` × tam a zpět po `swingMs`. */
    wave: { deg: 7, times: 3, swingMs: 170 },
    /** Kývnutí: hlava dolů o `dip` a `deg`, `times` ×. */
    nod: { dip: 5, deg: 5, downMs: 110, upMs: 160, times: 2 },
    /** Oslava: nálada celebrate a jantarová hrana šálu na `holdMs`. */
    celebrate: { holdMs: 1800 },
    /** Hrdost: vypnutí hrudi scaleY +`scale` a zdvih `lift`, výdrž `holdMs`. */
    proud: { scale: 0.06, lift: 0.03, inMs: 240, holdMs: 900 },
    /** Smutek: nálada sad na `holdMs` (pak zpět na náladu z aktivity) a povzdech: víčka napůl (`sigh`),
     *  hlava klesne o `dip`, náběh `inMs`. Viditelné i u opičky, která už smutná je. */
    sad: { holdMs: 2000, sigh: 0.45, dip: 3, inMs: 400 },
    /** Skok radosti: hluboké přikrčení, vysoký skok, tvrdší doskok. */
    joyJump: { height: 0.3, squash: 0.12, crouchMs: 120, riseMs: 240, fallMs: 260, landMs: 70, recoverMs: 260 },
    /** Pokrčení ramen: tělo nahoru o `lift`, hlava na stranu `deg`, výdrž `holdMs`. */
    shrug: { lift: 0.035, deg: 10, upMs: 160, holdMs: 340, downMs: 220 },
    /** Sledování kotouče: hlava ±`headDeg` a pupily po kruhu za úhlem kotouče; trvá `holdMs`, náběh/doběh `fadeMs`. */
    spinFollow: { headDeg: 10, holdMs: 2600, fadeMs: 300 },
  },
  /**
   * Život opičky v klidu (idle repertoár, motion-agent). Pauzy mezi akcemi v ms (náhodně v rozsahu, seedovaný
   * generátor), váhy akcí, časy a amplitudy (zlomky strany plátna / stupně / jednotky viewBoxu 200 jako `reactions`).
   * Hraje jen na zaostřené obrazovce, nikdy během reakce (`busyMs` po jejím začátku), omezený pohyb = nic (jen mrkání).
   */
  mascotIdle: {
    pause: { minMs: 4000, maxMs: 12000 },
    /** Vítěz na pódiu ligy: kratší pauzy, poskoky častěji. */
    podiumPause: { minMs: 2500, maxMs: 6000 },
    /** Po začátku reakce se idle nespustí (nejdelší reakce spinFollow ~3.2 s). */
    busyMs: 3500,
    /** Od kolika ms nečinnosti může přijít zívnutí (spánek je v `IDLE_MS` = 20 s). */
    yawnAfterMs: 13000,
    weights: { lookAround: 3, doubleBlink: 3, stretch: 2, sway: 2, headScratch: 2, joyHop: 1, lookPlate: 2, yawn: 0 },
    /** Váhy přebité podle kontextu: pódium = radost, před usnutím = zívnutí. */
    podiumWeights: { joyHop: 6 },
    yawnWeight: 8,
    lookAround: { deg: 7, pupil: 0.9, glanceMs: 280, holdMs: 520, crossMs: 440 },
    doubleBlink: { closeMs: 70, openMs: 100, gapMs: 120 },
    stretch: { scale: 0.07, lift: 0.025, inMs: 420, holdMs: 380, squint: 0.5 },
    sway: { deg: 4, swingMs: 420, swings: 4 },
    headScratch: { deg: 9, dip: 2, inMs: 240, beatMs: 140, beats: 2, holdMs: 200 },
    joyHop: { height: 0.07, squash: 0.05 },
    lookPlate: { pupil: 1, dip: 3, deg: 3, inMs: 320, holdMs: 900 },
    yawn: { headBack: 3, deg: -4, squint: 0.8, stretch: 0.05, inMs: 520, holdMs: 900, outMs: 520 },
    /** Dlouhé roztočení kotouče (součet úhlu za `spinFollow`) = zatočí se jí hlava (dizzy pohyb po doběhu). */
    spinDizzyRad: Math.PI * 6,
    /** Pohled za směrem scrollu mapy: rychlost (pt/s) pro plnou výchylku, náběh, výdrž a návrat; hlava `headDip`. */
    scrollLook: { fullVelocity: 1500, inMs: 120, holdMs: 250, outMs: 420, pupil: 0.8, headDip: 2.5 },
    /** Profil: zamávání po otevření (ms po zaostření, ať je opička vidět). */
    greetDelayMs: 450,
    /** Sekundární pohyb: uši a konec šálu se zpožděním za tělem (pružina následovníka, zisk, strop ve viewBoxu). */
    follow: { damping: 9, stiffness: 140, mass: 1 } satisfies WithSpringConfig,
    earLag: { gain: 0.35, maxY: 5, tiltGain: 0.3, maxX: 3 },
    scarfLag: { gain: 0.6, maxY: 7, tiltGain: 0.5, maxX: 5 },
    /** Přechod nálady: krátké mrknutí a přikrčení `bob` (scaleY), návrat pružinou `spring.sal`. */
    moodBlend: { bob: 0.025, inMs: 110, closeMs: 70, openMs: 120 },
  },
};

/**
 * Vlajková loď: dokončení lekce z teček (Nothing Dot spec §5). Časy v ms od zobrazení scény.
 * 0 pole se rozsvítí vlnou od středu → 200 tečky se slétají spirálou do kotouče (700 ms) → 900 nacvaknutí
 * (scale `snapScale` → 1 pružinou `spring.kotouc`, haptika success) → 1000 opička celebrate, série +1, XP
 * napočítání → 1600 CTA zdola. Omezený pohyb: vše hned, jedním prolnutím `reducedMs`.
 */
export const lessonDone = {
  fieldAt: 0,
  /** Vlna od středu kotouče přeběhne pole za tolik ms (šířka pásma `waveBand` pt). */
  fieldMs: 800,
  waveBand: 56,
  gatherAt: 200,
  /** Slétání teček do víru (2026-10-06: 700 → 1100 ms, výraznější spirála `twist`). */
  gatherMs: 1100,
  /** Podíl `gatherMs`, o který se rozloží starty teček (pořadí spirálou); zbytek je let jedné tečky. */
  gatherStagger: 0.45,
  /** Pootočení dráhy tečky (rad): let po spirále (vír), ne po přímce. */
  twist: 2.6,
  snapAt: 1300,
  snapScale: 1.08,
  mascotAt: 1450,
  /** Titulek a „Zítra“ dosednou s opičkou, XP čísla napočítá `countMs`. */
  countMs: 900,
  ctaAt: 2600,
  ctaRise: 24,
  /** Kotouč scény: průměr jako podíl šířky obsahu (strop `plateMax`). */
  plateFrac: 0.62,
  plateMax: 260,
  /** Strop teček celoplošného pole scény (390 × 844 při rozteči 14 ≈ 1 700). */
  fieldMax: 2000,
  /** Kotouč se během dolétání nadechne na `snapScale` od tohoto podílu `gatherMs`, pak nacvakne. */
  swellFrom: 0.6,
  /** Tečkový shock prstenec při nacvaknutí (`motion.shock`): z poloměru kotouče ven. */
  shockMs: 520,
  /** Rázová vlna polem při nacvaknutí: z kotouče přes celou obrazovku, s krátkým rozzářením teček. */
  shockWaveMs: 900,
  /** Roztočení kotouče po nacvaknutí: `turns` otáček za `ms` (ease-out), pak ambientní rotace. */
  spinKick: { turns: 0.6, ms: 1400 },
  /** Haptický podpis: crescendo tiků při slétání (zrychlují), podíly `gatherMs` od–do; od `lightFrom` light místo selection. */
  crescendo: { ticks: 7, from: 0.15, to: 0.95, lightFrom: 3 },
  /** Notifikace success po heavy nacvaknutí. */
  successAfterSnap: 110,
  /** Dvojitý „heartbeat“ po doběhu XP: odstup úderů. */
  heartbeatGap: 120,
  reducedMs: 200,
  /** Řádek rekordu série (fáze 3) vyjede o tolik pt zdola spolu s hrdostí opičky (`prideBeat`), `motion.reveal`. */
  recordRise: 8,
  /** Doběh na konečný stav při přeskočení (tap kamkoli). */
  skipMs: 150,
};

/**
 * Stage-up (Nothing Dot fáze 2), ms od zobrazení. Stará opička se stáhne a zmizí (`shrinkAt`–+`shrinkMs`),
 * prstenec se nadechne (`tense`), v `shatterAt` se vnitřní prstenec rozpadne na tečky: každá vyletí po oblouku
 * ven (`burst` × poloměr) a pootočená o jednu třetinu kruhu (1 stage) dosedne na místo nového prstence
 * (`shatterMs`, rozložení startů `spread`). Rozsvícení teček se při doletu přepne ze starého stage na nový.
 * V `bornAt` (= dolet) nový prstenec nahradí tečky, opička vyskočí pružinou `motion.pop`, haptika success.
 * Omezený pohyb: rovnou finální stav, fade 200 ms.
 */
export const stageUp = {
  shrinkAt: 300,
  shrinkMs: 300,
  /** Stará opička se smrští na `shrunk` a zmizí. */
  shrunk: 0.6,
  /** Nádech prstence před rozpadem. */
  tenseMs: 120,
  tense: 0.96,
  shatterAt: 620,
  shatterMs: 900,
  /** Podíl `shatterMs`, o který se rozloží starty teček (po směru hodin). */
  spread: 0.35,
  /** Výlet ven: poloměr × (1 + burst), s rozptylem ±`jitter`. */
  burst: 0.32,
  jitter: 0.35,
  /** Starý rastr prstence se rozplyne s rozpadem. */
  oldOutMs: 200,
  /** Nový prstenec převezme tečky prolnutím. */
  handoffMs: 160,
  bornAt: 1520,
  textAt: 1800,
  ctaAt: 2000,
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
  hero: { at: 80, step: 60, rise: 8 },
  /** Pódium ligy: sloupce vyrostou zdola tečku po tečce (`DotRow from=bottom`, celý sloupec `dotScanMs`)
   *  v pořadí 1 → 2 → 3 (`step`), opička dosedne `mascotLag` po startu svého sloupce (≈ po jeho dorůstání) (zdvih `mascotRise`, timing, ne pružina), popisky `labelLag` po něm. Stejné časy hraje pódium,
   *  které se objeví až během relace (přechod z prázdného stavu hlavičky). */
  podium: { at: 120, step: 90, mascotLag: 520, mascotRise: 10, labelLag: 120, rise: 6 },
  /** Liga: k vlastnímu řádku se sjede až po nástupu pódia (`afterMs` od zobrazení) a jen tehdy, když řádek
   *  leží za `screens` výškami okna; jinak obrazovka zůstane nahoře s pódiem. */
  leagueScroll: { afterMs: 1400, screens: 2, returnMs: 350 },
  /** Podstavec PlateStack: stoh vyroste z podlahy (výřez, posun o celou výšku), `motion.reveal`. */
  pedestal: { at: 0 },
  /** Mřížka podlahy panelu lekce: prolne se se zdvihem `rise`, před siluetou (ta jde v `card.step`). */
  floor: { at: 0, rise: 6 },
  /** Editory Cílů: kicker → titulek+lead → obsah po `step`; lišta Zrušit/Uložit stojí (ovládání se nehýbe). */
  goals: { at: 60, step: 70, rise: 10 },
  /** Řádky Cílů v Nastavení: uvnitř sekce po `step` za nástupem sekce; hodnota po načtení se prolne. */
  goalRows: { step: 40 },
  /** Sezóna: karta právě zamčeného cíle se zvedne z `rise` pt (potvrzení „lock in“). */
  lockIn: { rise: 16 },
  /** Onboarding: tečka nového kroku se rozsvítí až po dojetí přechodu `slide_from_right` (~350 ms). */
  stepDot: { at: 380 },
  /** Modaly: obsah nastoupí po přechodu listu (Stack modal ~350 ms se překrývá). */
  modal: { at: 60, step: 50, rise: 10 },
};


/**
 * Let kotouče (elite fáze 1, spec §2.3): kotouč z mapy přeletí do řady teček lekce, cestou se zmenší
 * a pootočí, v posledních `fadeFrom` dráhy se rozpustí do řady. `ms` 450–600, křivka `ease.exit`
 * (rozjezd i dosednutí, žádná pružina). Dokud lekce nezměří cíl, kotouč visí na místě; když cíl nepřijde
 * do `waitMaxMs`, prolne se pryč. Omezený pohyb: jen prolnutí `calmFade` na místě, bez letu.
 * Lekce měří cíl až po `settleMs` (dojetí modalu), měření má strop `measureMaxMs`. Oslava: tečky
 * vyletí ze shluku v místě, kam kotouč zmizel (tvar kotouče × `gatherSpread`).
 */
export const plateFlight = { ms: 520, turns: 0.5, fadeFrom: 0.65, waitMaxMs: 1600, settleMs: 380, measureMaxMs: 120, gatherSpread: 0.2 };

/**
 * Hlavičkový překryv mapy (dluh Task 3): když zmizí bublina průvodce nebo dlaždice, výška překryvu
 * a odsazení mapy dojedou timingem (`ms`, ease.out) místo skoku. Bublina se prolne pryč za `outMs`.
 * Šipka bubliny: tečky dříku se rozsvítí postupně od bubliny k cíli (sken, `scanStepMs` na tečku),
 * pak jednou za `idleMs` přeběhne světlo (`pulseMs`) od bubliny k cíli, ať šipka ukazuje směr. Omezený pohyb: statická.
 */
export const overlayResize = { ms: 260, outMs: 160 };
export const guideArrow = { scanStepMs: 70, idleMs: 2600, pulseMs: 420 };
/**
 * Replika opičky `LineBubble` (elite fáze 3): nástup z hrotu (origin = hrot nad opičkou) prolnutím, posunem
 * o `rise` pt a scale `fromScale` → 1 za `inMs` (`ease.out`, bez zákmitu); odchod rychlejší `outMs` (`ease.exit`).
 * Výměna textu za běhu = jen nový text (žádné blikání). Omezený pohyb: jen prolnutí stejnými délkami.
 */
export const lineBubble = { inMs: 220, outMs: 150, rise: 6, fromScale: 0.9 };
/**
 * Popisky uzlů pod replikou: ustoupí prolnutím rychleji, než bublina nastoupí (`outMs` < `lineBubble.inMs`),
 * a vrátí se až po odchodu bubliny (`backDelayMs` = `lineBubble.outMs`). Prolnutí platí i s omezeným pohybem.
 */
export const labelYield = { outMs: 140, inMs: 220, backDelayMs: lineBubble.outMs };

/** Vstupní test (elite fáze 5): přechod kroku (posun po směru navigace), prstenec stopek planku, reveal výsledku.
 *  `stepShift` pt: vpřed přijede zprava, zpět zleva. `ringLapS`: prstenec stopek se zaplní za minutu (pak další kolo).
 *  Reveal výsledku: čísla napočítají za `countMs`, druhé o `countGapMs` později. */
export const fitnessTest = { stepMs: dur.enter, stepShift: 24, ringLapS: 60, countMs: 600, countGapMs: 120 };

/** Nástup kroku testu: fade + posun o `stepShift` ve směru navigace, `ease.out`, bez pružiny (UI vlákno, sdílená
 *  hodnota; ne layout animace, ta na webu při re-renderu obsahu obal vytrhne do `position: absolute`).
 *  Omezený pohyb: jen `calmFade` na místě. */
export const stepEnterTiming = (reduced: boolean) => (reduced
  ? motion.calmFade
  : { duration: fitnessTest.stepMs, easing: easeSafe.out, reduceMotion: ReduceMotion.Never } satisfies WithTimingConfig);

/**
 * Intro OPICE (studený start): sloupce teček se rozsvítí zleva doprava (`scanMs`, každý sloupec se rozsvítí
 * za `colFadeCols` šířky čela, `ease.out`), pak nápis jednou pulzne (scale `pulseScale`, `pulseMs` tam i zpět,
 * jemná haptika `introPulse`) a celé intro se prolne do mapy (`fadeMs`, `ease.exit`). Celkem ≈ 1.2 s.
 * Když appka po dohrání ještě není ready, nápis drží a jemně dýchá (opacity `holdLow` ↔ 1, `holdHalfMs`),
 * prolnutí přijde, až je ready. Omezený pohyb: nápis rozsvícený hned, jen prolnutí `reducedFadeMs` po ready.
 */
export const dotIntro = { scanMs: 640, colFadeCols: 2, pulseMs: 130, pulseScale: 1.04, fadeMs: 300, reducedFadeMs: 300, holdLow: 0.7, holdHalfMs: 900 };
/** Okamžik, kdy je choreografie (sken + pulz) dohraná a intro se smí prolnout pryč. */
export const dotIntroPlayedMs = (reduced: boolean) => (reduced ? 0 : dotIntro.scanMs + 2 * dotIntro.pulseMs);

/**
 * Pauza mezi cviky (UX pass U1). Přechod cvik → pauza → cvik: obsah nad patičkou přijede zprava o `shift` pt
 * (směr vpřed) a prolne se za `enterMs`, `easeSafe.out`, bez pružiny; patička s tlačítky stojí. Omezený pohyb:
 * jen `calmFade` na místě. Prstenec ubývá plynule (podíl z ms, ne z celých sekund). Posledních `cueFromS`
 * sekund jemný tik (`restTick`) nejvýš jednou za sekundu; v nule jednou `restEnd`.
 */
export const restFlow = { shift: 16, enterMs: dur.enter, cueFromS: 3 };
export const restEnterTiming = (reduced: boolean) => (reduced
  ? motion.calmFade
  : { duration: restFlow.enterMs, easing: easeSafe.out, reduceMotion: ReduceMotion.Never } satisfies WithTimingConfig);

/** Pocit po lekci (U2): po výběru se řádek otázky vymění za potvrzení ve stejné výšce — nový text se prolne
 *  za `swapInMs` (jen opacity, platí i s omezeným pohybem). */
export const feelSwap = { swapInMs: lineBubble.inMs };

/** Fáze siluety v čase: sine tam a zpět, 0 → 1 → 0 za `periodMs` (začíná a končí ve výchozí póze). */
export function silhouettePhase(elapsedMs: number, periodMs: number): number {
  return 0.5 - 0.5 * Math.cos((2 * Math.PI * elapsedMs) / periodMs);
}

/**
 * Opice v2 v pohybu (plán vast-snuggling-sunbeam, krok 1). Přechod mezi pózami = prolnutí úhlů končetin
 * za `transitionMs` (`ease.out` = cubic-bezier(0.22,1,0.36,1)), žádná pružina. Živé smyčky všech póz (periody
 * a amplitudy v `lib/poseMotion` `LIFE_MS`/`LIFE_AMP`); mávnutí předloktím `waveCycles` kmitů. Doplňky z teček
 * (záblesk oslavy, červená tečka radosti) se rozsvítí za `extrasInMs`, vnější prstenec o `extrasLag` později.
 * Zz ve spánku stoupají a mizí za `zzPeriodMs`, o `zzRise` pt viewBoxu. Idle akce s pózou ji drží `idlePoseMs`.
 * Omezený pohyb: póza se vymění hned, smyčky a Zz stojí.
 */
export const mascotPose = {
  transitionMs: 480, cycleInMs: 240, cycleOutMs: 320, waveCycles: 3,
  extrasInMs: 480, extrasLag: 0.35, zzPeriodMs: 3000, zzRise: 14, idlePoseMs: 1600,
};

/**
 * Splash 03 „Tečkový nápis“ (maketa splash2.html build3, uživatel 2026-10-13). Nativní splash = černá base.
 * (1) Nápis OPICE z teček se rozsvěcuje sloupec po sloupci zleva: čelo `scan` jede 0 → cols + `colFade`
 *     po `colStepMs` na sloupec (lineárně), zhasnutá matrice je vidět jako displej.
 * (2) Bez opice (2026-10-13, uživatel): v `liveAt` tečka nad I zčervená (`liveMs`) a hned mrkne (`blinkMs`:
 *     zhasne na `blinkLow` a rozsvítí se), s lehkou haptikou `introPulse`. (3) V `exitAt` (a appka ready) nápis
 *     smrští a odjede na místo nadpisu mapy (`exitMs`, `ease.inOut`), podklad se prolne od `bgFrom` × exitMs,
 *     nápis v druhé polovině. Konec `totalMs` = mapa, pak opice skočí na aktuální uzel (`motion.splashHop`).
 *     Omezený pohyb: statický nápis s živou tečkou, prolnutí `reducedFadeMs`.
 */
export const splash = {
  colStepMs: 18, colFade: 2, liveAt: 700, liveMs: 120,
  blinkMs: 140, blinkLow: 0.15, exitAt: 1080, exitMs: 480, bgFrom: 0.2,
  reducedFadeMs: 200, totalMs: 1560,
};
