import { STAGE_THRESHOLDS } from '@/data/xp';
import { toISODate } from '@/logic/dates';
import { stageForXp } from '@/logic/mascot';
import { activeDays, currentStreak } from '@/logic/streak';
import { totalXp } from '@/logic/xp';
import { buildDemoProfile, DEMO_TARGET_XP } from '@/services/mock/demoData';

const NOW = new Date(2026, 9, 5, 12);

test('demo profil: stage 1 těsně pod stage 2, streak 12, dnešek volný', () => {
  const p = buildDemoProfile(NOW);
  const xp = totalXp(p.activity);
  expect(xp).toBe(DEMO_TARGET_XP);
  expect(stageForXp(xp, STAGE_THRESHOLDS)).toBe(1);
  expect(xp + 44).toBeGreaterThanOrEqual(STAGE_THRESHOLDS[1]);
  const today = toISODate(NOW);
  expect(p.activity.some((e) => e.day === today)).toBe(false);
  expect(currentStreak(activeDays(p.activity), today)).toBe(12);
});

test('demo profil: jeden splněný milník (mikina odemčená), cíl sezóny, váhy', () => {
  const p = buildDemoProfile(NOW);
  expect(p.milestones.filter((m) => m.current >= m.target)).toHaveLength(1);
  expect(p.seasonGoals['winter-arc-2026']).toEqual({ kind: 'activeDays', days: 60 });
  expect(p.weights.length).toBeGreaterThan(0);
});
