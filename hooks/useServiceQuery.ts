import { useCallback, useEffect, useRef, useState } from 'react';
import { useDb } from '@/store/db';

export type Query<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error; retry(): Promise<void> }
  /** `refresh` znovu načte data (stale-while-refetch: zůstává 'ready'); promise se splní, až nový fetch doběhne
   *  (úspěch i chyba), např. pro pull-to-refresh. */
  | { status: 'ready'; data: T; refresh(): Promise<void> };

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
  // Čekající `refresh`/`retry`: splní je nejbližší doběhnutý fetch (i z jiného důvodu, např. revize DB).
  const waiters = useRef<(() => void)[]>([]);
  const settle = useCallback(() => { const w = waiters.current; waiters.current = []; w.forEach((f) => f()); }, []);
  useEffect(() => settle, [settle]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetcher().then((data) => { if (alive) { setState({ status: 'ready', data, key }); settle(); } })
      .catch((e: unknown) => { if (alive) { setState({ status: 'error', error: e instanceof Error ? e : new Error(String(e)), key }); settle(); } });
    return () => { alive = false; };
    // deps je pole závislostí volajícího hooku (např. lessonId); fetcher se
    // úmyslně nevkládá do pole závislostí, protože je to nová funkce při
    // každém renderu — zahrnutí by způsobilo nekonečnou refetch smyčku.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, tick, key, enabled]);

  const again = useCallback(() => new Promise<void>((resolve) => {
    waiters.current.push(resolve);
    setTick((t) => t + 1);
  }), []);

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
