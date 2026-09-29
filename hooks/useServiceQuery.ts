import { useCallback, useEffect, useState } from 'react';
import { useDb } from '@/store/db';

export type Query<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error; retry(): void }
  | { status: 'ready'; data: T; refresh(): void };

/** Načte data ze service a znovu je načte po každém zápisu do lokální DB.
 *  TODO(fáze 2): nahradit cache vrstvou (TanStack Query); signatura hooků zůstane. */
export function useServiceQuery<T>(fetcher: () => Promise<T>, deps: readonly unknown[]): Query<T> {
  const revision = useDb((s) => s.revision);
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<{ status: 'loading' } | { status: 'error'; error: Error } | { status: 'ready'; data: T }>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    fetcher().then((data) => alive && setState({ status: 'ready', data }))
      .catch((e: unknown) => alive && setState({ status: 'error', error: e instanceof Error ? e : new Error(String(e)) }));
    return () => { alive = false; };
    // deps je pole závislostí volajícího hooku (např. lessonId); fetcher se
    // úmyslně nevkládá do pole závislostí, protože je to nová funkce při
    // každém renderu — zahrnutí by způsobilo nekonečný refetch smyčku.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, tick, ...deps]);
  const again = useCallback(() => setTick((t) => t + 1), []);
  return state.status === 'ready' ? { ...state, refresh: again } : state.status === 'error' ? { ...state, retry: again } : state;
}
