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
  expect(migrateDb({ profile: { path: 'power' } }, DB_VERSION)).toEqual({ profile: null });
});
