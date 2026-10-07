import { useDb } from '@/store/db';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- oficiální jest mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

type AS = { getItem: jest.Mock; setItem: jest.Mock };
const AsyncStorage = jest.requireMock<AS>('@react-native-async-storage/async-storage');
const saved = JSON.stringify({ state: { profile: { name: 'saved' } }, version: 999 });

test('chyba čtení: loadFailed, profil se nepřepíše a nic se nezapíše; retry obnoví', async () => {
  await AsyncStorage.setItem('opice-db', saved);
  AsyncStorage.setItem.mockClear();
  AsyncStorage.getItem.mockImplementationOnce(() => Promise.reject(new Error('disk')));
  await useDb.persist.rehydrate();
  expect(useDb.getState().loadFailed).toBe(true);
  expect(useDb.getState().hydrated).toBe(true);
  useDb.getState().setProfile({ name: 'new' } as never);
  expect(useDb.getState().profile).toBeNull();
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  expect(JSON.parse((await AsyncStorage.getItem('opice-db')) as string).state.profile.name).toBe('saved');

  await useDb.persist.rehydrate();
  expect(useDb.getState().loadFailed).toBe(false);
});
