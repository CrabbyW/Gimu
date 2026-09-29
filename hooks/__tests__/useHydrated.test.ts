import { createElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useDb } from '@/store/db';
import { useSettings } from '@/store/settings';
import { useHydrated } from '../useHydrated';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- oficiální jest mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

beforeAll(async () => { await Promise.all([useDb.persist.rehydrate(), useSettings.persist.rehydrate()]); });

function Probe({ onValue }: { onValue: (v: boolean) => void }) {
  onValue(useHydrated());
  return null;
}

test('brána je otevřená jen s hydratovanými daty i nastavením', async () => {
  let last: boolean | undefined;
  const onValue = (v: boolean) => { last = v; };
  act(() => { TestRenderer.create(createElement(Probe, { onValue })); });
  expect(last).toBe(true);

  // Data ještě nenačtená → zavřeno.
  act(() => { useDb.setState({ hydrated: false }); });
  expect(last).toBe(false);
  act(() => { useDb.setState({ hydrated: true }); });
  expect(last).toBe(true);

  // Probíhající hydratace nastavení (téma, dev posun času) → zavřeno, po jejím konci otevřeno.
  let pending: Promise<void> | void = undefined;
  act(() => { pending = useSettings.persist.rehydrate(); });
  expect(last).toBe(false);
  await act(async () => { await pending; });
  expect(last).toBe(true);
});
