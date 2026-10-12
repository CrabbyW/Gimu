import type { Mood } from '@/types';
import type { IdleActionId } from './mascotIdle';
import type { ReactionId } from './mascotReactions';

/**
 * Statické pózy opice v2 (plán „vast-snuggling-sunbeam“, krok 1). Čistá čísla, žádné kreslení:
 * kresba (`components/mascot/SvgMascot.tsx` + `monkeyGeometry.ts`) z nich skládá vrstvy, motion-agent je bude interpolovat.
 *
 * Úhly ve stupních v souřadnicích těla. 0 = končetina míří dolů, 90 = vodorovně od těla ven,
 * 180 = nahoru; záporné = přes tělo dovnitř. Strany jsou zrcadlené (stejné číslo = symetrická póza).
 * `upper` = rameno/kyčel, `lower` = ohyb v lokti/koleni relativně k horní části (+ = dál ven).
 */
export type MascotPoseId = 'idle' | 'wave' | 'celebrate' | 'sad' | 'sleep' | 'hang' | 'pushup' | 'run';

export interface LimbPose { upper: number; lower: number }
export type EyeState = 'open' | 'half' | 'closed';
/** Tečkové doplňky: Zz (spánek), záblesk (oslava), hrazda (vis). */
export type PoseExtra = 'zz' | 'burst' | 'bar';

export interface MascotPose {
  armL: LimbPose; armR: LimbPose; legL: LimbPose; legR: LimbPose;
  /** Natočení celého těla kolem kyčlí (° po směru hodin, 90 = hlava vpravo, vodorovně). */
  body: number;
  /** Posun celé postavy ve viewBoxu 200 (pt viewBoxu). */
  dx: number; dy: number;
  /** Hlava proti trupu: posun (dy + = dolů) a náklon (°). */
  head: { dx: number; dy: number; tilt: number };
  /** Dosah paží (násobek délky segmentů): vis a oslava potřebují ruce nad hlavu, klik kratší opěru. */
  reach: number;
  eyes: EyeState;
  /** Červená tečka nad hlavou = radost (jediný barevný akcent opice). */
  joyDot: boolean;
  extra: PoseExtra | null;
}

const rest: LimbPose = { upper: 14, lower: 0 };
const leg: LimbPose = { upper: 4, lower: 0 };
const still = { dx: 0, dy: 0, tilt: 0 };

export const MASCOT_POSES: Record<MascotPoseId, MascotPose> = {
  idle: { armL: rest, armR: rest, legL: leg, legR: leg, body: 0, dx: 0, dy: 0, head: still, reach: 1, eyes: 'open', joyDot: false, extra: null },
  // Pravá paže nahoru, předloktí kolmo vzhůru, mírný náklon hlavy k mávající ruce.
  wave: {
    armL: rest, armR: { upper: 112, lower: 52 }, legL: leg, legR: leg,
    body: 0, dx: 0, dy: 0, head: { dx: 0, dy: 0, tilt: 6 }, reach: 1.3, eyes: 'open', joyDot: false, extra: null,
  },
  // Ruce do V nad hlavou, červená tečka a tečkový záblesk.
  celebrate: {
    armL: { upper: 95, lower: 80 }, armR: { upper: 95, lower: 80 }, legL: { upper: 10, lower: 0 }, legR: { upper: 10, lower: 0 },
    body: 0, dx: 0, dy: 0, head: still, reach: 1.7, eyes: 'open', joyDot: true, extra: 'burst',
  },
  // Hlava dolů, ramena svěšená k tělu, oči přivřené.
  sad: {
    armL: { upper: 4, lower: -6 }, armR: { upper: 4, lower: -6 }, legL: leg, legR: leg,
    body: 0, dx: 0, dy: 2, head: { dx: 0, dy: 8, tilt: -4 }, reach: 1, eyes: 'half', joyDot: false, extra: null,
  },
  // Leží na boku hlavou vlevo, končetiny přitažené, oči zavřené a Zz z teček.
  sleep: {
    armL: { upper: 0, lower: 0 }, armR: { upper: 0, lower: 0 }, legL: { upper: 0, lower: 0 }, legR: { upper: 0, lower: 0 },
    body: -90, dx: 42, dy: 0, head: { dx: 0, dy: 6, tilt: 90 }, reach: 0.8, eyes: 'closed', joyDot: false, extra: 'zz',
  },
  // Vis na hrazdě: ruce nahoru, nohy volně, postava výš (hrazda nad rukama).
  hang: {
    armL: { upper: 168, lower: 0 }, armR: { upper: 168, lower: 0 }, legL: { upper: 2, lower: 0 }, legR: { upper: 2, lower: 0 },
    body: 0, dx: 0, dy: 12, head: { dx: 0, dy: 6, tilt: 0 }, reach: 2.4, eyes: 'open', joyDot: false, extra: 'bar',
  },
  // Klik: tělo skoro vodorovně (hlava vpravo), paže kolmo k zemi, nohy v ose těla.
  pushup: {
    armL: { upper: -63, lower: 0 }, armR: { upper: 63, lower: 0 }, legL: { upper: 0, lower: 0 }, legR: { upper: 0, lower: 0 },
    body: 63, dx: -20, dy: 18, head: { dx: 0, dy: 0, tilt: -63 }, reach: 0.8, eyes: 'open', joyDot: false, extra: null,
  },
  // Běh: předklon, střídavé paže, jedno koleno nahoře.
  run: {
    armL: { upper: 30, lower: -40 }, armR: { upper: 70, lower: 75 }, legL: { upper: 50, lower: -70 }, legR: { upper: -4, lower: 0 },
    body: 10, dx: 0, dy: -2, head: { dx: 0, dy: 0, tilt: -6 }, reach: 1.1, eyes: 'open', joyDot: false, extra: null,
  },
};

export const MASCOT_POSE_IDS = Object.keys(MASCOT_POSES) as MascotPoseId[];

const MOOD_TO_POSE: Record<Mood, MascotPoseId> = { idle: 'idle', happy: 'wave', celebrate: 'celebrate', sad: 'sad' };

/** Reakce, které mají vlastní pózu; ostatní (poskok, salto, pohled…) jsou čistý pohyb nad pózou nálady. */
const REACTION_TO_POSE: Partial<Record<ReactionId, MascotPoseId>> = {
  wave: 'wave', celebrate: 'celebrate', joyJump: 'celebrate', proud: 'celebrate', sad: 'sad', shrug: 'sad', sleep: 'sleep',
};

/** Idle akce s pózou: protažení = ruce nahoru (vis bez hrazdy se čte jako protažení). */
const IDLE_TO_POSE: Partial<Record<IdleActionId, MascotPoseId>> = { stretch: 'hang', joyHop: 'celebrate' };

export const poseForMood = (mood: Mood): MascotPoseId => MOOD_TO_POSE[mood];
export const poseForReaction = (id: ReactionId): MascotPoseId | null => REACTION_TO_POSE[id] ?? null;
export const poseForIdle = (id: IdleActionId): MascotPoseId | null => IDLE_TO_POSE[id] ?? null;

/** Výsledná póza: explicitní > aktivní reakce > idle akce > nálada. */
export function resolvePose(o: { pose?: MascotPoseId | null; mood: Mood; reaction?: ReactionId | null; idle?: IdleActionId | null }): MascotPoseId {
  if (o.pose) return o.pose;
  const r = o.reaction ? poseForReaction(o.reaction) : null;
  if (r) return r;
  const i = o.idle ? poseForIdle(o.idle) : null;
  return i ?? poseForMood(o.mood);
}

/** Bod konce segmentu: začátek (x, y), délka, úhel (°) dle konvence výše; `side` −1 = levá, +1 = pravá. */
export function limbEnd(x: number, y: number, len: number, deg: number, side: -1 | 1): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: x + side * Math.sin(rad) * len, y: y + Math.cos(rad) * len };
}

/** Lineární prolnutí dvou póz (pro motion-agenta): úhly i posuny, diskrétní pole z cílové pózy od t ≥ 0.5. */
export function mixPose(a: MascotPose, b: MascotPose, t: number): MascotPose {
  const k = Math.max(0, Math.min(1, t));
  const n = (p: number, q: number) => p + (q - p) * k;
  const l = (p: LimbPose, q: LimbPose): LimbPose => ({ upper: n(p.upper, q.upper), lower: n(p.lower, q.lower) });
  const late = k >= 0.5 ? b : a;
  return {
    armL: l(a.armL, b.armL), armR: l(a.armR, b.armR), legL: l(a.legL, b.legL), legR: l(a.legR, b.legR),
    body: n(a.body, b.body), dx: n(a.dx, b.dx), dy: n(a.dy, b.dy), reach: n(a.reach, b.reach),
    head: { dx: n(a.head.dx, b.head.dx), dy: n(a.head.dy, b.head.dy), tilt: n(a.head.tilt, b.head.tilt) },
    eyes: late.eyes, joyDot: late.joyDot, extra: late.extra,
  };
}
