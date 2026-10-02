import { useEffect } from 'react';
import { configureNotifications } from '@/lib/notifications';
import { services } from '@/services';
import { useSettings } from '@/store/settings';
import { useProfile } from './useProfile';
import { useProfileStats } from './useProfileStats';

/** Root layout: nastaví notifikace a při změně streaku přeplánuje zapnutou připomínku (text nese aktuální streak). */
export function useReminderSync() {
  useEffect(() => { configureNotifications(); }, []);
  const profile = useProfile();
  const stats = useProfileStats(profile.status === 'ready' ? profile.data : null);
  const enabled = useSettings((s) => s.reminderEnabled);
  const hour = useSettings((s) => s.reminderHour);
  const streak = stats?.streak;
  useEffect(() => {
    if (!enabled || streak === undefined) return;
    services.notifications.setDailyReminder(true, hour).catch(() => undefined);
  }, [enabled, hour, streak]);
}
