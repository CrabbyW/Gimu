import { devXpEvent, nextStageOverride, seasonEndOffset, streakLossOffset } from '@/logic/dev';
import { isLessonEvent } from '@/logic/activity';
import { toISODate } from '@/logic/dates';
import { currentStreak, isStreakBroken } from '@/logic/streak';

test('dev XP událost: 500 XP, není lekce, den podle now', () => {
  const e = devXpEvent(500, new Date(2026, 9, 5, 23, 59));
  expect(e).toMatchObject({ xp: 500, day: '2026-10-05', lessonId: 'dev-xp' });
  expect(isLessonEvent(e)).toBe(false);
});
test('skok na konec sezóny: now() = 27. 12. 09:00 místního času (přes DST hranici)', () => {
  const real = new Date(2026, 9, 5, 14, 30);
  const off = seasonEndOffset({ startDate: '2026-09-28', endDate: '2026-12-26' }, real);
  const shifted = new Date(real.getTime() + off);
  expect(toISODate(shifted)).toBe('2026-12-27');
  expect(shifted.getHours()).toBe(9);
});
test('ztráta streaku: +2 dny od současného posunu → streak 0, broken', () => {
  const off = streakLossOffset(0);
  expect(off).toBe(2 * 86_400_000);
  expect(streakLossOffset(off)).toBe(4 * 86_400_000);
  const today = toISODate(new Date(new Date(2026, 9, 5, 12).getTime() + off));
  expect(currentStreak(['2026-10-04', '2026-10-05'], today)).toBe(0);
  expect(isStreakBroken(['2026-10-04', '2026-10-05'], today)).toBe(true);
});
test('stage override cyklus', () => {
  expect([null, 1, 2, 3].map((s) => nextStageOverride(s as never))).toEqual([1, 2, 3, null]);
});
