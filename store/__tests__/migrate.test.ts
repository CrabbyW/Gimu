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
