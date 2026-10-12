import { BONES, BOUNDS, DOT, GROUND_Y, JOINTS, SILHOUETTES, type Pose } from '@/logic/silhouettePoses';
import { boneDotCounts, propDots, lerpPose, poseAt, poseFrame, silhouetteDots } from '@/logic/silhouette';
import type { SilhouetteId } from '@/types';

const IDS = Object.keys(SILHOUETTES) as SilhouetteId[];
const ALL: SilhouetteId[] = ['plank', 'sidePlank', 'pushup', 'squat', 'lunge', 'hollow', 'superman',
  'handstandWall', 'lsit', 'dip', 'pullup', 'hang', 'bridge', 'crow', 'jump'];

describe('silhouette poses', () => {
  it('cover every SilhouetteId', () => { expect(IDS.sort()).toEqual([...ALL].sort()); });

  it.each(ALL)('%s has 2-3 key poses with all joints inside bounds', (id) => {
    const { keys } = SILHOUETTES[id];
    expect(keys.length).toBeGreaterThanOrEqual(2);
    expect(keys.length).toBeLessThanOrEqual(3);
    for (const p of keys) {
      expect(Object.keys(p.joints).sort()).toEqual([...JOINTS].sort());
      for (const [x, y] of [p.head, ...Object.values(p.joints)]) {
        expect(x).toBeGreaterThanOrEqual(BOUNDS.minX); expect(x).toBeLessThanOrEqual(BOUNDS.maxX);
        expect(y).toBeGreaterThanOrEqual(BOUNDS.minY); expect(y).toBeLessThanOrEqual(BOUNDS.maxY);
      }
    }
  });

  it.each(ALL)('%s keeps a constant dot count across t and stays in its frame', (id) => {
    const n = silhouetteDots(id, 0).length;
    const f = poseFrame(id);
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const d = silhouetteDots(id, t);
      expect(d).toHaveLength(n);
      for (const [x, y] of d) {
        expect(x).toBeGreaterThanOrEqual(f.x); expect(x).toBeLessThanOrEqual(f.x + f.w);
        expect(y).toBeGreaterThanOrEqual(f.y); expect(y).toBeLessThanOrEqual(f.y + f.h);
      }
    }
    expect(boneDotCounts(id)).toHaveLength(BONES.length);
  });

  it('holds only breathe (max joint travel <= 4 units)', () => {
    for (const id of ALL.filter((i) => SILHOUETTES[i].kind === 'hold')) {
      const [a, b] = SILHOUETTES[id].keys as [Pose, Pose];
      for (const j of JOINTS) {
        expect(Math.hypot(a.joints[j][0] - b.joints[j][0], a.joints[j][1] - b.joints[j][1])).toBeLessThanOrEqual(4);
      }
    }
  });

  it('reps show real technique (some joint travels >= 8 units)', () => {
    for (const id of ALL.filter((i) => SILHOUETTES[i].kind === 'reps')) {
      const { keys } = SILHOUETTES[id];
      const a = keys[0] as Pose; const b = keys[keys.length - 1] as Pose;
      const travel = Math.max(...JOINTS.map((j) => Math.hypot(a.joints[j][0] - b.joints[j][0], a.joints[j][1] - b.joints[j][1])));
      expect(travel).toBeGreaterThanOrEqual(8);
    }
  });
});

describe('interpolation', () => {
  const [a, b, c] = SILHOUETTES.pushup.keys as [Pose, Pose, Pose];
  it('lerpPose hits endpoints and midpoint, clamps out of range', () => {
    expect(lerpPose(a, b, 0)).toEqual(a);
    expect(lerpPose(a, b, 1)).toEqual(b);
    expect(lerpPose(a, b, 0.5).head).toEqual([(a.head[0] + b.head[0]) / 2, (a.head[1] + b.head[1]) / 2]);
    expect(lerpPose(a, b, -3)).toEqual(a);
    expect(lerpPose(a, b, 7)).toEqual(b);
    expect(lerpPose(a, b, Number.NaN)).toEqual(a);
  });
  it('poseAt walks key poses piecewise', () => {
    expect(poseAt([a, b, c], 0)).toEqual(a);
    expect(poseAt([a, b, c], 0.5)).toEqual(b);
    expect(poseAt([a, b, c], 1)).toEqual(c);
    expect(poseAt([a, b, c], 0.25)).toEqual(lerpPose(a, b, 0.5));
    expect(poseAt([a, b, c], 0.75)).toEqual(lerpPose(b, c, 0.5));
    expect(poseAt([a], 0.6)).toBe(a);
  });
});

describe('technique fixes (QA U3)', () => {
  it('dip: feet stay off the ground in every key pose and bars are drawn', () => {
    for (const p of SILHOUETTES.dip.keys) {
      expect(p.joints.footL[1] + DOT.r).toBeLessThan(GROUND_Y);
      expect(p.joints.footR[1] + DOT.r).toBeLessThan(GROUND_Y);
    }
    expect(propDots('dip').length).toBeGreaterThan(10);
    expect(silhouetteDots('dip', 0).length).toBe(silhouetteDots('dip', 1).length);
  });
  it('squat: hip below knees at the bottom (below parallel)', () => {
    const { keys } = SILHOUETTES.squat;
    const bottom = keys[keys.length - 1] as Pose;
    expect(bottom.joints.hip[1]).toBeGreaterThan(bottom.joints.kneeL[1]);
    expect(bottom.joints.hip[1]).toBeGreaterThan(bottom.joints.kneeR[1]);
  });
  it.each(['crow', 'lsit'] as SilhouetteId[])('%s (compact) fills >= 70 %% of frame height', (id) => {
    const f = poseFrame(id);
    const top = Math.min(...SILHOUETTES[id].keys.map((p) => p.head[1] - 7));
    expect((GROUND_Y - top) / f.h).toBeGreaterThanOrEqual(0.7);
  });
});
