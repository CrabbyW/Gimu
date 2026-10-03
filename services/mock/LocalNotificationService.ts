import * as Notifications from 'expo-notifications';
import { copy } from '@/data/copy';
import { now } from '@/lib/clock';
import { notificationsSupported, REMINDER_CHANNEL, REMINDER_ID } from '@/lib/notifications';
import { toISODate } from '@/logic/dates';
import { EXERCISES } from '@/data/exercises';
import { LESSONS_BY_PATH } from '@/data/lessons';
import { EMPTY_DEBT, lessonExtras } from '@/logic/adaptive';
import { estMinutes } from '@/logic/lessonDuration';
import { nextLessonId } from '@/logic/map';
import { activeDays, currentStreak } from '@/logic/streak';
import { useDb } from '@/store/db';
import type { NotificationService } from '../contracts';

const streakNow = () => {
  const p = useDb.getState().profile;
  return p ? currentStreak(activeDays(p.activity), toISODate(now())) : 0;
};

/** Délka další lekce v minutách (včetně navýšení z dluhu) pro „Stačí N minut“; bez profilu / na konci cesty nic. */
const nextLessonMinutes = (): number | undefined => {
  const p = useDb.getState().profile;
  if (!p) return undefined;
  const lessons = LESSONS_BY_PATH[p.path];
  const id = nextLessonId(lessons, new Set(p.activity.map((e) => e.lessonId)));
  const lesson = lessons.find((l) => l.id === id);
  if (!lesson) return undefined;
  const exercises = lesson.exerciseIds.flatMap((eid) => (EXERCISES[eid] ? [EXERCISES[eid]] : []));
  const extras = lessonExtras(exercises, p.trainingDebt ?? EMPTY_DEBT);
  return estMinutes(exercises.map((e, i) => ({ type: e.type, amount: e.amount + (extras[i] ?? 0) })));
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
      content: { title: copy.notifications.title, body: copy.notifications.reminder(streakNow(), nextLessonMinutes()) },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0, channelId: REMINDER_CHANNEL },
    });
  }
  async sendTest(message: string) {
    if (!notificationsSupported) return;
    await Notifications.scheduleNotificationAsync({ content: { title: copy.notifications.title, body: message }, trigger: null });
  }
}
