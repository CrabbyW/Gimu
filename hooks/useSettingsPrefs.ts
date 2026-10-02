import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { services } from '@/services';
import { useSettings, type ThemePreference } from '@/store/settings';

export type { ThemePreference };
type Permission = 'granted' | 'denied' | 'undetermined';

/** Téma a denní připomínka (spec §7.9). `denied` → přepínač zůstane vypnutý a UI nabídne systémové nastavení. */
export function useSettingsPrefs() {
  const theme = useSettings((s) => s.theme);
  const enabled = useSettings((s) => s.reminderEnabled);
  const hour = useSettings((s) => s.reminderHour);
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
    sendTest: (message: string) => services.notifications.sendTest(message),
    openSystemSettings: () => { Linking.openSettings().catch(() => undefined); },
  };
}
