import { createElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useDb } from '@/store/db';
import { useServiceQuery, type Query } from '../useServiceQuery';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- oficiální jest mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

beforeAll(async () => { await useDb.persist.rehydrate(); });
beforeEach(() => useDb.setState({ profile: null, revision: 0 }));

interface ProbeProps { fetcher: () => Promise<string>; deps: readonly unknown[]; onQuery: (q: Query<string>) => void }
function Probe({ fetcher, deps, onQuery }: ProbeProps) {
  onQuery(useServiceQuery(fetcher, deps));
  return null;
}

test('změna klíče (deps) okamžitě vrátí loading, ne data starého klíče', async () => {
  const fetchA = () => Promise.resolve('lekce-a');
  const fetchB = () => Promise.resolve('lekce-b');
  let last: Query<string> | undefined;
  const onQuery = (q: Query<string>) => { last = q; };

  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(createElement(Probe, { fetcher: fetchA, deps: ['a'], onQuery }));
  });
  expect(last).toMatchObject({ status: 'ready', data: 'lekce-a' });

  act(() => {
    renderer.update(createElement(Probe, { fetcher: fetchB, deps: ['b'], onQuery }));
  });
  // Ihned po změně klíče (ještě před doběhnutím fetche) nesmí vrátit data pro 'a'.
  expect(last!.status).toBe('loading');

  await act(async () => { await Promise.resolve(); });
  expect(last).toMatchObject({ status: 'ready', data: 'lekce-b' });
});

test('bump revize u stejného klíče drží stará data (stale-while-refetch), nepřepne na loading', async () => {
  let call = 0;
  const fetcher = () => Promise.resolve(`data-${++call}`);
  let last: Query<string> | undefined;
  const onQuery = (q: Query<string>) => { last = q; };

  await act(async () => {
    TestRenderer.create(createElement(Probe, { fetcher, deps: [], onQuery }));
  });
  expect(last).toMatchObject({ status: 'ready', data: 'data-1' });

  act(() => { useDb.setState((s) => ({ revision: s.revision + 1 })); });
  // Okamžitě po bumpu revize zůstávají stará data - žádné probliknutí do loading.
  expect(last).toMatchObject({ status: 'ready', data: 'data-1' });

  await act(async () => { await Promise.resolve(); });
  expect(last).toMatchObject({ status: 'ready', data: 'data-2' });
});

test('refresh (pull-to-refresh): znovu zavolá fetcher, drží ready a promise se splní až po doběhnutí', async () => {
  let n = 0;
  let release!: () => void;
  const fetcher = () => {
    n += 1;
    if (n === 1) return Promise.resolve('v1');
    return new Promise<string>((resolve) => { release = () => resolve('v2'); });
  };
  let last: Query<string> | undefined;
  await act(async () => { TestRenderer.create(createElement(Probe, { fetcher, deps: ['k'], onQuery: (q) => { last = q; } })); });
  expect(last).toMatchObject({ status: 'ready', data: 'v1' });
  if (last?.status !== 'ready') throw new Error('není ready');
  let done = false;
  let p!: Promise<void>;
  act(() => { p = (last as { refresh(): Promise<void> }).refresh(); p.then(() => { done = true; }); });
  await act(async () => { await Promise.resolve(); });
  expect(n).toBe(2);
  expect(done).toBe(false);
  expect(last).toMatchObject({ status: 'ready', data: 'v1' });
  await act(async () => { release(); await p; });
  expect(done).toBe(true);
  expect(last).toMatchObject({ status: 'ready', data: 'v2' });
});
