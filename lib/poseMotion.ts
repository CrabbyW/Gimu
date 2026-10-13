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
} as const;
export const POSE_LEN = 21;

/** Oči podle pózy jako čísla (výška elipsy a pokles), shodné s `monkeyGeometry.EYE_RY/EYE_DROP`. */
export interface EyeNumbers { ry: Record<EyeState, number>; drop: Record<EyeState, number> }

export function poseVector(p: MascotPose, eyes: EyeNumbers): number[] {
  return [
    p.armL.upper, p.armL.lower, p.armR.upper, p.armR.lower, p.legL.upper, p.legL.lower, p.legR.upper, p.legR.lower,
    p.body, p.dx, p.dy, p.head.dx, p.head.dy, p.head.tilt, p.reach, eyes.ry[p.eyes], eyes.drop[p.eyes],
    0, 0, 0, 1,
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
/** Kódy 0–7 mají živou smyčku; 8+ (22 statických póz z reference, design-agent) zatím stojí, smyčku doplní motion-agent. */
export const POSE_CODE = Object.fromEntries(MASCOT_POSE_IDS.map((id, i) => [id, i])) as Record<MascotPoseId, number>;
/** Počet póz se živou smyčkou v `applyLife` (kódy 0 … LIVE_POSES − 1). */
export const LIVE_POSES = 8;
/** Perioda smyčky pózy v ms (dělí `LIFE_CLOCK_MS`); mávnutí předloktím má vlastní `WAVE_MS`. */
export const LIFE_MS = [5000, 5000, 1000, 6000, 4000, 2000, 1500, 600] as const;
export const WAVE_MS = 600;
/** Amplitudy (° / pt viewBoxu / násobky): mávnutí, vis, klik, běh, idle váha, oslava, uši. */
export const LIFE_AMP = {
  waveDeg: 26, waveUpperDeg: 6, hangDeg: 4, hangLegDeg: 7, pushupBodyDeg: 8, pushupReach: 0.26, runBob: 2.5,
  idleBodyDeg: 1.6, idleShift: 0.8, idleHeadDeg: 2.2, idleArmDeg: 2.5, idleLegDeg: 1.5, look: 1.4,
  joyArmDeg: 6, joyForearmDeg: 8, joyBounce: 2.5, joyHeadDeg: 2.5, joySquint: 0.78,
  sadBodyDeg: 0.8, sadHeadDeg: 1.5, sadDroop: 1, sleepBreath: 0.8, earGain: 1.6,
} as const;
const LAG = 0.12;

/** Fáze 0–1 pózy s periodou `ms` v čase hodiny (s posunem `shift` periody). */
function ph(clock: number, ms: number, shift: number): number {
  'worklet';
  const x = (clock * LIFE_CLOCK_MS) / ms - shift;
  return x - Math.floor(x);
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
  }
  return out;
}

/** Náklon houpání ve visu (°) kolem hrazdy. */
export function swayDeg(code: number, clock: number, on: number): number {
  'worklet';
  return code === 5 && on > 0 ? Math.sin(ph(clock, LIFE_MS[5], 0) * Math.PI * 2) * LIFE_AMP.hangDeg : 0;
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
