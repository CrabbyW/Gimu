import { LESSONS_BY_PATH } from '@/data/lessons';
import { nextLessonId, nodeStates } from '@/logic/map';

const lessons = LESSONS_BY_PATH.bodyControl;
test('nový uživatel: první current, zbytek locked', () => {
  const s = nodeStates(lessons, new Set());
  expect(s.get('bc-1-1')).toBe('current');
  expect([...s.values()].filter((v) => v === 'locked')).toHaveLength(8);
});
test('po dvou lekcích je třetí current', () => {
  const s = nodeStates(lessons, new Set(['bc-1-1', 'bc-1-2']));
  expect(s.get('bc-1-2')).toBe('done'); expect(s.get('bc-1-3')).toBe('current'); expect(s.get('bc-1-boss')).toBe('locked');
});
test('boss je current až po všech 8', () => {
  const done = new Set(lessons.filter((l) => !l.isBoss).map((l) => l.id));
  expect(nodeStates(lessons, done).get('bc-1-boss')).toBe('current');
});
test('vše hotovo: žádný current, next = null', () => {
  const all = new Set(lessons.map((l) => l.id));
  expect([...nodeStates(lessons, all).values()].every((v) => v === 'done')).toBe(true);
  expect(nextLessonId(lessons, all)).toBeNull();
});
test('neřazený vstup se seřadí podle order', () => {
  expect(nextLessonId([...lessons].reverse(), new Set())).toBe('bc-1-1');
});
