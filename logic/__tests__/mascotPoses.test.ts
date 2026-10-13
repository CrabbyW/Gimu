import { IDLE_ACTIONS } from '@/logic/mascotIdle';
import {
  limbEnd, MASCOT_POSE_GRID, MASCOT_POSE_IDS, MASCOT_POSES, mixPose, MASCOT_REPERTOIRE_POSES, poseForAppState, poseForRepertoire, poseForIdle, poseForLeagueRank, poseForMood,
  poseForReaction, resolvePose,
} from '@/logic/mascotPoses';

test('statické pózy: původních 8 na začátku (kódy pohybu), celkem klid + sad + 30 z reference, čísla v mezích', () => {
  expect(MASCOT_POSE_IDS.slice(0, 8)).toEqual(['idle', 'wave', 'celebrate', 'sad', 'sleep', 'hang', 'pushup', 'run']);
  expect(MASCOT_POSE_IDS).toHaveLength(43);
  expect(MASCOT_POSE_GRID).toHaveLength(30);
  expect(new Set(MASCOT_POSE_GRID).size).toBe(30);
  // Každá póza mimo klid a smutek je v mřížce reference.
  expect(MASCOT_POSE_IDS.filter((id) => !MASCOT_POSE_GRID.includes(id) && !MASCOT_REPERTOIRE_POSES.includes(id))).toEqual(['idle', 'sad']);
  for (const p of Object.values(MASCOT_POSES)) {
    for (const l of [p.armL, p.armR, p.legL, p.legR]) {
      expect(Math.abs(l.upper)).toBeLessThanOrEqual(180);
      expect(Math.abs(l.lower)).toBeLessThanOrEqual(180);
    }
    expect(Math.abs(p.body)).toBeLessThanOrEqual(180);
    expect(p.clipY === 0 || (p.clipY > 100 && p.clipY < 200)).toBe(true);
    expect(p.reach).toBeGreaterThan(0);
  }
});

test('charakter póz: oslava ruce nahoru + tečka, smutek hlava dolů a přivřené oči, spánek leží se zavřenýma očima', () => {
  const up = (deg: number, bend: number) => deg + bend > 120;
  expect(up(MASCOT_POSES.celebrate.armL.upper, MASCOT_POSES.celebrate.armL.lower)).toBe(true);
  expect(MASCOT_POSES.celebrate.joyDot).toBe(true);
  expect(MASCOT_POSES.sad.head.dy).toBeGreaterThan(0);
  expect(MASCOT_POSES.sad.eyes).toBe('half');
  expect(Math.abs(MASCOT_POSES.sleep.body)).toBe(90);
  expect(MASCOT_POSES.sleep).toMatchObject({ eyes: 'closed', extra: 'zz' });
  expect(MASCOT_POSES.hang).toMatchObject({ extra: 'bar' });
  expect(MASCOT_POSES.hang.armL.upper).toBeGreaterThan(150);
  expect(Math.abs(MASCOT_POSES.pushup.body)).toBeGreaterThan(45);
  // Jen oslava nese červenou tečku (jediný barevný akcent opice).
  expect(MASCOT_POSE_IDS.filter((id) => MASCOT_POSES[id].joyDot)).toEqual(['celebrate']);
});

test('mapování nálad, reakcí a idle akcí na pózy', () => {
  expect(poseForMood('idle')).toBe('idle');
  expect(poseForMood('happy')).toBe('wave');
  expect(poseForMood('celebrate')).toBe('celebrate');
  expect(poseForMood('sad')).toBe('sad');
  expect(poseForReaction('sleep')).toBe('sleep');
  expect(poseForReaction('joyJump')).toBe('celebrate');
  expect(poseForReaction('shrug')).toBe('sad');
  expect(poseForReaction('hop')).toBeNull();
  expect(poseForIdle('stretch')).toBe('hang');
  for (const id of IDLE_ACTIONS) expect(() => poseForIdle(id)).not.toThrow();
});

test('resolvePose: explicitní > reakce > idle > nálada', () => {
  expect(resolvePose({ pose: 'run', mood: 'sad', reaction: 'sleep' })).toBe('run');
  expect(resolvePose({ mood: 'idle', reaction: 'sleep', idle: 'stretch' })).toBe('sleep');
  expect(resolvePose({ mood: 'idle', reaction: 'hop', idle: 'stretch' })).toBe('hang');
  expect(resolvePose({ mood: 'sad', reaction: 'hop' })).toBe('sad');
});

test('limbEnd: 0° dolů, 90° ven do strany, 180° nahoru, strany zrcadlené', () => {
  const near = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    expect(a.x).toBeCloseTo(b.x, 6);
    expect(a.y).toBeCloseTo(b.y, 6);
  };
  near(limbEnd(0, 0, 10, 0, 1), { x: 0, y: 10 });
  near(limbEnd(0, 0, 10, 90, 1), { x: 10, y: 0 });
  near(limbEnd(0, 0, 10, 90, -1), { x: -10, y: 0 });
  near(limbEnd(0, 0, 10, 180, 1), { x: 0, y: -10 });
});

test('mixPose: krajní body = vstupy, polovina = průměr úhlů, diskrétní pole se přepnou v půlce', () => {
  const a = MASCOT_POSES.idle, b = MASCOT_POSES.celebrate;
  expect(mixPose(a, b, 0)).toEqual(a);
  expect(mixPose(a, b, 1)).toEqual(b);
  const m = mixPose(a, b, 0.5);
  expect(m.armL.upper).toBeCloseTo((a.armL.upper + b.armL.upper) / 2);
  expect(m.joyDot).toBe(true);
  expect(mixPose(a, b, 0.49).joyDot).toBe(false);
  expect(mixPose(a, b, 2)).toEqual(b);
});

test('pózy z reference: výřez postavy, rekvizity, stojka hlavou dolů', () => {
  expect(MASCOT_POSES.loading).toMatchObject({ figure: 'head', extra: 'ring' });
  expect(MASCOT_POSES.sync).toMatchObject({ figure: 'head', extra: 'syncArrows' });
  expect(MASCOT_POSES.peek.figure).toBe('head');
  expect(MASCOT_POSES.peek.clipY).toBeGreaterThan(0);
  expect(MASCOT_POSES.avatar).toMatchObject({ figure: 'bust', extra: 'avatarRing' });
  expect(MASCOT_POSES.fail.eyes).toBe('half');
  expect(MASCOT_POSES.handstand.body).toBe(180);
  expect(MASCOT_POSES.stretch.armL.upper + MASCOT_POSES.stretch.armL.lower).toBeGreaterThan(180);
  // Bez rekvizity jsou jen čisté pohybové pózy.
  expect(MASCOT_POSE_IDS.filter((id) => MASCOT_POSES[id].extra === null))
    .toEqual(['idle', 'wave', 'sad', 'pushup', 'run', 'flex', 'handstand', 'plank', 'stretch', 'warmup']);
});

test('mapování stavů appky na pózy', () => {
  expect(poseForAppState('empty')).toBe('empty');
  expect(poseForAppState('error')).toBe('fail');
  expect(poseForAppState('offline')).toBe('offline');
  expect(poseForAppState('locked')).toBe('locked');
  expect(poseForAppState('stageUp')).toBe('levelUp');
  expect(poseForAppState('streak')).toBe('streak');
  expect(poseForAppState('settings')).toBe('settings');
  expect(poseForAppState('profile')).toBe('avatar');
  expect(poseForAppState('loading')).toBe('loading');
  expect(poseForAppState('leagueWin')).toBe('trophy');
  expect(poseForLeagueRank(1)).toBe('trophy');
  expect(poseForLeagueRank(2)).toBe('medal');
  expect(poseForLeagueRank(3)).toBe('medal');
  expect(poseForLeagueRank(4)).toBeNull();
  expect(poseForLeagueRank(0)).toBeNull();
});

test('prolnutí s novými poli: ořez je číslo, výřez se přepne v polovině', () => {
  const a = MASCOT_POSES.idle, b = MASCOT_POSES.peek;
  expect(mixPose(a, b, 0.5).clipY).toBeCloseTo(b.clipY / 2);
  expect(mixPose(a, b, 0.4).figure).toBe('full');
  expect(mixPose(a, b, 0.5).figure).toBe('head');
});

test('repertoár: každá akce má pózu nebo je čistý pohyb, nové pózy existují a jsou v galerii', () => {
  expect(poseForRepertoire('liftBarbell')).toBe('liftBarbell');
  expect(poseForRepertoire('wipeSweat')).toBe('wipeSweat');
  expect(poseForRepertoire('giggle')).toBe('giggle');
  expect(poseForRepertoire('strain')).toBe('strain');
  expect(poseForRepertoire('flameJump')).toBe('streak');
  expect(poseForRepertoire('climbPodium')).toBe('levelUp');
  expect(poseForRepertoire('hangFinger')).toBe('hang');
  expect(poseForRepertoire('wifiShake')).toBe('offline');
  expect(poseForRepertoire('headShake')).toBeNull();
  expect(poseForRepertoire('trainAlong')).toBeNull();
  expect(MASCOT_REPERTOIRE_POSES).toHaveLength(11);
  for (const id of MASCOT_REPERTOIRE_POSES) expect(MASCOT_POSE_IDS).toContain(id);
  // Nové pózy jsou za původními (kódy pohybu 0–31 se neposunou).
  expect(MASCOT_POSE_IDS.slice(32)).toEqual(expect.arrayContaining([...MASCOT_REPERTOIRE_POSES]));
  expect(MASCOT_POSES.giggle.eyes).toBe('closed');
  expect(MASCOT_POSES.strain.eyes).toBe('half');
  // Činka: obě dlaně nad temenem.
  expect(MASCOT_POSES.liftBarbell.armL.upper).toBeGreaterThan(150);
});
