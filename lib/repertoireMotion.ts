import type { HapticKind } from '@/lib/haptics';
import { repertoire as RP } from '@/lib/motion';
import { bump, PV, ringOut, step01 } from '@/lib/poseMotion';
import type { MascotPoseId } from '@/logic/mascotPoses';
import type { RepertoireId } from '@/logic/mascotRepertoire';
import type { SilhouetteId } from '@/types';

/**
 * Choreografie repertoáru opičky (motion-agent, plán 2026-10-13-opice-26-animaci). Akce = časová osa `t` 0 → 1
 * (`repertoire.ms`); všechno tady jsou čisté worklety nad čísly: posun kostry (`applyAct`), celé tělo
 * (`actBody`), houpání kolem hrazdy/dlaní (`actSway`), rekvizity (`actProp`), tečky růstu a ručník (`growDot`,
 * `towelDot`). Každá obálka je v t = 0 i t = 1 nulová, takže začátek a konec akce neskočí.
 * Worklety zachytávají jen čísla (kódy akcí jako konstanty, ne objekt; pravidlo `local/no-worklet-object-capture`).
 */

/** Akce přehrávače: 23 akcí repertoáru + pokrčení ramen (stávající reakce `shrug` s pohybem paží v2). */
export type ActId = RepertoireId | 'shrug';
export const ACT_IDS: readonly ActId[] = [
  'warmup', 'boredSit', 'pointStart', 'plateHop', 'handstandPlate', 'morningStretch', 'eveningTowel', 'streakAtRisk',
  'sadThenPoint', 'headShake', 'giggle', 'hangFinger', 'trainAlong', 'strain', 'wipeSweat', 'liftBarbell',
  'flameJump', 'climbPodium', 'grow', 'waveRun', 'wifiShake', 'ropeTangle', 'peekBox', 'shrug',
];
export const ACT_CODE = Object.fromEntries(ACT_IDS.map((id, i) => [id, i])) as Record<ActId, number>;
/** Žádná akce. */
export const NO_ACT = -1;

// Kódy pro worklety (čísla, ne objekt; test hlídá shodu s ACT_CODE).
const WARMUP = 0, BORED = 1, POINT = 2, HOP = 3, HANDSTAND = 4, MORNING = 5, TOWEL = 6, AT_RISK = 7;
const SAD_POINT = 8, HEAD_SHAKE = 9, GIGGLE = 10, HANG = 11, STRAIN = 13, SWEAT = 14, LIFT = 15;
const FLAME = 16, CLIMB = 17, GROW = 18, WAVE_RUN = 19, WIFI = 20, ROPE = 21, PEEK = 22, SHRUG = 23;
export const ACT_CODES_FOR_TEST = { WARMUP, BORED, POINT, HOP, HANDSTAND, MORNING, TOWEL, AT_RISK, SAD_POINT, HEAD_SHAKE, GIGGLE, HANG, STRAIN, SWEAT, LIFT, FLAME, CLIMB, GROW, WAVE_RUN, WIFI, ROPE, PEEK, SHRUG };

/** Pózy z `logic/mascotPoses` (kódy = pořadí `MASCOT_POSE_IDS`), které akce potřebují v rekvizitách. */
const P_OFFLINE = 16, P_STREAK = 24, P_LIFT = 32, P_SWEAT = 33, P_AT_RISK = 35, P_ROPE = 36, P_POINT = 40, P_PEEK = 42;
export const POSE_CODES_FOR_TEST = { P_OFFLINE, P_STREAK, P_LIFT, P_SWEAT, P_AT_RISK, P_ROPE, P_POINT, P_PEEK };

export interface ActSpec {
  ms: number;
  /** Pózy během akce: [od zlomku osy, póza]; `null` = zpět na pózu obrazovky ještě před koncem osy. */
  poses: readonly (readonly [number, MascotPoseId | null])[];
  /** Haptika (jen akce v `REPERTOIRE_HAPTIC`): zlomek osy a druh. Bez zvuku. */
  haptic: { at: number; kind: HapticKind } | null;
}

const ms = RP.ms;
/** Časová osa akcí. Pózy odpovídají `poseForRepertoire` (logic), u vícefázových akcí navazují další. */
export const ACT_SPEC: Record<ActId, ActSpec> = {
  warmup: { ms: ms.warmup, poses: [[0, 'warmup']], haptic: null },
  boredSit: { ms: ms.boredSit, poses: [[0, 'boredSit']], haptic: null },
  pointStart: { ms: ms.pointStart, poses: [[0, 'pointStart']], haptic: null },
  plateHop: { ms: ms.plateHop, poses: [[0, 'run'], [0.9, null]], haptic: null },
  handstandPlate: { ms: ms.handstandPlate, poses: [[0, 'handstand'], [0.86, null]], haptic: null },
  morningStretch: { ms: ms.morningStretch, poses: [[0, 'stretch']], haptic: null },
  eveningTowel: { ms: ms.eveningTowel, poses: [[0, 'eveningTowel']], haptic: null },
  streakAtRisk: { ms: ms.streakAtRisk, poses: [[0, 'streakAtRisk']], haptic: null },
  sadThenPoint: { ms: ms.sadThenPoint, poses: [[0, 'sad'], [0.5, 'pointStart']], haptic: null },
  headShake: { ms: ms.headShake, poses: [], haptic: { at: 0, kind: 'selection' } },
  giggle: { ms: ms.giggle, poses: [[0, 'giggle']], haptic: { at: 0, kind: 'light' } },
  hangFinger: { ms: ms.hangFinger, poses: [[0, 'hang']], haptic: { at: 0, kind: 'soft' } },
  trainAlong: { ms: ms.trainAlong, poses: [], haptic: null },
  strain: { ms: ms.strain, poses: [[0, 'strain']], haptic: null },
  wipeSweat: { ms: ms.wipeSweat, poses: [[0, 'wipeSweat']], haptic: null },
  // Nacvaknutí pravého kotouče (část 1) v 0.6 osy = rázná haptika.
  liftBarbell: { ms: ms.liftBarbell, poses: [[0, 'liftBarbell']], haptic: { at: 0.6, kind: 'rigid' } },
  // Dopad výskoku v 0.46 osy, pak flex.
  flameJump: { ms: ms.flameJump, poses: [[0, 'streak'], [0.56, 'flex']], haptic: { at: 0.46, kind: 'success' } },
  climbPodium: { ms: ms.climbPodium, poses: [[0, 'levelUp']], haptic: { at: 0.5, kind: 'medium' } },
  grow: { ms: ms.grow, poses: [[0, 'levelUp']], haptic: { at: 0.3, kind: 'success' } },
  waveRun: { ms: ms.waveRun, poses: [[0, 'wave'], [RP.waveRun.runFrom, 'run'], [0.96, null]], haptic: null },
  wifiShake: { ms: ms.wifiShake, poses: [[0, 'offline']], haptic: null },
  ropeTangle: { ms: ms.ropeTangle, poses: [[0, 'ropeTangle']], haptic: null },
  peekBox: { ms: ms.peekBox, poses: [[0, 'peekBox']], haptic: null },
  shrug: { ms: ms.shrug, poses: [[0, 'idle']], haptic: null },
};

/** Póza akce v čase `t` (JS): poslední krok s `at ≤ t`; `undefined` = akce pózu nemění. */
export function actPoseAt(id: ActId, t: number): MascotPoseId | null | undefined {
  let out: MascotPoseId | null | undefined;
  for (const [at, pose] of ACT_SPEC[id].poses) if (at <= t) out = pose;
  return out;
}

// ——— geometrie (shodná s components/mascot/monkeyGeometry V2; test hlídá) ———
const HIP_X = 100, HIP_Y = 146, SH_DX = 20, SH_Y = 114, ARM_SEG = 18, LEG_SEG = 16;
export const GEOMETRY_FOR_TEST = { HIP_X, HIP_Y, SH_DX, SH_Y, ARM_SEG, LEG_SEG };

/** Dlaň (svět viewBoxu) z vektoru pózy: rameno → loket → dlaň, natočení těla kolem kyčlí, posun těla. */
export function handAt(v: readonly number[], side: number): number[] {
  'worklet';
  const r = v[PV.reach] ?? 1;
  const u = side < 0 ? v[PV.armLu] ?? 0 : v[PV.armRu] ?? 0;
  const l = side < 0 ? v[PV.armLl] ?? 0 : v[PV.armRl] ?? 0;
  const a1 = (u * Math.PI) / 180, a2 = ((u + l) * Math.PI) / 180;
  const ex = HIP_X + side * SH_DX + side * Math.sin(a1) * ARM_SEG * r + side * Math.sin(a2) * ARM_SEG * r;
  const ey = SH_Y + Math.cos(a1) * ARM_SEG * r + Math.cos(a2) * ARM_SEG * r;
  const b = ((v[PV.body] ?? 0) * Math.PI) / 180;
  const dx = ex - HIP_X, dy = ey - HIP_Y;
  return [HIP_X + dx * Math.cos(b) - dy * Math.sin(b) + (v[PV.dx] ?? 0), HIP_Y + dx * Math.sin(b) + dy * Math.cos(b) + (v[PV.dy] ?? 0)];
}

/** Svislá délka nohy (kyčel → chodidlo) pro úhly (°). */
function legH(u: number, l: number): number {
  'worklet';
  return LEG_SEG * Math.cos((u * Math.PI) / 180) + LEG_SEG * Math.cos(((u + l) * Math.PI) / 180);
}

/** Podřep o sílu `q`: kolena ven (`U`), bérce zpět (`L`), tělo klesne přesně o zkrácení nohou (chodidla stojí). */
function fold(out: number[], q: number, U: number, L: number): void {
  'worklet';
  if (q === 0) return;
  const h0 = (legH(out[4] ?? 0, out[5] ?? 0) + legH(out[6] ?? 0, out[7] ?? 0)) / 2;
  out[4] = (out[4] ?? 0) + U * q; out[5] = (out[5] ?? 0) + L * q;
  out[6] = (out[6] ?? 0) + U * q; out[7] = (out[7] ?? 0) + L * q;
  const h1 = (legH(out[4] ?? 0, out[5] ?? 0) + legH(out[6] ?? 0, out[7] ?? 0)) / 2;
  out[PV.dy] = (out[PV.dy] ?? 0) + (h0 - h1);
}

/** Obálka: náběh v [a, a + fi], doběh v [b − fo, b]. */
function env(t: number, a: number, b: number, fi: number, fo: number): number {
  'worklet';
  return step01(t, a, a + fi) * (1 - step01(t, b - fo, b));
}
/** Lineární průběh 0 → 1 v [a, b]. */
function lin(t: number, a: number, b: number): number {
  'worklet';
  return Math.max(0, Math.min(1, (t - a) / (b - a)));
}

const TAU = Math.PI * 2;
const MS_STRAIN = RP.ms.strain;
const MS_WAVE_RUN = RP.ms.waveRun;
const HOP_A0 = RP.hop.to[0], HOP_A1 = RP.hop.to[1], HOP_B0 = RP.hop.back[0], HOP_B1 = RP.hop.back[1];
const RUN_FROM = RP.waveRun.runFrom, RUN_TO = RP.waveRun.runTo, RUN_FADE = RP.waveRun.fadeTo;
/** Přeskok bez mapy (galerie): vodorovná vzdálenost a výška oblouku ve viewBoxu. Mapa letí sama (`repertoire.hop`). */
const HOP_DX = 56, HOP_ARC = 44;
/** Doběh bez mapy (galerie): start `RUN_DX` vlevo. */
const RUN_DX = -80;
/** Ručník při večerním kroužení: úhel kroužení v čase osy (sdílí `applyAct` a `towelDot`). */
export function towelAngle(t: number): number {
  'worklet';
  return TAU * 3 * lin(t, 0.06, 0.86);
}
const TOWEL_ENV = (t: number) => {
  'worklet';
  return env(t, 0.06, 0.92, 0.14, 0.12);
};

/**
 * Posun kostry akcí (`code` z `ACT_CODE`, `t` osa 0–1). Vrací nový vektor; bez akce (`NO_ACT`) beze změny.
 * Úhly a konvence jako `logic/mascotPoses` (+ = od těla ven / nahoru), indexy `PV`.
 */
export function applyAct(v: readonly number[], code: number, t: number): number[] {
  'worklet';
  const out = v.slice();
  if (code < 0 || t <= 0 || t >= 1) return out;
  const add = (i: number, d: number) => { out[i] = (out[i] ?? 0) + d; };
  const squint = (k: number) => { out[PV.squint] = (out[PV.squint] ?? 1) * (1 - k); };
  if (code === WARMUP) {
    // Kroužení rameny (3 kruhy loktů), pak dva dřepy.
    const e = env(t, 0, 0.56, 0.06, 0.08);
    const th = TAU * 3 * lin(t, 0, 0.55);
    add(0, 22 * Math.sin(th) * e); add(2, 22 * Math.sin(th) * e);
    add(1, 16 * Math.cos(th) * e); add(3, 16 * Math.cos(th) * e);
    add(PV.dy, -0.8 * (1 - Math.cos(th)) * e); add(PV.headTilt, 2 * Math.sin(th) * e);
    add(PV.earL, 4 * Math.sin(th - 0.7) * e); add(PV.earR, -4 * Math.sin(th - 0.7) * e);
    const q = bump(t, 0.58, 0.78) + bump(t, 0.78, 0.98);
    fold(out, q, 46, -92);
    add(PV.headDy, 1.5 * q); squint(0.25 * q);
  } else if (code === BORED) {
    // Sedí a houpe nohama (střídavě bérce), hlava se pohupuje, pak zívne a protáhne se.
    const e = env(t, 0, 0.64, 0.05, 0.06);
    const th = TAU * 5 * t;
    add(5, 22 * Math.sin(th) * e); add(7, -22 * Math.sin(th) * e);
    add(PV.headTilt, 4 * Math.sin(TAU * 1.2 * t) * e);
    add(PV.lookX, 1.2 * Math.sin(TAU * 0.8 * t) * e);
    const y = env(t, 0.66, 0.97, 0.1, 0.09);
    add(PV.headDy, -3 * y); add(PV.headTilt, 8 * y);
    add(0, 110 * y); add(2, 110 * y); add(1, 20 * y); add(3, 20 * y);
    add(PV.dy, -1.5 * y); squint(0.85 * y);
    add(PV.earL, 6 * y); add(PV.earR, -6 * y);
  } else if (code === POINT) {
    // Dvakrát „šťouchne“ prstem ke kartě Start, nakloní se, podívá se tam a kývne na diváka.
    const e = env(t, 0, 1, 0.1, 0.15);
    const j = bump(t, 0.12, 0.36) + bump(t, 0.42, 0.66);
    add(PV.reach, 0.22 * j); add(2, 4 * j);
    add(PV.body, 3 * e); add(PV.dx, 2 * e); add(PV.headTilt, 3 * e);
    add(PV.lookX, 1.3 * e * (1 - bump(t, 0.7, 0.95))); add(PV.eyeDrop, 1.5 * e);
    add(PV.headDy, 2 * bump(t, 0.72, 0.9));
  } else if (code === HOP) {
    // Přeskok tam a zpět: přikrčení, ve vzduchu skrčené nohy a ruce nahoru, dopad.
    const c = bump(t, 0.03, HOP_A0 + 0.02) + bump(t, HOP_B0 - 0.09, HOP_B0 + 0.02);
    const land = bump(t, HOP_A1 - 0.02, HOP_A1 + 0.08) + bump(t, HOP_B1 - 0.02, HOP_B1 + 0.08);
    fold(out, 0.6 * (c + land), 40, -80);
    const k = bump(t, HOP_A0, HOP_A1) + bump(t, HOP_B0, HOP_B1);
    add(4, 30 * k); add(5, -60 * k); add(6, 30 * k); add(7, -60 * k);
    add(0, 60 * k); add(2, 60 * k);
  } else if (code === HANDSTAND) {
    // Balanc ve stojce: houpání kolem dlaní řeší `actSway`, nohy kontrují se zpožděním.
    const e = env(t, 0.12, 0.84, 0.13, 0.14);
    const s = Math.sin(TAU * 2.2 * t - 0.8);
    add(4, 12 * s * e); add(6, -12 * s * e); add(PV.headTilt, -3 * s * e);
  } else if (code === MORNING) {
    // Ranní protažení: vytáhne se nahoru na špičky, úklon vlevo a vpravo, na konci zívne.
    const e = env(t, 0, 1, 0.25, 0.15);
    add(PV.reach, 0.25 * e); add(PV.dy, -2 * e);
    const b = bump(t, 0.3, 0.55) - bump(t, 0.55, 0.8);
    add(PV.body, 9 * b); add(PV.headTilt, 4 * b);
    add(PV.earL, 3 * b); add(PV.earR, 3 * b);
    add(PV.headDy, -2 * bump(t, 0.78, 1));
  } else if (code === TOWEL) {
    // Večer: zvedne pravou ruku a krouží ručníkem nad hlavou (ručník = `towelDot`), na konci ospale kývne.
    const e = TOWEL_ENV(t);
    const th = towelAngle(t);
    add(2, 135 * e); add(3, 25 * Math.sin(th) * e);
    add(PV.headTilt, (-3 + 1.5 * Math.sin(th)) * e); add(PV.body, 1.5 * Math.sin(th) * e);
    add(PV.lookX, 0.8 * e);
    const n = bump(t, 0.88, 1);
    add(PV.headDy, 3 * n); squint(0.5 * n);
  } else if (code === AT_RISK) {
    // Nervózně přechází sem a tam (kroky), pak zvedne hodinky, dvakrát na ně ťukne a kouká.
    const w = env(t, 0, 0.62, 0.06, 0.08);
    const walk = Math.sin((TAU * t) / 0.6);
    add(PV.dx, 16 * walk * w);
    const st = Math.sin(TAU * 6 * t);
    add(4, 18 * st * w); add(6, -18 * st * w); add(PV.dy, -1.2 * Math.abs(st) * w);
    add(PV.headTilt, 3 * Math.cos((TAU * t) / 0.6) * w);
    const c = env(t, 0.62, 1, 0.08, 0.08);
    add(0, 18 * c); add(PV.headDy, 3 * c); add(PV.headTilt, -4 * c);
    add(PV.lookX, -0.8 * c); add(PV.eyeDrop, 1.5 * c);
    add(2, 30 * (bump(t, 0.72, 0.78) + bump(t, 0.8, 0.86)));
  } else if (code === SAD_POINT) {
    // Posedí (dřep, hlava dolů, povzdech), zvedne se a ukáže na Start; bez výčitky: na konci kývne.
    const s = env(t, 0, 0.5, 0.1, 0.1);
    fold(out, s, 70, -130);
    add(PV.headDy, 2 * s); add(PV.dy, 0.8 * Math.sin(TAU * 2 * t) * s);
    add(0, -6 * s); add(2, -6 * s);
    const e = env(t, 0.52, 1, 0.08, 0.1);
    const j = bump(t, 0.6, 0.72) + bump(t, 0.74, 0.86);
    add(PV.reach, 0.2 * j); add(PV.lookX, 1.2 * e * (1 - bump(t, 0.86, 1)));
    add(PV.headDy, 1.5 * bump(t, 0.86, 0.96));
  } else if (code === HEAD_SHAKE) {
    // Zatřese hlavou (3 kmity, slábnou), uši se zpožděním dokmitají i po zastavení hlavy.
    const k = t < 0.7 ? (1 - t / 0.7) ** 1.5 * step01(t, 0, 0.05) : 0;
    const s = Math.sin((TAU * 3 * t) / 0.7) * k;
    add(PV.headTilt, 13 * s); add(PV.headDx, 2 * s); add(PV.lookX, -0.8 * s); squint(0.35 * Math.abs(s));
    const k2 = (1 - t) * (1 - t) * step01(t, 0.03, 0.1);
    const lag = Math.sin((TAU * 3 * (t - 0.07)) / 0.7) * k2;
    add(PV.earL, -10 * lag); add(PV.earR, -10 * lag);
  } else if (code === GIGGLE) {
    // Chichot: skrčí se, tělo se třese, ramena poskakují, hlava se pohupuje.
    const e = env(t, 0, 1, 0.08, 0.18);
    fold(out, 0.35 * e, 30, -60);
    add(PV.body, 2.5 * Math.sin(TAU * 16 * t) * e);
    const sh = Math.abs(Math.sin(TAU * 8 * t)) * e;
    add(0, 7 * sh); add(2, 7 * sh);
    add(PV.headDy, -1.5 * Math.abs(Math.sin(TAU * 8 * t + 0.5)) * e); add(PV.headTilt, 3 * Math.sin(TAU * 4 * t) * e);
    add(PV.earL, 4 * Math.sin(TAU * 8 * t) * e); add(PV.earR, -4 * Math.sin(TAU * 8 * t) * e);
  } else if (code === HANG) {
    // Visí na prstu: kyvadlo kolem hrazdy (`actSway`), nohy dobíhají, hlava kontruje.
    const e = env(t, 0, 1, 0.15, 0.25);
    const s = Math.sin(TAU * 1.4 * t - 1);
    add(4, 14 * s * e); add(6, 14 * s * e); add(PV.headTilt, -5 * s * e); squint(0.15 * e);
  } else if (code === STRAIN) {
    // Posledních 3 s výdrže: třes sílí (dvě rychlé frekvence), oči přivřené, hlava zapřená.
    const k = env(t, 0, 1, 0.08, 0.1) * (0.5 + 0.5 * t);
    const sec = (t * MS_STRAIN) / 1000;
    const tr = Math.sin(TAU * 13 * sec) + 0.6 * Math.sin(TAU * 19 * sec);
    add(PV.dx, 0.7 * tr * k); add(PV.dy, 0.4 * Math.sin(TAU * 17 * sec) * k); add(PV.body, 0.6 * tr * k);
    add(0, 1.5 * tr * k); add(2, -1.5 * tr * k);
    add(PV.headDy, 1 * k); squint(0.4 * k);
    add(PV.earL, 2 * tr * k); add(PV.earR, -2 * tr * k);
  } else if (code === SWEAT) {
    // Utře pot (dlaň u spánku kmitá), pak zvedne lahev k puse a napije se (hlava v záklonu, oči zavřené).
    const w = env(t, 0.04, 0.48, 0.06, 0.08);
    const th = TAU * 3 * lin(t, 0.04, 0.48);
    add(2, 10 * Math.sin(th) * w); add(3, 14 * Math.sin(th) * w); add(PV.headTilt, -4 * w);
    const d = env(t, 0.5, 0.96, 0.12, 0.1);
    add(0, 124 * d); add(1, 147 * d);
    add(2, -100 * d); add(3, -50 * d);
    add(PV.headDy, -2 * d); add(PV.headTilt, 4 * d); squint(0.7 * d);
  } else if (code === LIFT) {
    // Činka: chytí ji u ramen, podřep a výraz nad hlavu, zamknuté lokty; v 0.6 nacvakne pravý kotouč (`actProp`).
    const low = step01(t, 0, 0.08) * (1 - step01(t, 0.18, 0.42));
    add(0, -70 * low); add(2, -70 * low); add(1, 75 * low); add(3, 75 * low); add(PV.reach, -1.2 * low);
    fold(out, bump(t, 0.06, 0.24), 40, -80);
    const click = t >= 0.6 ? ringOut(lin(t, 0.6, 0.85), 1, 2) : 0;
    add(PV.dy, 1.5 * Math.abs(click));
    squint(0.25 * env(t, 0.66, 1, 0.08, 0.1));
  } else if (code === FLAME) {
    // Rekord série: přikrčení, výskok s rukama nahoru (plamen roste, `actProp`), dopad, pak dvakrát flex bicepsu.
    fold(out, bump(t, 0.02, 0.15) + 0.7 * bump(t, 0.42, 0.54), 40, -80);
    const air = bump(t, 0.12, 0.46);
    add(0, 90 * air); add(2, 70 * air); add(4, 10 * air); add(6, 10 * air);
    const f = bump(t, 0.62, 0.76) + bump(t, 0.8, 0.94);
    add(3, 22 * f); add(PV.body, -2 * f); squint(0.3 * f);
  } else if (code === CLIMB) {
    // Šplh o stupeň výš (schody pózy levelUp stojí), nahoře ruce vítězně nahoru; doběh se prolne s další pózou.
    const s = step01(t, 0.12, 0.5) * (1 - step01(t, 0.9, 1));
    add(PV.dx, 28 * s); add(PV.dy, -18 * s - 3 * bump(t, 0.12, 0.5));
    const v = bump(t, 0.56, 0.9);
    add(0, 110 * v); add(2, 110 * v); add(1, 30 * v); add(3, 30 * v); squint(0.25 * v);
  } else if (code === GROW) {
    // Růst: tečky kolem rostou (`growDot`), opice se nadechne a povyroste (`actBody`), ruce od těla.
    const e = env(t, 0.1, 1, 0.25, 0.2);
    add(0, 30 * e); add(2, 30 * e); add(PV.lookX, 0); squint(0.2 * e);
  } else if (code === WAVE_RUN) {
    // Zamává oběma rukama, pak doběhne k uzlu (běh dělá póza run, posun `actBody` / mapa).
    const w = env(t, 0, RUN_FROM - 0.02, 0.08, 0.08);
    const osc = Math.sin((TAU * t * MS_WAVE_RUN) / 600);
    add(0, 98 * w); add(1, 52 * w - 24 * osc * w); add(3, 24 * osc * w);
    squint(0.2 * w);
  } else if (code === WIFI) {
    // Offline: zatřese cedulkou a hlavou (wifi se marně zkouší rozsvítit, `actProp`), pak rezignovaně nakloní hlavu.
    const sh = bump(t, 0.05, 0.55);
    const s = Math.sin(TAU * 8 * t);
    add(PV.dx, 1.5 * s * sh); add(0, 5 * s * sh); add(2, 5 * s * sh);
    add(PV.headTilt, 6 * Math.sin(TAU * 3 * t) * sh - 6 * bump(t, 0.6, 1));
    add(PV.lookX, 1 * bump(t, 0.05, 0.6));
  } else if (code === ROPE) {
    // Chyba: zmítá se v laně (trup, paže, nohy), lano se cuká s ním.
    const e = env(t, 0, 1, 0.08, 0.15);
    const s = Math.sin(TAU * 4 * t);
    add(PV.body, 6 * s * e); add(0, 12 * Math.abs(s) * e); add(2, 12 * Math.abs(Math.sin(TAU * 4 * t + 1.5)) * e);
    add(4, 8 * s * e); add(6, -8 * s * e); add(PV.headTilt, -5 * s * e); squint(0.3 * e);
  } else if (code === PEEK) {
    // Prázdno: nakoukne do krabice, rozhlédne se uvnitř, vynoří se a pokrčí rameny.
    const l = env(t, 0.05, 0.85, 0.2, 0.15);
    add(PV.headDy, 6 * l); add(PV.dy, 2 * l); add(PV.eyeDrop, 2 * l);
    add(PV.lookX, 1.3 * Math.sin(TAU * 1.5 * (t - 0.2)) * l); add(PV.headTilt, 6 * Math.sin(TAU * 0.75 * (t - 0.2)) * l);
    const sh = bump(t, 0.8, 0.99);
    add(0, 40 * sh); add(2, 40 * sh); add(1, -40 * sh); add(3, -40 * sh); add(PV.headTilt, 6 * sh);
  } else if (code === SHRUG) {
    // Pokrčení ramen (přeskočený cvik): paže nahoru a dlaně ven, hlava nakloněná.
    const sh = env(t, 0, 1, 0.2, 0.3);
    add(0, 55 * sh); add(2, 55 * sh); add(1, 50 * sh); add(3, 50 * sh);
    add(PV.headTilt, 6 * sh); add(PV.dy, -1.5 * sh); add(PV.lookX, -0.8 * sh);
  }
  return out;
}

/**
 * Celé tělo (viewBox 200): [posun x, posun y, náklon °, měřítko (kolem chodidel), krytí].
 * `travel` 0 = cestu po mapě kreslí mapa sama (přeskok, doběh); 1 = galerie, opice cestuje v plátně.
 */
export function actBody(code: number, t: number, travel: number): number[] {
  'worklet';
  let tx = 0, ty = 0, deg = 0, sc = 1, op = 1;
  if (code < 0 || t <= 0 || t >= 1) return [tx, ty, deg, sc, op];
  if (code === HOP && travel > 0) {
    const a = lin(t, HOP_A0, HOP_A1), b = lin(t, HOP_B0, HOP_B1);
    tx = HOP_DX * (a - b);
    ty = -HOP_ARC * (4 * a * (1 - a) + 4 * b * (1 - b));
  } else if (code === FLAME) {
    const a = lin(t, 0.14, 0.42);
    ty = -30 * 4 * a * (1 - a);
  } else if (code === GROW) {
    sc = 1 + 0.12 * step01(t, 0.15, 0.4) - 0.06 * step01(t, 0.4, 0.6) - 0.06 * step01(t, 0.82, 1);
  } else if (code === WAVE_RUN && travel > 0) {
    tx = RUN_DX * (1 - lin(t, RUN_FROM, RUN_TO));
    op = step01(t, 0, RUN_FADE);
  } else if (code === WAVE_RUN) {
    op = step01(t, 0, RUN_FADE);
  } else if (code === GIGGLE) {
    deg = 2 * Math.sin(TAU * 4 * t) * env(t, 0, 1, 0.08, 0.18);
  }
  return [tx, ty, deg, sc, op];
}

/** Houpání (°) kolem hrazdy (vis na prstu) nebo dlaní (stojka), přičte se k živé smyčce pózy. */
export function actSway(code: number, t: number): number {
  'worklet';
  if (t <= 0 || t >= 1) return 0;
  if (code === HANG) return 16 * Math.sin(TAU * 1.4 * t) * env(t, 0, 1, 0.15, 0.25);
  if (code === HANDSTAND) return 7 * Math.sin(TAU * 2.2 * t) * env(t, 0.12, 0.84, 0.13, 0.14);
  return 0;
}

/**
 * Rekvizita během akce: [°, sx, sy, tx, ty, krytí] — skládá se s `propPart` (úhly a posuny se sčítají,
 * měřítka a krytí násobí). `pose` = kód cílové pózy (rekvizita patří pouze jí), `i`/`n` část a počet částí.
 */
export function actProp(code: number, t: number, pose: number, i: number, n: number): number[] {
  'worklet';
  let deg = 0, sx = 1, sy = 1, tx = 0, ty = 0, op = 1;
  if (code < 0) return [deg, sx, sy, tx, ty, op];
  const tt = Math.max(0, Math.min(1, t));
  if (code === LIFT && pose === P_LIFT && i === 1) {
    // Pravý vnější kotouč přijede zvenku a nacvakne (krátké zvětšení s dokmitem).
    const s = step01(tt, 0.5, 0.6);
    op = s; tx = 14 * (1 - s);
    const k = 1 + 0.18 * bump(tt, 0.6, 0.7) - 0.05 * bump(tt, 0.7, 0.8);
    sx = k; sy = k;
  } else if (code === FLAME && pose === P_STREAK) {
    // Plamen (a jeho živá tečka) roste s výskokem, při dopadu se rozhoří.
    const k = 0.2 + 0.8 * step01(tt, 0.1, 0.35) + 0.25 * bump(tt, 0.35, 0.52);
    sx = k; sy = k; op = step01(tt, 0.04, 0.14);
  } else if (code === AT_RISK && pose === P_AT_RISK) {
    // Ručička (část 1) tiká po 30°, hodinky se při ťuknutí zachvějí.
    if (i === 1) deg = 30 * Math.floor(tt * 24);
    else deg = 6 * (ringOut(lin(tt, 0.72, 0.8), 1, 2) + ringOut(lin(tt, 0.8, 0.88), 1, 2));
  } else if (code === SWEAT && pose === P_SWEAT) {
    if (i === 0) deg = 110 * env(tt, 0.5, 0.96, 0.12, 0.1);
    else {
      // Kapky stékají, po utření zmizí a na konci se objeví znovu.
      const f = (tt * 3) % 1;
      ty = 6 * f;
      op = (1 - 0.6 * f) * (1 - step01(tt, 0.3, 0.42) * (1 - step01(tt, 0.9, 1)));
    }
  } else if (code === WIFI && pose === P_OFFLINE && i > 0) {
    // Oblouky se zkoušejí rozsvítit zevnitř ven (dvakrát), pak zhasnou.
    const k = Math.max(bump(tt, 0.08 + i * 0.06, 0.3 + i * 0.06), bump(tt, 0.36 + i * 0.06, 0.58 + i * 0.06));
    op = 0.25 + 0.75 * k;
  } else if (code === ROPE && pose === P_ROPE) {
    const e = env(tt, 0, 1, 0.08, 0.15);
    deg = 3 * Math.sin(TAU * 4 * tt) * e;
    const k = 1 + 0.04 * Math.abs(Math.sin(TAU * 4 * tt)) * e;
    sx = k;
  } else if (code === PEEK && pose === P_PEEK) {
    const k = 1 + 0.05 * bump(tt, 0.2, 0.32) + 0.04 * bump(tt, 0.8, 0.92);
    sx = k; sy = 2 - k;
  } else if ((code === POINT && pose === P_POINT) || (code === SAD_POINT && pose === P_POINT)) {
    // Tečky směru blikají po sobě s každým šťouchnutím.
    const j = bump(tt, 0.12, 0.36) + bump(tt, 0.42, 0.66) + bump(tt, 0.6, 0.72) + bump(tt, 0.74, 0.86);
    const k = 1 + 0.3 * Math.min(1, j);
    sx = k; sy = k;
  }
  return [deg, sx, sy, tx, ty, op];
}

/**
 * Rekvizita, která drží v ruce, jde s dlaní: posun (viewBox) mezi dlaní živé kostry a dlaní statické pózy.
 * Činka = průměr obou dlaní; lahev, hodinky = levá; tečky ukazování = pravá. Jinak [0, 0].
 */
export function handFollow(pose: number, live: readonly number[], target: readonly number[]): number[] {
  'worklet';
  if (pose === P_LIFT) {
    const a = handAt(live, -1), b = handAt(live, 1), c = handAt(target, -1), d = handAt(target, 1);
    return [((a[0] ?? 0) + (b[0] ?? 0) - (c[0] ?? 0) - (d[0] ?? 0)) / 2, ((a[1] ?? 0) + (b[1] ?? 0) - (c[1] ?? 0) - (d[1] ?? 0)) / 2];
  }
  const side = pose === P_SWEAT || pose === P_AT_RISK ? -1 : pose === P_POINT ? 1 : 0;
  if (side === 0) return [0, 0];
  const a = handAt(live, side), c = handAt(target, side);
  return [(a[0] ?? 0) - (c[0] ?? 0), (a[1] ?? 0) - (c[1] ?? 0)];
}

/** Části, které jdou s dlaní: u lahve jen lahev (kapky potu jsou u hlavy). */
export function followsHand(pose: number, i: number): boolean {
  'worklet';
  if (pose === P_SWEAT) return i === 0;
  return pose === P_LIFT || pose === P_AT_RISK || pose === P_POINT;
}

/** Tečky růstu: počet a poloměr kruhu (viewBox, kolem středu postavy). */
export const GROW_DOTS = 16;
export const GROW_R = { from: 66, to: 90, dot: 3.2, cy: 112 } as const;
const GR_FROM = GROW_R.from, GR_TO = GROW_R.to, GR_DOT = GROW_R.dot;

/** Tečka `i` z `n` kruhu růstu: [poloměr tečky, vzdálenost od středu, krytí]. Rozsvěcují se po obvodu. */
export function growDot(t: number, i: number, n: number): number[] {
  'worklet';
  if (t <= 0 || t >= 1) return [0, GR_FROM, 0];
  const a = 0.08 + (i / n) * 0.22;
  const on = step01(t, a, a + 0.12) * (1 - step01(t, 0.8, 0.98));
  return [GR_DOT * on * (1 + 0.3 * bump(t, a + 0.1, a + 0.25)), GR_FROM + (GR_TO - GR_FROM) * step01(t, 0.1, 0.6), on];
}

/** Ručník při večerním kroužení: tečka `i` z `n` oblouku kolem dlaně (hx, hy): [x, y, krytí]. */
export function towelDot(t: number, i: number, n: number, hx: number, hy: number): number[] {
  'worklet';
  const e = t <= 0 || t >= 1 ? 0 : TOWEL_ENV(t);
  const a = towelAngle(t) - (i / n) * 1.6;
  const r = 10 + i * 2.6;
  return [hx + Math.cos(a) * r, hy - 6 + Math.sin(a) * r * 0.6, e * (1 - (i / n) * 0.5)];
}

// ——— Cvičení s tebou (mini opička v lekci) ———
/** Druh pohybu mini opičky podle siluety cviku (sdílí fázi `useSilhouettePhase`). */
export const TRAIN_SQUAT = 0, TRAIN_PUSHUP = 1, TRAIN_PULLUP = 2, TRAIN_HOLD = 3, TRAIN_DIP = 4, TRAIN_JUMP = 5, TRAIN_HANG = 6;
export const TRAIN_FOR: Record<SilhouetteId, { pose: MascotPoseId; mode: number }> = {
  squat: { pose: 'idle', mode: TRAIN_SQUAT }, lunge: { pose: 'idle', mode: TRAIN_SQUAT }, jump: { pose: 'idle', mode: TRAIN_JUMP },
  pushup: { pose: 'pushup', mode: TRAIN_PUSHUP }, pullup: { pose: 'hang', mode: TRAIN_PULLUP }, hang: { pose: 'hang', mode: TRAIN_HANG },
  dip: { pose: 'idle', mode: TRAIN_DIP }, handstandWall: { pose: 'handstand', mode: TRAIN_HOLD },
  plank: { pose: 'plank', mode: TRAIN_HOLD }, sidePlank: { pose: 'plank', mode: TRAIN_HOLD }, hollow: { pose: 'plank', mode: TRAIN_HOLD },
  superman: { pose: 'plank', mode: TRAIN_HOLD }, lsit: { pose: 'plank', mode: TRAIN_HOLD }, bridge: { pose: 'plank', mode: TRAIN_HOLD },
  crow: { pose: 'plank', mode: TRAIN_HOLD },
};

/**
 * Kostra mini opičky ve fázi cviku `q` (0–1, stejná jako silueta): dřep, klik, shyb, výdrž (dech + třes), dip,
 * výskok, vis. `mode` < 0 = necvičí.
 */
export function applyTrain(v: readonly number[], mode: number, q: number): number[] {
  'worklet';
  const out = v.slice();
  if (mode < 0) return out;
  const add = (i: number, d: number) => { out[i] = (out[i] ?? 0) + d; };
  const p = Math.max(0, Math.min(1, q));
  if (mode === TRAIN_SQUAT || mode === TRAIN_JUMP) {
    fold(out, p, 50, -100);
    add(0, 70 * p); add(2, 70 * p); add(PV.headDy, 1 * p);
  } else if (mode === TRAIN_PUSHUP) {
    add(PV.reach, -0.3 * p); add(PV.body, 6 * p); add(PV.dy, 4 * p);
  } else if (mode === TRAIN_PULLUP) {
    add(PV.dy, -14 * p); add(PV.reach, -0.8 * p); add(4, 8 * p); add(6, 8 * p);
  } else if (mode === TRAIN_DIP) {
    add(PV.dy, 8 * p); add(0, -10 * p); add(2, -10 * p); add(1, -60 * p); add(3, -60 * p);
    add(4, 30 * p); add(5, -60 * p); add(6, 30 * p); add(7, -60 * p);
  } else if (mode === TRAIN_HOLD) {
    add(PV.dy, -0.6 * Math.sin(p * TAU)); add(PV.headTilt, 0.8 * Math.sin(p * TAU));
  } else if (mode === TRAIN_HANG) {
    add(4, 6 * Math.sin(p * TAU)); add(6, 6 * Math.sin(p * TAU));
  }
  return out;
}

/** Výskok mini opičky (viewBox): v horní polovině fáze odraz. */
export function trainLift(mode: number, q: number): number {
  'worklet';
  if (mode !== TRAIN_JUMP) return 0;
  return -16 * bump(1 - Math.max(0, Math.min(1, q)), 0.4, 1);
}
