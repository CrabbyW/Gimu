import { IDLE_ACTIONS } from '@/logic/mascotIdle';
import {
  limbEnd, MASCOT_POSE_IDS, MASCOT_POSES, mixPose, poseForIdle, poseForMood, poseForReaction, resolvePose,
} from '@/logic/mascotPoses';

test('osm statických póz, každá s čísly v rozumných mezích', () => {
  expect(MASCOT_POSE_IDS).toEqual(['idle', 'wave', 'celebrate', 'sad', 'sleep', 'hang', 'pushup', 'run']);
  for (const p of Object.values(MASCOT_POSES)) {
    for (const l of [p.armL, p.armR, p.legL, p.legR]) {
      expect(Math.abs(l.upper)).toBeLessThanOrEqual(180);
      expect(Math.abs(l.lower)).toBeLessThanOrEqual(180);
    }
    expect(Math.abs(p.body)).toBeLessThanOrEqual(90);
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
