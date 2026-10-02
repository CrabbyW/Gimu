import { copy, czPlural } from '@/data/copy';

test.each([[1, 'den'], [2, 'dny'], [4, 'dny'], [5, 'dní'], [12, 'dní'], [22, 'dní']])('czPlural %i', (n, w) => {
  expect(czPlural(n, 'den', 'dny', 'dní')).toBe(w);
});
test('spec §7.9 text', () => { expect(copy.notifications.reminder(12)).toBe('Opice čeká. Streak 12 dní je v ohrožení 🐒'); });
test('streak 0 nemluví o ohrožení nuly', () => { expect(copy.notifications.reminder(0)).not.toMatch(/0 dní/); });
