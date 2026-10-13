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
export type MascotPoseId =
  | 'idle' | 'wave' | 'celebrate' | 'sad' | 'sleep' | 'hang' | 'pushup' | 'run'
  // Reference `opice-v2-pozy.png` (30 políček), doplněné statické pózy; pohyb dodá motion-agent.
  | 'loading' | 'peek' | 'wait' | 'pull' | 'sync'
  | 'success' | 'fail' | 'warning' | 'offline' | 'empty' | 'search'
  | 'notify' | 'inspect' | 'settings' | 'avatar' | 'locked'
  | 'streak' | 'trophy' | 'medal' | 'levelUp' | 'flex'
  | 'handstand' | 'plank' | 'stretch';

export interface LimbPose { upper: number; lower: number }
export type EyeState = 'open' | 'half' | 'closed';
/**
 * Doplňky (rekvizity) pózy: samostatné vrstvy z teček/čar v barvách `mascotProp`, `mascotFace` (na hrudi)
 * a `live` (jen kde je v referenci červená). Kresba v `components/mascot/PoseProps.tsx`.
 */
export type PoseExtra =
  | 'zz' | 'burst' | 'bar'
  | 'ring' | 'ledge' | 'hourglass' | 'rope' | 'syncArrows'
  | 'check' | 'cross' | 'triangle' | 'wifiOff' | 'emptyBox' | 'loupe'
  | 'bell' | 'bigLoupe' | 'gear' | 'avatarRing' | 'padlock'
  | 'flame' | 'cup' | 'medal' | 'stairs';
/** Co z postavy se kreslí: celá, busta (hlava + horní trup, profil) nebo jen hlava (loader, synchronizace, vykukování). */
export type PoseFigure = 'full' | 'bust' | 'head';

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
  /** Výřez postavy (diskrétní, při prolnutí se přepne v polovině). */
  figure: PoseFigure;
  /** Spodní ořez postavy ve viewBoxu (0 = bez ořezu): vykukování přes hranu, busta v kruhu. Číslo, jde do prolnutí. */
  clipY: number;
}

const rest: LimbPose = { upper: 14, lower: 0 };
const leg: LimbPose = { upper: 4, lower: 0 };
const still = { dx: 0, dy: 0, tilt: 0 };

/** Nová póza = klidový stoj + rozdíly (čitelnější data pro 22 póz z reference). */
const pose = (o: Partial<MascotPose>): MascotPose => ({
  armL: rest, armR: rest, legL: leg, legR: leg, body: 0, dx: 0, dy: 0, head: still, reach: 1,
  eyes: 'open', joyDot: false, extra: null, figure: 'full', clipY: 0, ...o,
});
/** Jen hlava uprostřed viewBoxu (střed hlavy 66 → 100). */
const HEAD_ONLY = { figure: 'head' as const, dy: 34 };

export const MASCOT_POSES: Record<MascotPoseId, MascotPose> = {
  idle: { armL: rest, armR: rest, legL: leg, legR: leg, body: 0, dx: 0, dy: 0, head: still, reach: 1, eyes: 'open', joyDot: false, extra: null, figure: 'full', clipY: 0 },
  // Pravá paže nahoru, předloktí kolmo vzhůru, mírný náklon hlavy k mávající ruce.
  wave: {
    armL: rest, armR: { upper: 112, lower: 52 }, legL: leg, legR: leg,
    body: 0, dx: 0, dy: 0, head: { dx: 0, dy: 0, tilt: 6 }, reach: 1.3, eyes: 'open', joyDot: false, extra: null, figure: 'full', clipY: 0,
  },
  // Ruce do V nad hlavou, červená tečka a tečkový záblesk.
  celebrate: {
    armL: { upper: 95, lower: 80 }, armR: { upper: 95, lower: 80 }, legL: { upper: 10, lower: 0 }, legR: { upper: 10, lower: 0 },
    body: 0, dx: 0, dy: 0, head: still, reach: 1.7, eyes: 'open', joyDot: true, extra: 'burst', figure: 'full', clipY: 0,
  },
  // Hlava dolů, ramena svěšená k tělu, oči přivřené.
  sad: {
    armL: { upper: 4, lower: -6 }, armR: { upper: 4, lower: -6 }, legL: leg, legR: leg,
    body: 0, dx: 0, dy: 2, head: { dx: 0, dy: 8, tilt: -4 }, reach: 1, eyes: 'half', joyDot: false, extra: null, figure: 'full', clipY: 0,
  },
  // Leží na boku hlavou vlevo, končetiny přitažené, oči zavřené a Zz z teček.
  sleep: {
    armL: { upper: 0, lower: 0 }, armR: { upper: 0, lower: 0 }, legL: { upper: 0, lower: 0 }, legR: { upper: 0, lower: 0 },
    body: -90, dx: 42, dy: 0, head: { dx: 0, dy: 6, tilt: 90 }, reach: 0.8, eyes: 'closed', joyDot: false, extra: 'zz', figure: 'full', clipY: 0,
  },
  // Vis na hrazdě: ruce nahoru, nohy volně, postava výš (hrazda nad rukama).
  hang: {
    armL: { upper: 168, lower: 0 }, armR: { upper: 168, lower: 0 }, legL: { upper: 2, lower: 0 }, legR: { upper: 2, lower: 0 },
    body: 0, dx: 0, dy: 12, head: { dx: 0, dy: 6, tilt: 0 }, reach: 2.4, eyes: 'open', joyDot: false, extra: 'bar', figure: 'full', clipY: 0,
  },
  // Klik: tělo skoro vodorovně (hlava vpravo), paže kolmo k zemi, nohy v ose těla.
  pushup: {
    armL: { upper: -63, lower: 0 }, armR: { upper: 63, lower: 0 }, legL: { upper: 0, lower: 0 }, legR: { upper: 0, lower: 0 },
    body: 63, dx: -20, dy: 18, head: { dx: 0, dy: 0, tilt: -63 }, reach: 0.8, eyes: 'open', joyDot: false, extra: null, figure: 'full', clipY: 0,
  },
  // Běh: předklon, střídavé paže, jedno koleno nahoře.
  run: {
    armL: { upper: 30, lower: -40 }, armR: { upper: 70, lower: 75 }, legL: { upper: 50, lower: -70 }, legR: { upper: -4, lower: 0 },
    body: 10, dx: 0, dy: -2, head: { dx: 0, dy: 0, tilt: -6 }, reach: 1.1, eyes: 'open', joyDot: false, extra: null, figure: 'full', clipY: 0,
  },
  // ——— Řádek 1 reference: stavy čekání ———
  // Loader: hlava v kruhu 12 teček, horní tečka živá.
  loading: pose({ ...HEAD_ONLY, extra: 'ring' }),
  // Vykukuje přes hranu (ořez pod hranou), pod hranou tečkový pokrok.
  peek: pose({ figure: 'head', dy: 52, extra: 'ledge', clipY: 146, head: { dx: 0, dy: 0, tilt: 0 } }),
  // Stojí, hlava nakloněná, ruka v bok; vedle přesýpací hodiny z teček.
  wait: pose({ dx: -16, armR: { upper: 40, lower: -80 }, head: { dx: 0, dy: 0, tilt: 8 }, extra: 'hourglass' }),
  // Tah za lano: záklon, obě paže vpřed vpravo, nohy v podřepu.
  pull: pose({
    dx: -24, dy: 4, body: -12, armL: { upper: -70, lower: -10 }, armR: { upper: 76, lower: 6 },
    legL: { upper: -24, lower: 30 }, legR: { upper: 36, lower: -10 }, head: { dx: 0, dy: 0, tilt: 10 }, extra: 'rope',
  }),
  // Synchronizace: hlava v kruhu dvou tečkovaných šipek.
  sync: pose({ ...HEAD_ONLY, extra: 'syncArrows' }),
  // ——— Řádek 2: výsledky ———
  success: pose({ dx: -22, armR: { upper: 26, lower: 20 }, extra: 'check' }),
  fail: pose({ dx: -22, eyes: 'half', head: { dx: 0, dy: 3, tilt: -4 }, armR: { upper: 22, lower: 10 }, extra: 'cross' }),
  // Drží tečkový trojúhelník před tělem, uvnitř červený „!“.
  warning: pose({ armL: { upper: 30, lower: -70 }, armR: { upper: 30, lower: -70 }, extra: 'triangle' }),
  // Hlava nakloněná, drží přeškrtnuté wifi.
  offline: pose({ eyes: 'half', head: { dx: 0, dy: 2, tilt: -8 }, armL: { upper: 24, lower: -60 }, armR: { upper: 30, lower: -50 }, extra: 'wifiOff' }),
  // Ruce do stran, pod ní prázdný tečkový čtverec.
  empty: pose({ dy: -22, armL: { upper: 84, lower: -40 }, armR: { upper: 84, lower: -40 }, extra: 'emptyBox' }),
  // Lupa u pravého oka, ruka drží rukojeť.
  search: pose({ armR: { upper: 30, lower: 120 }, head: { dx: 0, dy: 0, tilt: -4 }, extra: 'loupe' }),
  // ——— Řádek 3: systém ———
  notify: pose({ armL: { upper: 22, lower: -10 }, armR: { upper: 22, lower: -10 }, extra: 'bell' }),
  // Velká lupa před obličejem, paže zvednutá k rukojeti.
  inspect: pose({ armR: { upper: 24, lower: 112 }, extra: 'bigLoupe' }),
  settings: pose({ armL: { upper: 22, lower: -10 }, armR: { upper: 22, lower: -10 }, extra: 'gear' }),
  // Busta v tečkovém kruhu (profil): hlava + ramena, ořez pod hrudí.
  avatar: pose({ figure: 'bust', dy: 24, clipY: 150, extra: 'avatarRing' }),
  locked: pose({ armL: { upper: 26, lower: -40 }, armR: { upper: 26, lower: -40 }, extra: 'padlock' }),
  // ——— Řádek 4: odměny ———
  streak: pose({ dx: -22, armR: { upper: 30, lower: 30 }, extra: 'flame' }),
  // Pohár drží oběma rukama na hrudi.
  trophy: pose({ armL: { upper: 34, lower: -80 }, armR: { upper: 34, lower: -80 }, extra: 'cup' }),
  medal: pose({ armL: { upper: 18, lower: 0 }, armR: { upper: 18, lower: 0 }, extra: 'medal' }),
  // Leze po schodech: pravá noha na schodu, paže v protipohybu.
  levelUp: pose({
    dx: -22, dy: 6, body: 8, armL: { upper: 40, lower: 30 }, armR: { upper: -24, lower: -30 },
    legL: { upper: -10, lower: 4 }, legR: { upper: 84, lower: -70 }, head: { dx: 0, dy: 0, tilt: -4 }, extra: 'stairs',
  }),
  // Zatíná biceps: pravá ruka nahoře v pěst, levá v bok, široký postoj.
  flex: pose({
    armL: { upper: 40, lower: -90 }, armR: { upper: 92, lower: 96 }, legL: { upper: 20, lower: -6 }, legR: { upper: 20, lower: -6 },
    head: { dx: 0, dy: 0, tilt: 6 }, reach: 1.1,
  }),
  // ——— Řádek 5: cviky ———
  // Stojka: celé tělo hlavou dolů, paže do země, nohy nahoru.
  handstand: pose({
    body: 180, dy: -58, armL: { upper: 140, lower: 20 }, armR: { upper: 140, lower: 20 }, legL: { upper: 4, lower: 0 }, legR: { upper: 4, lower: 0 },
    head: { dx: 0, dy: 0, tilt: 0 }, reach: 1.9,
  }),
  // Plank: tělo vodorovně na předloktích (hlava vpravo), nohy v ose.
  plank: pose({
    body: 84, dx: -34, dy: 14, armL: { upper: -84, lower: -90 }, armR: { upper: 84, lower: 90 },
    legL: { upper: 0, lower: 0 }, legR: { upper: 0, lower: 0 }, head: { dx: -14, dy: 0, tilt: -84 }, reach: 1.8,
  }),
  // Protahuje ruce nad hlavou, dlaně se potkají nad temenem.
  stretch: pose({ dy: 14, armL: { upper: 150, lower: 65 }, armR: { upper: 150, lower: 65 }, reach: 3.3, eyes: 'closed' }),
};

/** Pořadí jako v referenci `opice-v2-pozy.png` (5 řádků × 6); klid `idle` stojí před mřížkou. */
export const MASCOT_POSE_GRID: readonly MascotPoseId[] = [
  'loading', 'peek', 'run', 'wait', 'pull', 'sync',
  'success', 'fail', 'warning', 'offline', 'empty', 'search',
  'wave', 'notify', 'inspect', 'settings', 'avatar', 'locked',
  'streak', 'celebrate', 'trophy', 'medal', 'levelUp', 'flex',
  'sleep', 'pushup', 'hang', 'handstand', 'plank', 'stretch',
];

/**
 * Stav appky → póza (mapování z existujících míst; zapojení do obrazovek je volitelné, data jsou tady).
 */
export type AppPoseState =
  | 'loading' | 'empty' | 'error' | 'offline' | 'locked' | 'leagueWin' | 'leaguePodium' | 'stageUp'
  | 'streak' | 'settings' | 'profile' | 'success' | 'warning' | 'sync' | 'notify' | 'search' | 'waiting';
const APP_STATE_TO_POSE: Record<AppPoseState, MascotPoseId> = {
  loading: 'loading', empty: 'empty', error: 'fail', offline: 'offline', locked: 'locked',
  leagueWin: 'trophy', leaguePodium: 'medal', stageUp: 'levelUp', streak: 'streak', settings: 'settings',
  profile: 'avatar', success: 'success', warning: 'warning', sync: 'sync', notify: 'notify', search: 'search', waiting: 'wait',
};
export const poseForAppState = (s: AppPoseState): MascotPoseId => APP_STATE_TO_POSE[s];
/** Liga: 1. místo = pohár, 2.–3. = medaile, jinak bez speciální pózy. */
export const poseForLeagueRank = (rank: number): MascotPoseId | null => (rank === 1 ? 'trophy' : rank >= 2 && rank <= 3 ? 'medal' : null);

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
    clipY: n(a.clipY, b.clipY),
    eyes: late.eyes, joyDot: late.joyDot, extra: late.extra, figure: late.figure,
  };
}
