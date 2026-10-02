import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const REMINDER_ID = 'opice-daily';
export const REMINDER_CHANNEL = 'reminders';
/** Web plánování lokálních notifikací nepodporuje: služba tam hlásí „denied“ a nic neplánuje. */
export const notificationsSupported = Platform.OS !== 'web';

let configured = false;
/** Jednou v root layoutu: zobrazení v popředí a Android kanál. */
export function configureNotifications() {
  if (configured || !notificationsSupported) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, { name: 'Připomínky', importance: Notifications.AndroidImportance.DEFAULT }).catch(() => undefined);
  }
}
