import { buildInitialProfile } from '@/logic/onboarding';
import { DB_VERSION, migrateDb } from '@/store/migrate';

test('aktuální verze projde beze změny', () => {
  const s = { profile: null };
  expect(migrateDb(s, DB_VERSION)).toEqual(s);
});

test('neznámá budoucí verze nebo nesmysl → čistý stav', () => {
  expect(migrateDb({ foo: 1 }, DB_VERSION + 5)).toEqual({ profile: null });
  expect(migrateDb('garbage', 0)).toEqual({ profile: null });
});

test('profil bez pole activity se zahodí (poškozená data)', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  expect(migrateDb({ profile: { path: 'power' } }, DB_VERSION)).toEqual({ profile: null });
  warn.mockRestore();
});

test('platný profil přežije migraci beze změny (aktuální i verze 0)', () => {
  const p = buildInitialProfile(
    { path: 'strength', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } },
    new Date(2026, 8, 29, 10),
  );
  expect(migrateDb({ profile: p }, DB_VERSION)).toEqual({ profile: p });
  expect(migrateDb({ profile: p }, 0)).toEqual({ profile: p });
});

test('profil s neplatnou cestou (path mimo PathId) se zahodí', () => {
  const p = buildInitialProfile(
    { path: 'strength', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } },
    new Date(2026, 8, 29, 10),
  );
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  expect(migrateDb({ profile: { ...p, path: 'nonsense' } }, DB_VERSION)).toEqual({ profile: null });
  warn.mockRestore();
});

test('profil s weightGoal: null se zahodí', () => {
  const p = buildInitialProfile(
    { path: 'strength', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } },
    new Date(2026, 8, 29, 10),
  );
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  expect(migrateDb({ profile: { ...p, weightGoal: null } }, DB_VERSION)).toEqual({ profile: null });
  warn.mockRestore();
});

test('profil s weightGoal kind lose bez platných startKg/targetKg se zahodí', () => {
  const p = buildInitialProfile(
    { path: 'strength', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } },
    new Date(2026, 8, 29, 10),
  );
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  expect(migrateDb({ profile: { ...p, weightGoal: { kind: 'lose', startKg: 'x', targetKg: 70 } } }, DB_VERSION))
    .toEqual({ profile: null });
  warn.mockRestore();
});

test('profil s weights/owned/milestones jako ne-pole se zahodí', () => {
  const p = buildInitialProfile(
    { path: 'strength', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } },
    new Date(2026, 8, 29, 10),
  );
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  expect(migrateDb({ profile: { ...p, weights: 'x' } }, DB_VERSION)).toEqual({ profile: null });
  expect(migrateDb({ profile: { ...p, owned: 'x' } }, DB_VERSION)).toEqual({ profile: null });
  expect(migrateDb({ profile: { ...p, milestones: 'x' } }, DB_VERSION)).toEqual({ profile: null });
  warn.mockRestore();
});

test('profil s equipped/seasonGoals jako ne-objekt se zahodí', () => {
  const p = buildInitialProfile(
    { path: 'strength', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } },
    new Date(2026, 8, 29, 10),
  );
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  expect(migrateDb({ profile: { ...p, equipped: 'x' } }, DB_VERSION)).toEqual({ profile: null });
  expect(migrateDb({ profile: { ...p, seasonGoals: null } }, DB_VERSION)).toEqual({ profile: null });
  warn.mockRestore();
});

test('profil s leagueTier jako ne-string se zahodí', () => {
  const p = buildInitialProfile(
    { path: 'strength', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } },
    new Date(2026, 8, 29, 10),
  );
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  expect(migrateDb({ profile: { ...p, leagueTier: 42 } }, DB_VERSION)).toEqual({ profile: null });
  warn.mockRestore();
});

test('zahození poškozeného profilu zaloguje warning', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  migrateDb({ profile: { path: 'power' } }, DB_VERSION);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('poškozený profil'));
  warn.mockRestore();
});

const validV1Profile = (() => {
  const { leagueWeek: _lw, lastLeagueResult: _lr, badges: _b, seasonClaims: _sc, ...v1 } = buildInitialProfile(
    { path: 'strength', dreamBody: 'Mít sílu. Zvednout vlastní váhu.', milestones: [], weightGoal: { kind: 'none' } },
    new Date(2026, 8, 29, 10),
  );
  return v1;
})();
const validV2Profile = { ...validV1Profile, leagueWeek: '2026-09-28', lastLeagueResult: null, badges: [], seasonClaims: {} };

test('v1 → v2 doplní leagueWeek (pondělí týdne založení), badges, seasonClaims, lastLeagueResult', () => {
  const v1 = { profile: { ...validV1Profile, createdAt: '2026-09-30T10:00:00.000Z' } };
  const { profile } = migrateDb(v1, 1);
  expect(profile).toMatchObject({ leagueWeek: '2026-09-28', badges: [], seasonClaims: {}, lastLeagueResult: null });
});
test('v1 → v2 zachová všechna v1 pole (dreamBody věta, milníky, váhy, aktivita)', () => {
  const v1 = {
    ...validV1Profile,
    milestones: [{ id: 'm1', label: 'Shyby', target: 10, unit: 'reps' as const, current: 3, custom: false }],
    weights: [{ weekStart: '2026-09-21', kg: 80 }],
    activity: [{ id: 'a1', at: '2026-09-29T08:00:00.000Z', day: '2026-09-29', lessonId: 'st-1-1', xp: 32 }],
    owned: ['acc-headband'], equipped: { accessory: 'acc-headband' }, leagueTier: 'stone',
  };
  const { profile } = migrateDb({ profile: v1 }, 1);
  expect(profile).toMatchObject(v1);
});
test('v1 milestone cíl sezóny dostane start = current', () => {
  const goal = { kind: 'milestone', label: '15 shybů', target: 15, unit: 'reps', current: 4 };
  const { profile } = migrateDb({ profile: { ...validV1Profile, seasonGoals: { 'winter-arc-2026': goal } } }, 1);
  expect(profile?.seasonGoals['winter-arc-2026']).toEqual({ ...goal, start: 4 });
});
test('equipped s neznámým id se zahodí', () => {
  const { profile } = migrateDb({ profile: { ...validV2Profile, equipped: { outfit: 'neexistuje', accessory: 'acc-headband' }, owned: ['acc-headband'] } }, 2);
  expect(profile?.equipped).toEqual({ accessory: 'acc-headband' });
});
test('v2 profil bez nových polí se zahodí', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  expect(migrateDb({ profile: validV1Profile }, 2)).toEqual({ profile: null });
  warn.mockRestore();
});
