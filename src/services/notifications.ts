import PushNotification from 'react-native-push-notification';

const CHANNEL_ID = 'naamjap-reminders';

export const configureNotifications = () => {
  PushNotification.configure({
    onNotification: () => {},
    requestPermissions: true,
  });

  PushNotification.createChannel(
    {
      channelId: CHANNEL_ID,
      channelName: 'Naam Jap Reminders',
      channelDescription: 'Daily reminders for your Naam Jap practice',
      importance: 3,
      vibrate: false,
      soundName: undefined,
    },
    () => {},
  );
};

export const scheduleDailyReminder = (hour: number, minute: number) => {
  PushNotification.cancelAllLocalNotifications();
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  PushNotification.localNotificationSchedule({
    channelId: CHANNEL_ID,
    message: 'Time for Naam Jap',
    date: next,
    repeatType: 'day',
    allowWhileIdle: true,
  });
};

export const cancelDailyReminder = () => {
  PushNotification.cancelAllLocalNotifications();
};
