import { DEV_XP_LESSON_ID, isLessonEvent, lessonEventsBetween, xpBetween } from '@/logic/activity';

const ev = (day: string, lessonId: string, xp: number) => ({ id: `${day}-${lessonId}`, at: `${day}T10:00:00.000Z`, day, lessonId, xp });
const events = [ev('2026-09-28', 'bc-1-1', 30), ev('2026-09-29', DEV_XP_LESSON_ID, 500), ev('2026-10-05', 'bc-1-2', 22)];

test('dev-xp není lekce', () => {
  expect(isLessonEvent({ lessonId: DEV_XP_LESSON_ID })).toBe(false);
  expect(isLessonEvent({ lessonId: 'bc-1-1' })).toBe(true);
});
test('lekce v rozsahu včetně hranic, bez dev-xp', () => {
  expect(lessonEventsBetween(events, '2026-09-28', '2026-10-04').map((e) => e.lessonId)).toEqual(['bc-1-1']);
});
test('XP v rozsahu počítá i dev-xp (XP je XP)', () => {
  expect(xpBetween(events, '2026-09-28', '2026-10-04')).toBe(530);
});
