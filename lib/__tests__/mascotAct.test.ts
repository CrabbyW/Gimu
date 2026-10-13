import { canStart, IDLE_GATE, idleMayStart, PRIO } from '@/lib/mascotAct';

test('nic neběží: smí cokoli', () => {
  expect(canStart(IDLE_GATE, 0, PRIO.idle)).toBe(true);
});

test('jedna akce najednou: idle nepřeruší běžící akci ani akci od uživatele', () => {
  const g = { until: 5000, prio: PRIO.idle };
  expect(canStart(g, 1000, PRIO.idle)).toBe(false);
  expect(canStart({ until: 5000, prio: PRIO.user }, 1000, PRIO.idle)).toBe(false);
  // Po doběhnutí smí.
  expect(canStart(g, 5000, PRIO.idle)).toBe(true);
});

test('ťuknutí přeruší idle, oslava přeruší cokoli, stejná priorita čeká', () => {
  expect(canStart({ until: 5000, prio: PRIO.idle }, 1000, PRIO.user)).toBe(true);
  expect(canStart({ until: 5000, prio: PRIO.user }, 1000, PRIO.user)).toBe(false);
  expect(canStart({ until: 5000, prio: PRIO.user }, 1000, PRIO.moment)).toBe(true);
});

test('idle na mapě jen zaostřená, bez omezení pohybu, mimo sekvenci mapy a jinou akci', () => {
  const ok = { focused: true, reduced: false, blocked: false, busy: false };
  expect(idleMayStart(ok)).toBe(true);
  expect(idleMayStart({ ...ok, blocked: true })).toBe(false);
  expect(idleMayStart({ ...ok, busy: true })).toBe(false);
  expect(idleMayStart({ ...ok, focused: false })).toBe(false);
  expect(idleMayStart({ ...ok, reduced: true })).toBe(false);
});
