import { useSyncExternalStore } from 'react';
import { useDb } from '@/store/db';
import { useSettings } from '@/store/settings';

const subscribeSettings = (onChange: () => void) => {
  const offStart = useSettings.persist.onHydrate(onChange);
  const offFinish = useSettings.persist.onFinishHydration(onChange);
  return () => { offStart(); offFinish(); };
};
const settingsHydrated = () => useSettings.persist.hasHydrated();

/** true, až jsou z úložiště načtená data i nastavení. Bez nastavení by první snímek
 *  vykreslil systémové téma místo zvoleného a `now()` by ignoroval dev posun času. */
export function useHydrated(): boolean {
  const db = useDb((s) => s.hydrated);
  const settings = useSyncExternalStore(subscribeSettings, settingsHydrated, settingsHydrated);
  return db && settings;
}
