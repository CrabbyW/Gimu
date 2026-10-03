import { migrateSettings } from '@/store/settings';
// eslint-disable-next-line @typescript-eslint/no-require-imports -- oficiální jest mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

test('settings v1 → v2 doplní připomínku a stageOverride, zachová téma a posun času', () => {
  expect(migrateSettings({ theme: 'dark', devTimeOffsetMs: 3600_000 })).toEqual({
    theme: 'dark', devTimeOffsetMs: 3600_000, reminderEnabled: false, reminderHour: 18, stageOverride: null, hapticsEnabled: true, soundEnabled: true,
  });
});
test('poškozené hodnoty → výchozí', () => {
  expect(migrateSettings({ theme: 'neon', devTimeOffsetMs: NaN, reminderHour: 25, stageOverride: 7, reminderEnabled: 'ano', hapticsEnabled: 1 })).toEqual({
    theme: 'system', devTimeOffsetMs: 0, reminderEnabled: false, reminderHour: 18, stageOverride: null, hapticsEnabled: true, soundEnabled: true,
  });
  expect(migrateSettings(null).theme).toBe('system');
});
test('v2 → v3 zachová vypnutou haptiku i zvuk nezávisle', () => {
  expect(migrateSettings({ theme: 'dark', hapticsEnabled: false, soundEnabled: true })).toMatchObject({ hapticsEnabled: false, soundEnabled: true });
  expect(migrateSettings({ theme: 'dark', hapticsEnabled: true, soundEnabled: false })).toMatchObject({ hapticsEnabled: true, soundEnabled: false });
});
