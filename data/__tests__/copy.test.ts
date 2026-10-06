import { copy, plural } from '@/data/copy';

test.each([[0, 'days'], [1, 'day'], [2, 'days'], [5, 'days'], [21, 'days']])('plural %i', (n, w) => {
  expect(plural(n, 'day', 'days')).toBe(w);
});
// Teplá litina §3.7: tichý tón bez emoji.
test('Teplá litina §3.7 text', () => { expect(copy.notifications.reminder(12)).toBe('Your monkey is waiting for today’s lesson. Streak: 12 days.'); });
test('streak 0 nemluví o nule a nabídne délku lekce', () => {
  expect(copy.notifications.reminder(0)).not.toMatch(/0\s*days/);
  expect(copy.notifications.reminder(0, 5)).toBe('Your monkey is waiting for today’s lesson. Just 5 minutes.');
  expect(copy.notifications.reminder(1)).toMatch(/1 day\./);
});
test('notifikace bez emoji', () => {
  expect(copy.notifications.reminder(3)).not.toMatch(/\p{Extended_Pictographic}/u);
  expect(copy.notifications.reminder(0)).not.toMatch(/\p{Extended_Pictographic}/u);
});
