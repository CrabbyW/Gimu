import { EYE_DROP, EYE_RY, limbPath } from '@/components/mascot/monkeyGeometry';
import { applyLife, bezierOut, groupMatrix, LIFE_CLOCK_MS, LIFE_MS, LIVE_POSES, limbD, mixVector, POSE_CODE, POSE_LEN, poseVector, PV, swayDeg, WAVE_MS, zzFrame } from '@/lib/poseMotion';
import { MASCOT_POSE_IDS, MASCOT_POSES, mixPose } from '@/logic/mascotPoses';

const EYES = { ry: EYE_RY, drop: EYE_DROP };
const vec = (id: keyof typeof MASCOT_POSES) => poseVector(MASCOT_POSES[id], EYES);

test('vektor pózy nese všechna čísla pózy ve stálém pořadí', () => {
  for (const id of MASCOT_POSE_IDS) expect(vec(id)).toHaveLength(POSE_LEN);
  const p = MASCOT_POSES.wave;
  const v = vec('wave');
  expect(v[PV.armRu]).toBe(p.armR.upper);
  expect(v[PV.headTilt]).toBe(p.head.tilt);
  expect(v[PV.eyeRy]).toBe(EYE_RY.open);
  expect(vec('sad')[PV.eyeRy]).toBe(EYE_RY.half);
});

test('prolnutí vektorů = mixPose z logic (úhly, posuny, dosah)', () => {
  const a = MASCOT_POSES.idle, b = MASCOT_POSES.celebrate;
  for (const t of [0, 0.25, 0.5, 1]) {
    const m = mixPose(a, b, t);
    const v = mixVector(vec('idle'), vec('celebrate'), t);
    expect(v[PV.armLu]).toBeCloseTo(m.armL.upper);
    expect(v[PV.armRl]).toBeCloseTo(m.armR.lower);
    expect(v[PV.reach]).toBeCloseTo(m.reach);
    expect(v[PV.dy]).toBeCloseTo(m.dy);
  }
  // Mimo rozsah se ořízne.
  expect(mixVector(vec('idle'), vec('sad'), 2)).toEqual(vec('sad'));
});

test('křivka přechodu: cubic-bezier(0.22,1,0.36,1) — rychlý náběh, monotónní, bez přestřelu', () => {
  expect(bezierOut(0)).toBe(0);
  expect(bezierOut(1)).toBe(1);
  expect(bezierOut(0.25)).toBeGreaterThan(0.6);
  let prev = 0;
  for (let x = 0; x <= 1.0001; x += 0.05) {
    const y = bezierOut(x);
    expect(y).toBeGreaterThanOrEqual(prev - 1e-9);
    expect(y).toBeLessThanOrEqual(1 + 1e-9);
    prev = y;
  }
});

test('lomená čára končetiny ve workletu = kresba z monkeyGeometry', () => {
  const p = MASCOT_POSES.run;
  expect(limbD(80, 114, 18, 18, p.armL.upper, p.armL.lower, -1)).toBe(limbPath(80, 114, 18, 18, p.armL, -1));
  expect(limbD(112, 144, 16, 16, p.legR.upper, p.legR.lower, 1)).toBe(limbPath(112, 144, 16, 16, p.legR, 1));
});

/** Hodina, ve které je póza `code` ve fázi `p` své periody. */
const at = (code: number, p: number) => (p * (LIFE_MS[code] ?? 1)) / LIFE_CLOCK_MS;

test('živá smyčka: periody dělí hodinu beze zbytku (přetočení bez skoku), kódy = pořadí póz', () => {
  for (const ms of [...LIFE_MS, WAVE_MS]) expect(LIFE_CLOCK_MS % ms).toBe(0);
  expect(MASCOT_POSE_IDS.map((id) => POSE_CODE[id])).toEqual(MASCOT_POSE_IDS.map((_, i) => i));
  for (const id of MASCOT_POSE_IDS) {
    const v = vec(id), c = POSE_CODE[id];
    // Začátek a konec hodiny = stejný snímek.
    applyLife(v, c, 0, 1, 0).forEach((x, i) => expect(x).toBeCloseTo(applyLife(v, c, 1, 1, 0)[i]!, 6));
  }
});

test('každá póza se smyčkou žije (se zapnutým pohybem se vektor v čase mění), omezený pohyb = statická póza', () => {
  // Kódy ≥ LIVE_POSES jsou zatím statické pózy z reference (smyčku doplní motion-agent).
  for (const id of MASCOT_POSE_IDS.slice(0, LIVE_POSES)) {
    const v = vec(id), c = POSE_CODE[id];
    const a = applyLife(v, c, at(c, 0.25), 1, 0), b = applyLife(v, c, at(c, 0.75), 1, 0);
    expect(a).not.toEqual(b);
    expect(applyLife(v, c, at(c, 0.25), 0, 1)).toEqual(v);
  }
});

test('idle: trup přenáší váhu, hlava, uši a pohled se hýbou; uši dokmitávají opačně', () => {
  const v = vec('idle');
  const x = applyLife(v, 0, at(0, 0.25), 1, 0);
  expect(x[PV.body]).toBeGreaterThan(0);
  expect(x[PV.headTilt]).not.toBe(0);
  expect(x[PV.earL]).toBeCloseTo(-x[PV.earR]!);
  expect(x[PV.earL]).not.toBe(0);
  expect(Math.abs(x[PV.lookX]!)).toBeGreaterThan(0);
});

test('mávnutí jen s amplitudou, hýbe pravým předloktím; oslava přivře oči; běh střídá strany; klik se sklopí', () => {
  const w = vec('wave');
  const c1 = at(1, 0) + (0.25 * WAVE_MS) / LIFE_CLOCK_MS;
  expect(applyLife(w, 1, c1, 1, 1)[PV.armRl]! - applyLife(w, 1, c1, 1, 0)[PV.armRl]!).toBeCloseTo(26, 0);
  expect(applyLife(vec('celebrate'), 2, at(2, 0.75), 1, 0)[PV.squint]).toBeLessThan(1);
  const r = vec('run');
  const half = applyLife(r, 7, at(7, 0.25), 1, 0);
  expect(half[PV.legLu]).toBeCloseTo(r[PV.legRu]!);
  expect(half[PV.armRu]).toBeCloseTo(r[PV.armLu]!);
  const pu = vec('pushup');
  expect(applyLife(pu, 6, at(6, 0.5), 1, 0)[PV.reach]).toBeLessThan(pu[PV.reach]!);
  expect(swayDeg(5, at(5, 0.25), 1)).toBeCloseTo(4);
  expect(swayDeg(5, at(5, 0.25), 0)).toBe(0);
  expect(swayDeg(7, at(7, 0.25), 1)).toBe(0);
});

test('matice skupiny = translate + rotate kolem bodu (web řetězec, nativ pole)', () => {
  expect(groupMatrix(0, 100, 100, 3, 4, false)).toEqual({ matrix: [1, 0, -0, 1, 3, 4] });
  const m = groupMatrix(90, 100, 146, 0, 0, false).matrix as number[];
  // Bod otáčení zůstává na místě.
  expect(m[0]! * 100 + m[2]! * 146 + m[4]!).toBeCloseTo(100);
  expect(m[1]! * 100 + m[3]! * 146 + m[5]!).toBeCloseTo(146);
  expect(String(groupMatrix(0, 0, 0, 0, 2, true).transform)).toMatch(/^matrix\(/);
});

test('Zz: stoupají a v krajích fáze mizí', () => {
  expect(zzFrame(0, 14).opacity).toBeCloseTo(0);
  expect(zzFrame(0.5, 14)).toEqual({ ty: -7, opacity: 1 });
  expect(zzFrame(1.25, 14).ty).toBeCloseTo(-3.5);
});
