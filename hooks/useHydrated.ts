import { useDb } from '@/store/db';
import { useSettings } from '@/store/settings';

/** true, až skončila hydratace dat i nastavení (i neúspěšná — store pak má výchozí hodnoty).
 *  Bez nastavení by první snímek vykreslil systémové téma místo zvoleného a `now()`
 *  by ignoroval dev posun času. */
export function useHydrated(): boolean {
  const db = useDb((s) => s.hydrated);
  const settings = useSettings((s) => s.hydrated);
  return db && settings;
}
