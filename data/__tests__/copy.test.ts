import { copy, czPlural } from '@/data/copy';

test.each([[1, 'den'], [2, 'dny'], [4, 'dny'], [5, 'dní'], [12, 'dní'], [22, 'dní']])('czPlural %i', (n, w) => {
  expect(czPlural(n, 'den', 'dny', 'dní')).toBe(w);
});
// Teplá litina §3.7: tichý tón bez emoji (nahrazuje původní text spec §7.9 s 🐒).
test('Teplá litina §3.7 text', () => { expect(copy.notifications.reminder(12)).toBe('Opice čeká na dnešní lekci. Série 12 dní.'); });
test('streak 0 nemluví o nule a nabídne délku lekce', () => {
  expect(copy.notifications.reminder(0)).not.toMatch(/0 dní/);
  expect(copy.notifications.reminder(0, 5)).toBe('Opice čeká na dnešní lekci. Stačí 5 minut.');
});
test('notifikace bez emoji', () => {
  expect(copy.notifications.reminder(3)).not.toMatch(/\p{Extended_Pictographic}/u);
  expect(copy.notifications.reminder(0)).not.toMatch(/\p{Extended_Pictographic}/u);
});
