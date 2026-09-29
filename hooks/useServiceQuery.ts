import { useCallback, useEffect, useState } from 'react';
import { useDb } from '@/store/db';

export type Query<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error; retry(): void }
  | { status: 'ready'; data: T; refresh(): void };

export interface UseServiceQueryOptions {
  /** false = nevolat fetcher a vracet 'loading' (např. dokud není znám pathId). */
  enabled?: boolean;
}

type InternalState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error; key: string }
  | { status: 'ready'; data: T; key: string };

/** Načte data ze service a znovu je načte po každém zápisu do lokální DB.
 *  TODO(fáze 2): nahradit cache vrstvou (TanStack Query); signatura hooků zůstane. */
export function useServiceQuery<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[],
  options?: UseServiceQueryOptions,
): Query<T> {
  const enabled = options?.enabled ?? true;
  const revision = useDb((s) => s.revision);
  const [tick, setTick] = useState(0);
  const key = JSON.stringify(deps);
  const [state, setState] = useState<InternalState<T>>({ status: 'loading' });

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetcher().then((data) => alive && setState({ status: 'ready', data, key }))
      .catch((e: unknown) => alive && setState({ status: 'error', error: e instanceof Error ? e : new Error(String(e)), key }));
    return () => { alive = false; };
    // deps je pole závislostí volajícího hooku (např. lessonId); fetcher se
    // úmyslně nevkládá do pole závislostí, protože je to nová funkce při
    // každém renderu — zahrnutí by způsobilo nekonečnou refetch smyčku.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, tick, key, enabled]);

  const again = useCallback(() => setTick((t) => t + 1), []);

  if (!enabled) return { status: 'loading' };
  // Stav patří jinému klíči (deps se změnily, např. jiné lessonId) → dokud
  // nedorazí nový fetch, je zastaralý a nesmí se ukázat jako 'ready'/'error'.
  // Stale-while-refetch platí jen mezi revizemi/ticky se stejným klíčem.
  if (state.status !== 'loading' && state.key !== key) return { status: 'loading' };
  return state.status === 'ready'
    ? { status: 'ready', data: state.data, refresh: again }
    : state.status === 'error'
      ? { status: 'error', error: state.error, retry: again }
      : state;
}
