import * as Notifications from 'expo-notifications';
import { copy } from '@/data/copy';
import { now } from '@/lib/clock';
import { notificationsSupported, REMINDER_CHANNEL, REMINDER_ID } from '@/lib/notifications';
import { toISODate } from '@/logic/dates';
import { activeDays, currentStreak } from '@/logic/streak';
import { useDb } from '@/store/db';
import type { NotificationService } from '../contracts';

const streakNow = () => {
  const p = useDb.getState().profile;
  return p ? currentStreak(activeDays(p.activity), toISODate(now())) : 0;
};

/** Lokální notifikace přes expo-notifications. TODO(fáze 2): serverové push notifikace. */
export class LocalNotificationService implements NotificationService {
  async getPermission() {
    if (!notificationsSupported) return 'denied' as const;
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted' ? 'granted' as const : status === 'denied' ? 'denied' as const : 'undetermined' as const;
  }
  async requestPermission() {
    if (!notificationsSupported) return false;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }
  async setDailyReminder(enabled: boolean, hour: number) {
    if (!notificationsSupported) return;
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => undefined);
    if (!enabled) return;
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_ID,
      content: { title: copy.notifications.title, body: copy.notifications.reminder(streakNow()) },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0, channelId: REMINDER_CHANNEL },
    });
  }
  async sendTest(message: string) {
    if (!notificationsSupported) return;
    await Notifications.scheduleNotificationAsync({ content: { title: copy.notifications.title, body: message }, trigger: null });
  }
}
