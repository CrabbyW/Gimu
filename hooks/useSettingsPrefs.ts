import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { services } from '@/services';
import { useSettings, type ThemePreference } from '@/store/settings';

export type { ThemePreference };
type Permission = 'granted' | 'denied' | 'undetermined';

/** Hodiny, které `setHour` přijme (5–22): zdroj voleb kola v Nastavení i v onboardingu. */
export const REMINDER_HOURS: readonly number[] = Array.from({ length: 22 - 5 + 1 }, (_, i) => 5 + i);

/** Téma, denní připomínka (spec §7.9) a přepínače haptiky a zvuku. `denied` → přepínač zůstane vypnutý a UI nabídne systémové nastavení. */
export function useSettingsPrefs() {
  const theme = useSettings((s) => s.theme);
  const enabled = useSettings((s) => s.reminderEnabled);
  const hour = useSettings((s) => s.reminderHour);
  const hapticsEnabled = useSettings((s) => s.hapticsEnabled);
  const soundEnabled = useSettings((s) => s.soundEnabled);
  const [permission, setPermission] = useState<Permission>('undetermined');

  useEffect(() => { services.notifications.getPermission().then(setPermission).catch(() => setPermission('denied')); }, []);

  const setEnabled = useCallback(async (on: boolean) => {
    if (on) {
      let p = await services.notifications.getPermission();
      if (p === 'undetermined') p = (await services.notifications.requestPermission()) ? 'granted' : 'denied';
      setPermission(p);
      if (p !== 'granted') return;
    }
    useSettings.getState().setReminderEnabled(on);
    await services.notifications.setDailyReminder(on, useSettings.getState().reminderHour);
  }, []);

  const setHour = useCallback(async (h: number) => {
    const clamped = Math.min(22, Math.max(5, h));
    useSettings.getState().setReminderHour(clamped);
    if (useSettings.getState().reminderEnabled) await services.notifications.setDailyReminder(true, clamped);
  }, []);

  return {
    theme, setTheme: (t: ThemePreference) => useSettings.getState().setTheme(t),
    enabled, hour, permission, setEnabled, setHour,
    // Odezva (motion spec §6.2): dva nezávislé přepínače.
    hapticsEnabled, setHapticsEnabled: (on: boolean) => useSettings.getState().setHapticsEnabled(on),
    soundEnabled, setSoundEnabled: (on: boolean) => useSettings.getState().setSoundEnabled(on),
    sendTest: (message: string) => services.notifications.sendTest(message),
    openSystemSettings: () => { Linking.openSettings().catch(() => undefined); },
  };
}
