import type { NotificationService } from '../contracts';
import { notImplemented } from './notImplemented';

/** Plán A: notifikace se nikde v UI nevolají. Plán B nahradí skutečnou implementací (expo-notifications). */
export class LocalNotificationService implements NotificationService {
  getPermission = notImplemented('notifications.getPermission');
  requestPermission = notImplemented('notifications.requestPermission');
  setDailyReminder = notImplemented('notifications.setDailyReminder');
  sendTest = notImplemented('notifications.sendTest');
}
