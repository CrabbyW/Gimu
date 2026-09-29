import { createElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useDb } from '@/store/db';
import { useSettings } from '@/store/settings';
import { useHydrated } from '../useHydrated';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- oficiální jest mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

beforeAll(async () => { await Promise.all([useDb.persist.rehydrate(), useSettings.persist.rehydrate()]); });

const mounted: TestRenderer.ReactTestRenderer[] = [];
const mount = (el: Parameters<typeof TestRenderer.create>[0]) => { mounted.push(TestRenderer.create(el)); };
afterEach(() => { act(() => { mounted.splice(0).forEach((r) => r.unmount()); }); });

function Probe({ onValue }: { onValue: (v: boolean) => void }) {
  onValue(useHydrated());
  return null;
}

test('brána je otevřená jen s hydratovanými daty i nastavením', async () => {
  let last: boolean | undefined;
  const onValue = (v: boolean) => { last = v; };
  act(() => { mount(createElement(Probe, { onValue })); });
  expect(last).toBe(true);

  // Data ještě nenačtená → zavřeno.
  act(() => { useDb.setState({ hydrated: false }); });
  expect(last).toBe(false);
  act(() => { useDb.setState({ hydrated: true }); });
  expect(last).toBe(true);

  // Nastavení ještě nenačtené (téma, dev posun času) → zavřeno.
  act(() => { useSettings.setState({ hydrated: false }); });
  expect(last).toBe(false);
  act(() => { useSettings.setState({ hydrated: true }); });
  expect(last).toBe(true);
});

test('poškozené nastavení v úložišti nezasekne splash: brána se otevře s výchozím tématem', async () => {
  const AsyncStorage = jest.requireMock<{ setItem(k: string, v: string): Promise<void> }>('@react-native-async-storage/async-storage');
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  let last: boolean | undefined;
  act(() => {
    mount(createElement(Probe, { onValue: (v: boolean) => { last = v; } }));
    useSettings.setState({ hydrated: false });
  });
  // Až po setState: persist každou změnu stavu zapisuje do úložiště a poškozená data by přepsal.
  await AsyncStorage.setItem('opice-settings', '{nevalidní json');

  await act(async () => { await useSettings.persist.rehydrate(); });
  expect(last).toBe(true);
  expect(warn).toHaveBeenCalledWith('[settings] hydratace selhala, výchozí nastavení', expect.any(Error));
  expect(useSettings.getState().theme).toBe('system');
  warn.mockRestore();
});

test('po hydrataci nastavení se zvýší revize DB, aby se data načetla s dev posunem času', async () => {
  const before = useDb.getState().revision;
  await act(async () => { await useSettings.persist.rehydrate(); });
  expect(useDb.getState().revision).toBeGreaterThan(before);
});
