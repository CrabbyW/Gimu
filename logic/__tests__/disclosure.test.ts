import { DEV_XP_LESSON_ID } from '@/logic/activity';
import { FEATURE_AFTER, featureOpen, lessonsDone, lessonsUntil, streakRisk } from '@/logic/disclosure';

const acts = (n: number) => Array.from({ length: n }, (_, i) => ({ lessonId: `l${i}` }));

test('dev XP se nepočítá jako lekce', () => {
  expect(lessonsDone([{ lessonId: 'a' }, { lessonId: DEV_XP_LESSON_ID }])).toBe(1);
});
test('odemykání podle počtu lekcí; hranice', () => {
  expect(featureOpen('league', acts(FEATURE_AFTER.league - 1), false)).toBe(false);
  expect(featureOpen('league', acts(FEATURE_AFTER.league), false)).toBe(true);
  expect(featureOpen('wardrobe', acts(2), false)).toBe(true);
  expect(featureOpen('season', acts(4), false)).toBe(false);
});
test('starý profil má vše odemčené', () => {
  expect(featureOpen('season', [], true)).toBe(true);
});
test('lessonsUntil', () => {
  expect(lessonsUntil('league', acts(1))).toBe(2);
  expect(lessonsUntil('league', acts(9))).toBe(0);
});
test('streakRisk', () => {
  expect(streakRisk(['2026-10-09'], '2026-10-09', 3)).toBe('done');
  expect(streakRisk(['2026-10-08'], '2026-10-09', 3)).toBe('atRisk');
  expect(streakRisk([], '2026-10-09', 0)).toBe('none');
});
