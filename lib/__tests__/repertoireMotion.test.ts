import { EYE_DROP, EYE_RY, handWorld, V2 } from '@/components/mascot/monkeyGeometry';
import { repertoire } from '@/lib/motion';
import { POSE_CODE, poseVector, PV } from '@/lib/poseMotion';
import {
  ACT_CODE, ACT_CODES_FOR_TEST, ACT_IDS, ACT_SPEC, actBody, actPoseAt, actProp, actSway, applyAct, applyTrain, GEOMETRY_FOR_TEST,
  growDot, handAt, handFollow, NO_ACT, POSE_CODES_FOR_TEST, towelDot, TRAIN_FOR, TRAIN_SQUAT, type ActId,
} from '@/lib/repertoireMotion';
import { MASCOT_POSE_IDS, MASCOT_POSES, poseForRepertoire } from '@/logic/mascotPoses';
import { REPERTOIRE_HAPTIC, type RepertoireId } from '@/logic/mascotRepertoire';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mock knihovny */
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

const EYES = { ry: EYE_RY, drop: EYE_DROP };
const vec = (id: keyof typeof MASCOT_POSES) => poseVector(MASCOT_POSES[id], EYES);
const REP: RepertoireId[] = ACT_IDS.filter((id): id is RepertoireId => id !== 'shrug');
const samples = (n: number) => Array.from({ length: n + 1 }, (_, i) => i / n);

test('23 akcí repertoáru + pokrčení ramen, kódy pro worklety sedí s ACT_CODE', () => {
  expect(REP).toHaveLength(23);
  const names: Record<string, ActId> = {
    WARMUP: 'warmup', BORED: 'boredSit', POINT: 'pointStart', HOP: 'plateHop', HANDSTAND: 'handstandPlate', MORNING: 'morningStretch',
    TOWEL: 'eveningTowel', AT_RISK: 'streakAtRisk', SAD_POINT: 'sadThenPoint', HEAD_SHAKE: 'headShake', GIGGLE: 'giggle', HANG: 'hangFinger',
    STRAIN: 'strain', SWEAT: 'wipeSweat', LIFT: 'liftBarbell', FLAME: 'flameJump', CLIMB: 'climbPodium', GROW: 'grow', WAVE_RUN: 'waveRun',
    WIFI: 'wifiShake', ROPE: 'ropeTangle', PEEK: 'peekBox', SHRUG: 'shrug',
  };
  for (const [k, v] of Object.entries(ACT_CODES_FOR_TEST)) expect(v).toBe(ACT_CODE[names[k]!]);
});

test('kódy póz a geometrie ve workletech = logic/mascotPoses a monkeyGeometry', () => {
  const P = POSE_CODES_FOR_TEST;
  expect([P.P_OFFLINE, P.P_STREAK, P.P_LIFT, P.P_SWEAT, P.P_AT_RISK, P.P_ROPE, P.P_POINT, P.P_PEEK]).toEqual(
    [POSE_CODE.offline, POSE_CODE.streak, POSE_CODE.liftBarbell, POSE_CODE.wipeSweat, POSE_CODE.streakAtRisk, POSE_CODE.ropeTangle, POSE_CODE.pointStart, POSE_CODE.peekBox],
  );
  const G = GEOMETRY_FOR_TEST;
  expect([G.HIP_X, G.HIP_Y, G.SH_DX, G.SH_Y, G.ARM_SEG, G.LEG_SEG]).toEqual([V2.hip.x, V2.hip.y, V2.shoulder.dx, V2.shoulder.y, V2.arm.upper, V2.leg.upper]);
  expect(V2.arm.lower).toBe(V2.arm.upper);
  expect(V2.leg.lower).toBe(V2.leg.upper);
});

test('dlaň z vektoru pózy = handWorld (rekvizita v ruce jde s dlaní)', () => {
  for (const id of MASCOT_POSE_IDS) {
    for (const side of [-1, 1] as const) {
      const h = handAt(vec(id), side), w = handWorld(MASCOT_POSES[id], side);
      expect(h[0]).toBeCloseTo(w.x, 6);
      expect(h[1]).toBeCloseTo(w.y, 6);
    }
  }
  // Statická póza = žádný posun rekvizity.
  expect(handFollow(POSE_CODE.liftBarbell, vec('liftBarbell'), vec('liftBarbell'))).toEqual([0, 0]);
});

test('pózy akcí: první póza = poseForRepertoire (logic), všechny existují', () => {
  for (const id of REP) {
    const first = ACT_SPEC[id].poses[0];
    const mapped = poseForRepertoire(id);
    if (mapped === null) expect(first).toBeUndefined();
    else expect(first).toEqual([0, mapped]);
  }
  for (const id of ACT_IDS) {
    for (const [at, pose] of ACT_SPEC[id].poses) {
      expect(at).toBeGreaterThanOrEqual(0);
      expect(at).toBeLessThan(1);
      if (pose) expect(MASCOT_POSES[pose]).toBeDefined();
    }
  }
  expect(actPoseAt('flameJump', 0.3)).toBe('streak');
  expect(actPoseAt('flameJump', 0.7)).toBe('flex');
  expect(actPoseAt('sadThenPoint', 0.6)).toBe('pointStart');
  expect(actPoseAt('headShake', 0.5)).toBeUndefined();
});

test('haptika jen u akcí z REPERTOIRE_HAPTIC (a u nich vždy)', () => {
  for (const id of ACT_IDS) {
    const h = ACT_SPEC[id].haptic;
    const allowed = id !== 'shrug' && REPERTOIRE_HAPTIC.has(id);
    expect(h !== null).toBe(allowed);
  }
  // Činka: haptika přesně v okamžiku nacvaknutí kotouče.
  expect(ACT_SPEC.liftBarbell.haptic?.at).toBe(0.6);
});

test('délky akcí z lib/motion; každá obálka začíná i končí v klidu (žádný skok)', () => {
  for (const id of ACT_IDS) {
    expect(ACT_SPEC[id].ms).toBe(repertoire.ms[id]);
    const code = ACT_CODE[id];
    const base = vec('idle');
    expect(applyAct(base, code, 0)).toEqual(base);
    expect(applyAct(base, code, 1)).toEqual(base);
    expect(actBody(code, 0, 1)).toEqual([0, 0, 0, 1, 1]);
    expect(actBody(code, 1, 1)).toEqual([0, 0, 0, 1, 1]);
    expect(actSway(code, 0)).toBe(0);
    expect(actSway(code, 1)).toBe(0);
  }
  expect(applyAct(vec('idle'), NO_ACT, 0.5)).toEqual(vec('idle'));
});

test('plynulost: mezi snímky (60 fps) se kostra ani tělo nehne skokem; všechno konečná čísla', () => {
  for (const id of ACT_IDS) {
    const code = ACT_CODE[id];
    const frames = Math.ceil(ACT_SPEC[id].ms / (1000 / 60));
    const pose = ACT_SPEC[id].poses[0]?.[1] ?? 'idle';
    let prev = applyAct(vec(pose), code, 0);
    let prevB = actBody(code, 0, 1);
    for (const t of samples(frames)) {
      const v = applyAct(vec(pose), code, t);
      const b = actBody(code, t, 1);
      for (const x of [...v, ...b, actSway(code, t)]) expect(Number.isFinite(x)).toBe(true);
      for (let i = 0; i < v.length; i++) {
        // Úhly (°) a posuny (pt viewBoxu) za 16,7 ms: nejvýš 14 (rychlý třes, mávnutí), žádný teleport.
        expect(Math.abs((v[i] ?? 0) - (prev[i] ?? 0))).toBeLessThan(i === PV.reach ? 0.2 : 14);
      }
      // Skok polohy je dovolený jen neviditelně (doběh začíná průhledný vedle uzlu).
      if ((b[4] ?? 1) > 0.05) for (let i = 0; i < 3; i++) expect(Math.abs((b[i] ?? 0) - (prevB[i] ?? 0))).toBeLessThan(12);
      prev = v; prevB = b;
    }
  }
});

test('mapa kreslí cestu sama: travel 0 = přeskok i doběh bez posunu v plátně', () => {
  for (const t of samples(40)) {
    expect(actBody(ACT_CODE.plateHop, t, 0)[0]).toBe(0);
    expect(actBody(ACT_CODE.plateHop, t, 0)[1]).toBe(0);
    expect(actBody(ACT_CODE.waveRun, t, 0)[0]).toBe(0);
  }
  // Galerie: přeskok doletí na souseda a vrátí se.
  const mid = actBody(ACT_CODE.plateHop, (repertoire.hop.to[1] + repertoire.hop.back[0]) / 2, 1);
  expect(mid[0]).toBeGreaterThan(40);
  expect(actBody(ACT_CODE.plateHop, 0.95, 1)[0]).toBeCloseTo(0);
});

test('činka: pravý kotouč (část 1) chybí do 0.5 osy, v 0.6 nacvakne; bez akce je na místě', () => {
  const L = ACT_CODE.liftBarbell, P = POSE_CODE.liftBarbell;
  expect(actProp(L, 0.3, P, 1, 2)[5]).toBe(0);
  expect(actProp(L, 0.6, P, 1, 2)[5]).toBe(1);
  expect(actProp(L, 0.6, P, 1, 2)[3]).toBeCloseTo(0);
  expect(actProp(L, 0.65, P, 1, 2)[1]).toBeGreaterThan(1);
  expect(actProp(L, 0.3, P, 0, 2)).toEqual([0, 1, 1, 0, 0, 1]);
  expect(actProp(NO_ACT, 0.3, P, 1, 2)).toEqual([0, 1, 1, 0, 0, 1]);
  // Činka jde s rukama: v podřepu u ramen je níž než nad hlavou.
  const low = applyAct(vec('liftBarbell'), L, 0.1);
  expect(handFollow(P, low, vec('liftBarbell'))[1]).toBeGreaterThan(20);
});

test('podřep drží chodidla na zemi (tělo klesne přesně o zkrácení nohou)', () => {
  const foot = (v: number[]) => {
    const h = (u: number, l: number) => 16 * Math.cos((u * Math.PI) / 180) + 16 * Math.cos(((u + l) * Math.PI) / 180);
    return V2.hipJoint.y + (v[PV.dy] ?? 0) + (h(v[4] ?? 0, v[5] ?? 0) + h(v[6] ?? 0, v[7] ?? 0)) / 2;
  };
  const base = foot(vec('idle'));
  for (const q of [0, 0.3, 0.7, 1]) expect(foot(applyTrain(vec('idle'), TRAIN_SQUAT, q))).toBeCloseTo(base, 6);
  // Dřep v rozcvičce taky.
  expect(foot(applyAct(vec('warmup'), ACT_CODE.warmup, 0.68))).toBeCloseTo(foot(vec('warmup')), 6);
});

test('cvičení s tebou: každá silueta má pózu a pohyb; necvičí = beze změny', () => {
  for (const [, t] of Object.entries(TRAIN_FOR)) {
    expect(MASCOT_POSES[t.pose]).toBeDefined();
    const v = applyTrain(vec(t.pose), t.mode, 0.5);
    for (const x of v) expect(Number.isFinite(x)).toBe(true);
  }
  expect(applyTrain(vec('idle'), -1, 0.5)).toEqual(vec('idle'));
});

test('tečky růstu a ručník: mimo akci neviditelné', () => {
  for (const i of [0, 7, 15]) {
    expect(growDot(0, i, 16)[2]).toBe(0);
    expect(growDot(1, i, 16)[2]).toBe(0);
    expect(towelDot(0, i % 6, 6, 100, 100)[2]).toBe(0);
  }
  expect(Math.max(...samples(50).map((t) => growDot(t, 3, 16)[0] ?? 0))).toBeGreaterThan(2);
});
