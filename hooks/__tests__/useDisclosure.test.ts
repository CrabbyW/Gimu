import { disclosureOf } from '@/hooks/useDisclosure';
import { returnLineOf } from '@/hooks/useReturnLine';
import { copy } from '@/data/copy';
import { DEV_XP_LESSON_ID } from '@/logic/activity';
import type { LessonPathView } from '@/services/contracts';
import type { ActivityEvent } from '@/types';
/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mock knihovny */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

const ev = (i: number, day = '2026-10-01', lessonId = `l-${i}`): ActivityEvent =>
  ({ id: `e-${i}`, at: `${day}T10:00:00.000Z`, day, lessonId, xp: 10 }) as ActivityEvent;
const lessons = (n: number) => Array.from({ length: n }, (_, i) => ev(i));

describe('disclosureOf (UX pass U4)', () => {
  test('bez profilu: nenačteno, vše otevřené (tab bar nebliká zámkem)', () => {
    const d = disclosureOf(null);
    expect(d.ready).toBe(false);
    expect(d.gate('league').open).toBe(true);
  });

  test('nováček (guideSeen): liga zamčená, zbývají 3 lekce; šatník po 2, sezóna po 5', () => {
    const d = disclosureOf({ activity: [], guideSeen: [] });
    expect(d.gate('league')).toEqual({ open: false, left: 3, done: 0, need: 3 });
    expect(d.gate('wardrobe').left).toBe(2);
    expect(d.gate('season').left).toBe(5);
  });

  test('po 3 lekcích liga odemčená, sezóna stále zamčená (zbývají 2)', () => {
    const d = disclosureOf({ activity: lessons(3), guideSeen: ['mapStart'] });
    expect(d.gate('league').open).toBe(true);
    expect(d.gate('wardrobe').open).toBe(true);
    expect(d.gate('season')).toEqual({ open: false, left: 2, done: 3, need: 5 });
  });

  test('dev XP se do odemčení nepočítá', () => {
    const d = disclosureOf({ activity: [ev(1, '2026-10-01', DEV_XP_LESSON_ID), ev(2, '2026-10-01', DEV_XP_LESSON_ID), ev(3, '2026-10-01', DEV_XP_LESSON_ID)], guideSeen: [] });
    expect(d.gate('league').open).toBe(false);
  });

  test('legacy profil (bez guideSeen) má vše otevřené i bez lekcí', () => {
    const d = disclosureOf({ activity: [] });
    expect(d.gate('league').open).toBe(true);
    expect(d.gate('season').open).toBe(true);
    expect(d.gate('wardrobe').left).toBe(0);
  });

  test('a11y zamčeného tabu a dlaždice', () => {
    expect(copy.disclosure.tabA11y('League', 3)).toBe('League, locked, unlocks after 3 more lessons');
    expect(copy.disclosure.tabA11y('Season', 1)).toBe('Season, locked, unlocks after 1 more lesson');
    expect(copy.disclosure.unlocksIn(2)).toBe('Unlocks after 2 more lessons');
  });
});

const view: LessonPathView = {
  path: { id: 'p', name: 'P', tagline: '', sections: [] },
  currentLessonId: 'b',
  sections: [{ index: 1, title: 'S', nodes: [
    { lesson: { id: 'a', title: 'Wall push-ups' }, state: 'done' },
    { lesson: { id: 'b', title: 'Knee push-ups' }, state: 'current' },
  ] }],
} as unknown as LessonPathView;

describe('returnLineOf (řádek Next / série)', () => {
  test('bez historie: jen Next, série none', () => {
    expect(returnLineOf({ activity: [] }, view, { b: 6 }, '2026-10-09')).toEqual({ next: { title: 'Knee push-ups', minutes: 6 }, risk: 'none' });
  });
  test('včera cvičil, dnes ne: atRisk', () => {
    expect(returnLineOf({ activity: [ev(1, '2026-10-08')] }, view, { b: 6 }, '2026-10-09').risk).toBe('atRisk');
  });
  test('dnes hotovo: done', () => {
    expect(returnLineOf({ activity: [ev(1, '2026-10-09')] }, view, { b: 6 }, '2026-10-09').risk).toBe('done');
  });
  test('bez aktuální lekce nebo minut: next null', () => {
    expect(returnLineOf({ activity: [] }, { ...view, currentLessonId: null }, { b: 6 }, '2026-10-09').next).toBeNull();
    expect(returnLineOf({ activity: [] }, view, {}, '2026-10-09').next).toBeNull();
  });
  test('copy: věty sentence case, minuty s NBSP', () => {
    expect(copy.returnLine.next('Knee push-ups', 6)).toBe('Next: Knee push-ups · 6 min');
    expect(copy.returnLine.atRisk).toBe('Streak ends tonight.');
    expect(copy.returnLine.done).toBe('Done today · see you tomorrow.');
  });
});
