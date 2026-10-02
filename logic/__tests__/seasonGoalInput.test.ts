import { validateSeasonGoal } from '@/logic/season';

test.each([
  [{ kind: 'activeDays', days: 60 }, 'ok'], [{ kind: 'activeDays', days: 0 }, 'daysRange'], [{ kind: 'activeDays', days: 91 }, 'daysRange'],
  [{ kind: 'activeDays', days: 2.5 }, 'daysRange'],
  [{ kind: 'lessons', count: 120 }, 'ok'], [{ kind: 'lessons', count: 0 }, 'countRange'], [{ kind: 'lessons', count: 501 }, 'countRange'],
  [{ kind: 'milestone', label: '15 shybů', target: 15, unit: 'reps', current: 3, start: 3 }, 'ok'],
  [{ kind: 'milestone', label: 'x', target: 0, unit: 'reps', current: 0, start: 0 }, 'targetRange'],
  [{ kind: 'milestone', label: 'x', target: 10, unit: 'reps', current: -1, start: 0 }, 'targetRange'],
  [{ kind: 'weight', deltaKg: -4 }, 'ok'], [{ kind: 'weight', deltaKg: 0 }, 'deltaRange'], [{ kind: 'weight', deltaKg: 31 }, 'deltaRange'],
] as const)('%j → %s', (g, r) => { expect(validateSeasonGoal(g)).toBe(r); });

test('activeDays nad délku sezóny → daysRange', () => {
  expect(validateSeasonGoal({ kind: 'activeDays', days: 60 }, { startDate: '2026-09-28', endDate: '2026-10-27' })).toBe('daysRange');
});
