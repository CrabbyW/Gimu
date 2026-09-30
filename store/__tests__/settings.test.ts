jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { migrateSettings } from '@/store/settings';

test('settings v1 → v2 doplní připomínku a stageOverride, zachová téma a posun času', () => {
  expect(migrateSettings({ theme: 'dark', devTimeOffsetMs: 3600_000 })).toEqual({
    theme: 'dark', devTimeOffsetMs: 3600_000, reminderEnabled: false, reminderHour: 18, stageOverride: null,
  });
});
test('poškozené hodnoty → výchozí', () => {
  expect(migrateSettings({ theme: 'neon', devTimeOffsetMs: NaN, reminderHour: 25, stageOverride: 7, reminderEnabled: 'ano' })).toEqual({
    theme: 'system', devTimeOffsetMs: 0, reminderEnabled: false, reminderHour: 18, stageOverride: null,
  });
  expect(migrateSettings(null).theme).toBe('system');
});
