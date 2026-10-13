import { MASCOT_POSE_IDS, type EyeState, type MascotPose, type MascotPoseId } from '@/logic/mascotPoses';

/**
 * Pózy opice v pohybu (motion-agent, plán „vast-snuggling-sunbeam“ krok 1). Póza z `logic/mascotPoses` se
 * převede na plochý vektor čísel (`poseVector`), aby šla interpolovat na UI vlákně: worklet zachytí jen
 * sdílené hodnoty s polem čísel, nikdy objekt pózy (pravidlo `local/no-worklet-object-capture`).
 * Vše tady je čistá matematika ('worklet' funkce), testovaná v `lib/__tests__/poseMotion.test.ts`.
 */

/** Indexy ve vektoru pózy. */
export const PV = {
  armLu: 0, armLl: 1, armRu: 2, armRl: 3, legLu: 4, legLl: 5, legRu: 6, legRl: 7,
  body: 8, dx: 9, dy: 10, headDx: 11, headDy: 12, headTilt: 13, reach: 14, eyeRy: 15, eyeDrop: 16,
  /** Jen pohyb (statická póza = 0 / 1): náklon uší (°, kolem středu hlavy), pohled do strany, přivření očí (× výška). */
  earL: 17, earR: 18, lookX: 19, squint: 20,
  /** Výřez postavy jako čísla, aby šel prolnout: krytí trupu a končetin (full), krytí busty, spodní ořez (200 = bez ořezu). */
  full: 21, bust: 22, clipY: 23,
} as const;
export const POSE_LEN = 24;
/** Spodní ořez „bez ořezu“ = celý viewBox. */
export const CLIP_NONE = 200;

/** Oči podle pózy jako čísla (výška elipsy a pokles), shodné s `monkeyGeometry.EYE_RY/EYE_DROP`. */
export interface EyeNumbers { ry: Record<EyeState, number>; drop: Record<EyeState, number> }

export function poseVector(p: MascotPose, eyes: EyeNumbers): number[] {
  return [
    p.armL.upper, p.armL.lower, p.armR.upper, p.armR.lower, p.legL.upper, p.legL.lower, p.legR.upper, p.legR.lower,
    p.body, p.dx, p.dy, p.head.dx, p.head.dy, p.head.tilt, p.reach, eyes.ry[p.eyes], eyes.drop[p.eyes],
    0, 0, 0, 1,
    p.figure === 'full' ? 1 : 0, p.figure === 'bust' ? 1 : 0, p.clipY > 0 ? p.clipY : CLIP_NONE,
  ];
}

/** Prolnutí dvou vektorů pózy (t ořezané do 0–1). */
export function mixVector(a: readonly number[], b: readonly number[], t: number): number[] {
  'worklet';
  const k = Math.max(0, Math.min(1, t));
  const out = new Array<number>(POSE_LEN);
  for (let i = 0; i < POSE_LEN; i++) out[i] = (a[i] ?? 0) + ((b[i] ?? 0) - (a[i] ?? 0)) * k;
  return out;
}

/**
 * Živá smyčka každé pózy (uživatel: „zanimuj zbytek opičky“). Všechno z jedné hodiny `clock` 0–1 za
 * `LIFE_CLOCK_MS`; periody pózy ji dělí beze zbytku, takže přetočení hodiny nedá skok. Hlava, uši, oči,
 * trup i končetiny mají vlastní fázi se zpožděním (`lag`) za tělem = překryv a dokmitání bez pružiny.
 * Kódy póz: pořadí `MASCOT_POSE_IDS`.
 */
export const LIFE_CLOCK_MS = 60000;
/** Kód pózy = pořadí v `MASCOT_POSE_IDS`; všech 32 póz má živou smyčku. */
export const POSE_CODE = Object.fromEntries(MASCOT_POSE_IDS.map((id, i) => [id, i])) as Record<MascotPoseId, number>;
/** Počet póz se živou smyčkou v `applyLife` (kódy 0 … LIVE_POSES − 1) = všechny. */
export const LIVE_POSES = 43;
/** Kódy póz z reference (číselné konstanty: worklet nesmí zachytit objekt `POSE_CODE`; test hlídá shodu). */
export const PC = {
  loading: 8, peek: 9, wait: 10, pull: 11, sync: 12, success: 13, fail: 14, warning: 15, offline: 16, empty: 17,
  search: 18, notify: 19, inspect: 20, settings: 21, avatar: 22, locked: 23, streak: 24, trophy: 25, medal: 26,
  levelUp: 27, flex: 28, handstand: 29, plank: 30, stretch: 31,
} as const;
const C_LOADING = 8, C_PEEK = 9, C_WAIT = 10, C_PULL = 11, C_SYNC = 12, C_SUCCESS = 13, C_FAIL = 14, C_WARNING = 15;
const C_OFFLINE = 16, C_EMPTY = 17, C_SEARCH = 18, C_NOTIFY = 19, C_INSPECT = 20, C_SETTINGS = 21, C_AVATAR = 22;
const C_LOCKED = 23, C_STREAK = 24, C_TROPHY = 25, C_MEDAL = 26, C_LEVELUP = 27, C_FLEX = 28, C_HANDSTAND = 29;
const C_PLANK = 30, C_STRETCH = 31;
/**
 * Perioda smyčky pózy v ms (dělí `LIFE_CLOCK_MS`); mávnutí předloktím má vlastní `WAVE_MS`.
 * Pořadí = kódy: 8 původních, pak loading … stretch. Tempo klidné: rychlé jsou jen plamen, „!“ a třes výdrže.
 */
export const LIFE_MS = [
  5000, 5000, 1000, 6000, 4000, 2000, 1500, 600,
  2400, 4000, 6000, 2000, 3000, 3000, 4000, 1200, 3000, 3000, 4000, 2000, 4000, 6000, 6000, 3000,
  1200, 3000, 3000, 2000, 2000, 3000, 2000, 5000,
  // Repertoár (design-agent, statické pózy; vlastní pohyb dodá motion-agent): obecná živá smyčka.
  4000, 4000, 5000, 3000, 3000, 2000, 1500, 6000, 4000, 3000, 4000,
] as const;
/** Vedlejší periody (dělí `LIFE_CLOCK_MS`): ťukání nohou, mihotání plamene, třes výdrže, oběh tečkového kruhu profilu. */
export const SUB_MS = { tap: 1500, flicker: 600, tremorA: 200, tremorB: 300, avatarOrbit: 6000 } as const;
export const WAVE_MS = 600;
/** Amplitudy (° / pt viewBoxu / násobky): mávnutí, vis, klik, běh, idle váha, oslava, uši. */
export const LIFE_AMP = {
  waveDeg: 26, waveUpperDeg: 6, hangDeg: 4, hangLegDeg: 7, pushupBodyDeg: 8, pushupReach: 0.26, runBob: 2.5,
  idleBodyDeg: 1.6, idleShift: 0.8, idleHeadDeg: 2.2, idleArmDeg: 2.5, idleLegDeg: 1.5, look: 1.4,
  joyArmDeg: 6, joyForearmDeg: 8, joyBounce: 2.5, joyHeadDeg: 2.5, joySquint: 0.78,
  sadBodyDeg: 0.8, sadHeadDeg: 1.5, sadDroop: 1, sleepBreath: 0.8, earGain: 1.6,
  // Pózy z reference: dech pózy s rekvizitou na hrudi (rekvizita jde s ním), vykukování, tah, pokrčení, biceps…
  chestBreath: 0.7, peekDip: 12, pullLeanDeg: 6, pullShift: 3, nod: 2.5, shakeDeg: 3.5, shrugDeg: 12,
  loupeOrbit: 2.5, bellDeg: 14, lockDeg: 8, flexDeg: 16, standDeg: 2.5, tremor: 0.35, stretchReach: 0.15,
  flameScale: 0.07, liveScale: 0.3, bangScale: 0.14, zoom: 0.1, medalDeg: 6, cupLift: 2, avatarBump: 0.6,
} as const;
const LAG = 0.12;

/** Fáze 0–1 pózy s periodou `ms` v čase hodiny (s posunem `shift` periody). */
function ph(clock: number, ms: number, shift: number): number {
  'worklet';
  const x = (clock * LIFE_CLOCK_MS) / ms - shift;
  return x - Math.floor(x);
}

/** Hladký hrb 0 → 1 → 0 v okně [a, b] fáze (sin², mimo okno 0). */
export function bump(p: number, a: number, b: number): number {
  'worklet';
  if (p <= a || p >= b) return 0;
  const x = Math.sin(((p - a) / (b - a)) * Math.PI);
  return x * x;
}
/** Hladký krok 0 → 1 v okně [a, b]. */
export function step01(p: number, a: number, b: number): number {
  'worklet';
  const x = Math.max(0, Math.min(1, (p - a) / (b - a)));
  return x * x * (3 - 2 * x);
}
/** Doznívající kmit na začátku periody (zvonek, zámek): `cycles` kmitů v okně [0, win], amplituda klesá k 0. */
export function ringOut(p: number, win: number, cycles: number): number {
  'worklet';
  if (p >= win) return 0;
  const k = 1 - p / win;
  return Math.sin((p / win) * cycles * Math.PI * 2) * k * k;
}

/** Pózy, které drží rekvizitu na hrudi: trup dýchá jen svisle a rekvizita jde s ním (nic se neodtrhne od rukou). */
export function chestHold(code: number): boolean {
  'worklet';
  return code === C_WARNING || code === C_OFFLINE || code === C_NOTIFY || code === C_SETTINGS || code === C_LOCKED
    || code === C_TROPHY || code === C_MEDAL;
}
/** Svislý posun hrudi (pt viewBoxu) pózy s rekvizitou na hrudi: dech, u poháru hrdé povyskočení. */
export function chestDy(code: number, clock: number, on: number): number {
  'worklet';
  if (on <= 0 || !chestHold(code)) return 0;
  const p = ph(clock, LIFE_MS[code] ?? 3000, 0);
  if (code === C_TROPHY) return -LIFE_AMP.cupLift * bump(p, 0, 0.45);
  return -LIFE_AMP.chestBreath * 0.5 * (1 - Math.cos(p * Math.PI * 2));
}

/** Smyčky 24 póz z reference (kód ≥ 8): celé tělo (váha, hlava, uši se zpožděním, oči) + charakter pózy. */
function lifeRef(out: number[], v: readonly number[], code: number, clock: number, p: number, s: number, sl: number): void {
  'worklet';
  const A = LIFE_AMP;
  const T = Math.PI * 2;
  const period = LIFE_MS[code] ?? 4000;
  const add = (i: number, d: number) => { out[i] = (out[i] ?? 0) + d; };
  const ears = (deg: number) => { add(17, A.earGain * deg * (sl - s)); add(18, -A.earGain * deg * (sl - s)); };
  // Stoj: přenesení váhy jako idle (k = síla), hlava kontruje se zpožděním, paže dobíhají.
  const stand = (k: number, arms: number) => {
    add(8, A.idleBodyDeg * k * s); add(9, A.idleShift * k * s);
    add(13, -A.idleHeadDeg * sl);
    add(0, A.idleArmDeg * arms * sl); add(2, -A.idleArmDeg * arms * sl);
    add(4, A.idleLegDeg * k * s); add(6, -A.idleLegDeg * k * s);
    ears(A.idleHeadDeg);
  };
  // Pohled drží chvíli vlevo, chvíli vpravo.
  const glance = (shift: number) => A.look * Math.max(-1, Math.min(1, 2.2 * Math.sin(ph(clock, period, shift) * T)));
  if (chestHold(code)) {
    // Rekvizita na hrudi: trup jen dýchá (posun s rekvizitou), hlava a uši žijí, paže drží.
    add(10, chestDy(code, clock, 1));
    add(13, -A.idleHeadDeg * sl);
    ears(A.idleHeadDeg);
  }
  if (code === C_LOADING || code === C_SYNC) {
    // Jen hlava v kruhu: oči sledují obíhající tečku / šipky, hlava se lehce naklání za nimi.
    const a = p * T - Math.PI / 2;
    add(19, A.look * 1.2 * Math.cos(a)); add(16, 0.8 * Math.sin(a));
    add(13, 2 * Math.cos(a));
    add(10, -0.3 * (1 - Math.cos(p * T * 2)));
    ears(A.idleHeadDeg);
  } else if (code === C_PEEK) {
    // Vykukuje: většinu času nahoře a rozhlíží se, ke konci periody se schová pod hranu a znovu vykoukne.
    add(10, A.peekDip * bump(p, 0.72, 1));
    add(19, glance(0.1));
    add(13, 2 * Math.sin(ph(clock, period, 0.1) * T));
    ears(A.idleHeadDeg * 1.5);
  } else if (code === C_WAIT) {
    // Čeká: pomalá váha, hlava nakloněná, levá noha ťuká.
    stand(1, 0.6);
    add(4, -5 * Math.max(0, Math.sin(ph(clock, SUB_MS.tap, 0) * T)));
    add(19, glance(0.3));
  } else if (code === C_PULL) {
    // Tah: záklon a posun dozadu v první půli periody, hlava se zpožděním, pak povolí.
    const tug = bump(p, 0, 0.5);
    const tugL = bump(ph(clock, period, LAG), 0, 0.5);
    add(8, -A.pullLeanDeg * tug); add(9, -A.pullShift * tug);
    add(1, -6 * tug); add(3, 6 * tug);
    add(13, 3 * tugL);
    add(4, -3 * tug); add(6, 3 * tug);
    out[20] = 1 - 0.15 * tug;
    ears(A.idleHeadDeg * 2);
  } else if (code === C_SUCCESS) {
    // Úspěch: kývnutí hlavou a mírné povyskočení, pravá ruka ukazuje na fajfku.
    stand(0.6, 0);
    const nod = bump(p, 0, 0.3);
    add(12, A.nod * nod); add(10, -1 * nod);
    add(2, 6 * bump(ph(clock, period, LAG), 0, 0.4));
    out[20] = 1 - 0.18 * nod;
  } else if (code === C_FAIL) {
    // Neúspěch: pomalé smutné vrtění hlavou, svěšení.
    stand(0.4, 0.5);
    const sh = Math.sin(p * T * 2) * bump(p, 0, 0.6);
    add(13, A.shakeDeg * sh); add(19, A.look * 0.8 * sh);
    add(12, A.sadDroop * 0.5 * (1 + sl));
  } else if (code === C_WARNING) {
    add(12, -0.8 * bump(p, 0, 0.3));
  } else if (code === C_OFFLINE) {
    add(13, -2 * sl); add(19, A.look * 0.8);
  } else if (code === C_EMPTY) {
    // Pokrčení rameny: paže nahoru, hlava se zanoří a nakloní, pak povolí.
    const sh = bump(p, 0.1, 0.6);
    const shL = bump(ph(clock, period, LAG), 0.1, 0.6);
    stand(0.4, 0);
    add(0, A.shrugDeg * sh); add(2, A.shrugDeg * sh);
    add(1, -A.shrugDeg * sh); add(3, -A.shrugDeg * sh);
    add(12, 2 * shL); add(13, 4 * shL);
    add(10, -1 * sh);
  } else if (code === C_SEARCH) {
    // Hledá: lupa krouží u oka, ruka ji vede, oči za ní.
    stand(0.5, 0);
    const a = p * T;
    add(2, 3 * Math.sin(a)); add(3, -3 * Math.cos(a));
    add(19, A.look * Math.cos(a)); add(16, 0.6 * Math.sin(a));
  } else if (code === C_NOTIFY) {
    // Zvonek: s rozhoupáním sebou hlava cukne.
    add(13, 1.5 * ringOut(p, 0.5, 3));
  } else if (code === C_INSPECT) {
    // Zkoumá: hlava se nakloní k lupě, jak se přibližuje.
    stand(0.4, 0);
    const z = 0.5 * (1 - Math.cos(p * T));
    add(11, 1.5 * z); add(12, 1 * z); add(2, -3 * z);
  } else if (code === C_SETTINGS) {
    add(19, A.look * 0.6 * Math.sin(p * T));
  } else if (code === C_AVATAR) {
    // Busta: dech ramen, hlava a pohled žijí.
    add(10, -A.chestBreath * 0.5 * (1 - Math.cos(p * T)));
    add(13, -A.idleHeadDeg * sl); add(19, glance(0.2));
    ears(A.idleHeadDeg);
  } else if (code === C_LOCKED) {
    // Zámek cukne: paže se zatáhnou, hlava překvapeně.
    const j = ringOut(p, 0.25, 3);
    add(0, 2 * j); add(2, -2 * j); add(13, 2 * Math.abs(j));
  } else if (code === C_STREAK) {
    stand(0.6, 0.3);
    add(19, A.look * 0.9);
  } else if (code === C_TROPHY) {
    out[20] = 1 - 0.2 * bump(p, 0, 0.45);
  } else if (code === C_MEDAL) {
    add(13, 1.5 * Math.sin(ph(clock, period, LAG) * T));
  } else if (code === C_LEVELUP) {
    // Krok po schodech: nohy a paže se střídají (jako běh, pomaleji), poskok s každým krokem.
    const w = (1 + s) / 2;
    for (let i = 0; i < 8; i += 4) {
      const lu = v[i] ?? 0, ll = v[i + 1] ?? 0, ru = v[i + 2] ?? 0, rl = v[i + 3] ?? 0;
      out[i] = lu + (ru - lu) * w; out[i + 1] = ll + (rl - ll) * w;
      out[i + 2] = ru + (lu - ru) * w; out[i + 3] = rl + (ll - rl) * w;
    }
    add(10, -1.5 * Math.abs(Math.cos(p * T)));
    add(13, 1.5 * sl);
    ears(A.idleHeadDeg);
  } else if (code === C_FLEX) {
    // Zatnutí bicepsu: předloktí se dotáhne, trup a hlava k paži, oči přivřené úsilím.
    const f = 0.5 * (1 - Math.cos(p * T));
    add(3, A.flexDeg * f); add(2, 4 * f);
    add(8, -1.5 * f); add(13, 3 * f);
    out[20] = 1 - 0.25 * f;
    ears(A.idleHeadDeg);
  } else if (code === C_HANDSTAND) {
    // Stojka: balancování řeší `swayDeg` (kolem dlaní); nohy kontrují se zpožděním.
    add(4, 4 * sl); add(6, -4 * sl);
    add(13, -1.5 * sl);
    ears(A.idleHeadDeg);
  } else if (code === C_PLANK) {
    // Výdrž: jemný třes (dvě rychlé periody) nad pomalým dechem.
    const tr = A.tremor * (Math.sin(ph(clock, SUB_MS.tremorA, 0) * T) + 0.7 * Math.sin(ph(clock, SUB_MS.tremorB, 0) * T));
    add(10, tr - 0.2 * (1 - Math.cos(p * T))); add(8, 0.3 * tr);
    add(13, 0.8 * sl);
  } else if (code === C_STRETCH) {
    // Protažení: ruce se natáhnou výš, postava povyroste, trup se ukloní do strany.
    const st = 0.5 * (1 - Math.cos(p * T));
    add(14, A.stretchReach * st); add(10, -2 * st);
    add(8, 2 * s); add(13, -2 * sl);
    ears(A.idleHeadDeg);
  } else if (code >= 32) {
    // Repertoár (design-agent, dočasně): jen dech a hlava, vlastní pohyb pózy dodá motion-agent.
    add(10, -A.chestBreath * 0.5 * (1 - Math.cos(p * T)));
    add(13, -A.idleHeadDeg * sl);
    ears(A.idleHeadDeg);
  }
}

/**
 * Vektor pózy se živou smyčkou: `code` = `POSE_CODE`, `on` 0/1 (omezený pohyb = 0 → statická póza),
 * `waveAmp` 0–1 = náběh/doběh mávnutí předloktím.
 */
export function applyLife(v: readonly number[], code: number, clock: number, on: number, waveAmp: number): number[] {
  'worklet';
  const out = v.slice();
  if (on <= 0) return out;
  const A = LIFE_AMP;
  const T = Math.PI * 2;
  const period = LIFE_MS[code] ?? 5000;
  const p = ph(clock, period, 0);
  const s = Math.sin(p * T);
  const sl = Math.sin(ph(clock, period, LAG) * T);
  const add = (i: number, d: number) => { out[i] = (out[i] ?? 0) + d; };
  // Uši dokmitávají za hlavou: rozdíl zpožděné a aktuální fáze (malé, bez pružiny).
  const ears = (deg: number) => { add(17, A.earGain * deg * (sl - s)); add(18, -A.earGain * deg * (sl - s)); };
  if (code === 0 || code === 1) {
    // Klid: přenesení váhy (trup se nakloní a posune), hlava kontruje se zpožděním, ruce a nohy dobíhají.
    add(8, A.idleBodyDeg * s); add(9, A.idleShift * s);
    add(13, -A.idleHeadDeg * sl);
    add(0, A.idleArmDeg * sl); add(2, -A.idleArmDeg * sl);
    add(4, A.idleLegDeg * s); add(6, -A.idleLegDeg * s);
    // Pohled: drží chvíli vlevo, chvíli vpravo (ořezaný sinus jiné fáze).
    add(19, A.look * Math.max(-1, Math.min(1, 2.2 * Math.sin(ph(clock, period, 0.3) * T))));
    ears(A.idleHeadDeg);
    if (code === 1 && waveAmp > 0) {
      const w = Math.sin(ph(clock, WAVE_MS, 0) * T) * waveAmp;
      add(3, A.waveDeg * w); add(2, A.waveUpperDeg * w);
    }
  } else if (code === 2) {
    // Oslava: paže pumpují, předloktí se zpožděním, tělo poskakuje, oči přivřené radostí.
    add(0, A.joyArmDeg * s); add(2, A.joyArmDeg * s);
    add(1, A.joyForearmDeg * sl); add(3, A.joyForearmDeg * sl);
    add(10, -A.joyBounce * Math.abs(s));
    add(13, A.joyHeadDeg * sl);
    out[20] = A.joySquint + (1 - A.joySquint) * 0.5 * (1 + s) * 0.4;
    ears(A.joyHeadDeg * 2);
  } else if (code === 3) {
    // Smutek: pomalé houpání, hlava klesá a zvedá se, paže visí a dobíhají.
    add(8, A.sadBodyDeg * s);
    add(13, -A.sadHeadDeg * sl); add(12, A.sadDroop * 0.5 * (1 + sl));
    add(0, A.sadBodyDeg * 2 * sl); add(2, -A.sadBodyDeg * 2 * sl);
    ears(A.sadHeadDeg);
  } else if (code === 4) {
    // Spánek: dech (ležící tělo se zvedá), hlava se pohupuje.
    add(10, -A.sleepBreath * 0.5 * (1 + s));
    add(13, A.sadHeadDeg * 0.6 * sl);
    ears(A.sadHeadDeg * 0.6);
  } else if (code === 5) {
    // Vis: náklon kolem hrazdy řeší `swayDeg`; nohy dobíhají kyvadlem, hlava kontruje.
    add(4, A.hangLegDeg * sl); add(6, -A.hangLegDeg * sl);
    add(13, -A.idleHeadDeg * sl);
    ears(A.idleHeadDeg);
  } else if (code === 6) {
    // Klik: tělo se sklopí k zemi, paže se pokrčí, hlava se zpožděním.
    const down = (1 - Math.cos(p * T)) / 2;
    add(8, A.pushupBodyDeg * down);
    out[14] = (out[14] ?? 1) * (1 - down * A.pushupReach);
    add(13, -A.idleHeadDeg * sl);
    ears(A.idleHeadDeg);
  } else if (code === 7) {
    // Běh: levá a pravá strana si vymění úhly (w 0 → 1 → 0), poskok dvakrát za periodu.
    const w = (1 + s) / 2;
    for (let i = 0; i < 8; i += 4) {
      const lu = v[i] ?? 0, ll = v[i + 1] ?? 0, ru = v[i + 2] ?? 0, rl = v[i + 3] ?? 0;
      out[i] = lu + (ru - lu) * w; out[i + 1] = ll + (rl - ll) * w;
      out[i + 2] = ru + (lu - ru) * w; out[i + 3] = rl + (ll - rl) * w;
    }
    add(10, -Math.abs(Math.cos(p * T)) * A.runBob);
    add(13, A.idleHeadDeg * Math.sin(ph(clock, period / 2, LAG) * T));
    ears(A.idleHeadDeg * 2);
  } else {
    lifeRef(out, v, code, clock, p, s, sl);
  }
  return out;
}

/** Náklon houpání ve visu (°) kolem hrazdy. */
export function swayDeg(code: number, clock: number, on: number): number {
  'worklet';
  if (on <= 0) return 0;
  if (code === 5) return Math.sin(ph(clock, LIFE_MS[5], 0) * Math.PI * 2) * LIFE_AMP.hangDeg;
  // Stojka: balancování kolem dlaní (pivot `swayPivotY`).
  if (code === C_HANDSTAND) return Math.sin(ph(clock, LIFE_MS[C_HANDSTAND], 0) * Math.PI * 2) * LIFE_AMP.standDeg;
  return 0;
}

/** Svislý pivot houpání: hrazda ve visu, dlaně ve stojce (obě čísla předá volající). */
export function swayPivotY(code: number, barY: number, handsY: number): number {
  'worklet';
  return code === C_HANDSTAND ? handsY : barY;
}

/**
 * Pohyb části rekvizity (`components/mascot/PropMotion.tsx`): `code` pózy, `i`/`n` = index a počet částí,
 * `on` 0/1 (omezený pohyb = statická rekvizita), `entry` = náběh pózy 0 → 1 (dokreslení fajfky a X).
 * Vrací [stupně, scaleX, scaleY, posun x, posun y, krytí]; jen čísla dovnitř i ven (worklet).
 */
export function propPart(code: number, i: number, n: number, clock: number, on: number, entry: number): number[] {
  'worklet';
  const A = LIFE_AMP;
  const T = Math.PI * 2;
  let deg = 0, sx = 1, sy = 1, tx = 0, ty = 0, op = 1;
  // Kreslení po tečkách při vstupu do pózy (s omezeným pohybem je entry = 1, tedy hotová kresba).
  if (code === C_SUCCESS || code === C_FAIL) op = Math.max(0, Math.min(1, entry * n - i));
  // Vykukování: překryvné tečky pokroku; statická póza = 4 ze 6 plné (jako kresba).
  if (code === C_PEEK) op = i < 4 ? 1 : 0;
  if (on <= 0) return [deg, sx, sy, tx, ty, op];
  const p = ph(clock, LIFE_MS[code] ?? 3000, 0);
  ty += chestDy(code, clock, on);
  if (code === C_LOADING || code === C_SYNC || code === C_SETTINGS) {
    // Kruh loaderu obíhá (živá tečka putuje), šipky synchronizace obíhají, kolo nastavení se točí.
    deg = p * 360;
  } else if (code === C_PEEK) {
    // Pokrok se plní po tečkách, než se opice schová, zhasne a začne znovu.
    op = step01((p / 0.7) * n, i, i + 0.5) * (1 - step01(p, 0.85, 0.95));
  } else if (code === C_WAIT) {
    // Přesýpací hodiny se na konci periody otočí (symetrické, 180° = 0°).
    deg = 180 * step01(p, 0.8, 0.95);
  } else if (code === C_PULL) {
    // Lano se s každým tahem posune o jeden rozestup teček k opici (vzor se opakuje, bez skoku).
    tx = -7 * step01(p, 0, 0.5);
  } else if (code === C_WARNING) {
    const k = 1 + A.bangScale * bump(p, 0, 0.5);
    sx = k; sy = k;
  } else if (code === C_OFFLINE) {
    // Oblouky wifi zhasínají od vnějšího k vnitřnímu, pak se znovu rozsvítí (i: 0 = střed, 1–3 = oblouky).
    if (i > 0) op = 1 - 0.8 * step01(p, 0.05 + (3 - i) * 0.15, 0.15 + (3 - i) * 0.15) * (1 - step01(p, 0.75, 0.9));
  } else if (code === C_SEARCH) {
    tx = A.loupeOrbit * Math.cos(p * T); ty += A.loupeOrbit * Math.sin(p * T);
  } else if (code === C_NOTIFY) {
    if (i === 0) deg = A.bellDeg * ringOut(p, 0.5, 3);
    else { const k = 1 + A.liveScale * bump(p, 0, 0.35); sx = k; sy = k; }
  } else if (code === C_INSPECT) {
    const k = 1 + A.zoom * 0.5 * (1 - Math.cos(p * T));
    sx = k; sy = k;
  } else if (code === C_AVATAR) {
    // Tečkový kruh: vlna zvětšení obíhá po směru hodin (část = tečka i z n).
    const k = 1 + A.avatarBump * bump(ph(clock, SUB_MS.avatarOrbit, -i / n), 0.85, 1);
    sx = k; sy = k;
  } else if (code === C_LOCKED) {
    deg = A.lockDeg * ringOut(p, 0.25, 3);
  } else if (code === C_STREAK) {
    if (i === 0) {
      const f = Math.sin(p * T) + 0.5 * Math.sin(ph(clock, SUB_MS.flicker, 0) * T);
      sy = 1 + A.flameScale * f; sx = 1 - A.flameScale * 0.5 * f;
      deg = 3 * Math.sin(ph(clock, LIFE_MS[code] ?? 1200, 0.3) * T);
    } else { const k = 1 + A.liveScale * 0.5 * (1 + Math.sin(p * T)); sx = k; sy = k; }
  } else if (code === C_MEDAL) {
    deg = A.medalDeg * Math.sin(p * T);
  }
  return [deg, sx, sy, tx, ty, op];
}

/** Matice `translate(tx ty)` + rotace a měřítko kolem (cx, cy) (web řetězec, nativ pole). */
export function partMatrix(deg: number, sx: number, sy: number, cx: number, cy: number, tx: number, ty: number, web: boolean): Record<string, unknown> {
  'worklet';
  const r = (deg * Math.PI) / 180;
  const cos = Math.cos(r), sin = Math.sin(r);
  const a = cos * sx, b = sin * sx, c = -sin * sy, d = cos * sy;
  const e = cx - (a * cx + c * cy) + tx;
  const f = cy - (b * cx + d * cy) + ty;
  return web ? { transform: `matrix(${a} ${b} ${c} ${d} ${e} ${f})` } : { matrix: [a, b, c, d, e, f] };
}

/** Bod konce segmentu (stejná konvence jako `logic/mascotPoses.limbEnd`), worklet. */
function end(x: number, y: number, len: number, deg: number, side: number): [number, number] {
  'worklet';
  const r = (deg * Math.PI) / 180;
  return [x + side * Math.sin(r) * len, y + Math.cos(r) * len];
}

const f1 = (n: number) => {
  'worklet';
  return Math.round(n * 10) / 10;
};

/** Lomená čára končetiny (pivot → kloub → konec), shodná s `monkeyGeometry.limbPath`. */
export function limbD(px: number, py: number, upper: number, lower: number, angU: number, angL: number, side: number): string {
  'worklet';
  const j = end(px, py, upper, angU, side);
  const e = end(j[0], j[1], lower, angU + angL, side);
  return `M${f1(px)} ${f1(py)} L${f1(j[0])} ${f1(j[1])} L${f1(e[0])} ${f1(e[1])}`;
}

/**
 * Transformace SVG skupiny: posun (tx, ty) a rotace `deg` kolem (cx, cy) = `translate(tx ty) rotate(deg cx cy)`.
 * Web chce řetězec `transform`, nativ pole `matrix` (stejně jako hlava v `reactionMotion`).
 */
export function groupMatrix(deg: number, cx: number, cy: number, tx: number, ty: number, web: boolean): Record<string, unknown> {
  'worklet';
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a), sin = Math.sin(a);
  const e = cx - cos * cx + sin * cy + tx;
  const f = cy - sin * cx - cos * cy + ty;
  return web ? { transform: `matrix(${cos} ${sin} ${-sin} ${cos} ${e} ${f})` } : { matrix: [cos, sin, -sin, cos, e, f] };
}

/** Zz ze spánku: fáze 0–1 → posun nahoru (pt viewBoxu) a opacita (nádech, rozplynutí nahoře). */
export function zzFrame(phase: number, rise: number): { ty: number; opacity: number } {
  'worklet';
  const p = phase - Math.floor(phase);
  return { ty: -p * rise, opacity: Math.sin(p * Math.PI) };
}

/** cubic-bezier(0.22, 1, 0.36, 1) pro t ∈ [0, 1] (Newton na x(s)), worklet. */
export function bezierOut(x: number): number {
  'worklet';
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const x1 = 0.22, y1 = 1, x2 = 0.36, y2 = 1;
  let s = x;
  for (let i = 0; i < 6; i++) {
    const bx = 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s - x;
    const dx = 3 * (1 - s) * (1 - s) * x1 + 6 * (1 - s) * s * (x2 - x1) + 3 * s * s * (1 - x2);
    if (Math.abs(dx) < 1e-6) break;
    s = Math.max(0, Math.min(1, s - bx / dx));
  }
  return 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s;
}
