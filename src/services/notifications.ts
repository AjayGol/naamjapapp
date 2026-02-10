import notifee, {
  AndroidImportance,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';

const CHANNEL_ID = 'naamjap-reminders';
const DAILY_TRIGGER_ID = 'naamjap-daily-reminder';

export const configureNotifications = async () => {
  await notifee.requestPermission();

  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Naam Jap Reminders',
    description: 'Daily reminders for your Naam Jap practice',
    importance: AndroidImportance.DEFAULT,
    vibration: false,
  });
};

export const scheduleDailyReminder = async (hour: number, minute: number) => {
  await notifee.cancelTriggerNotification(DAILY_TRIGGER_ID);

  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  await notifee.createTriggerNotification(
    {
      id: DAILY_TRIGGER_ID,
      title: 'Naam Jap',
      body: 'Time for Naam Jap',
      android: {
        channelId: CHANNEL_ID,
        pressAction: { id: 'default' },
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: next.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
    },
  );
};

export const cancelDailyReminder = async () => {
  await notifee.cancelTriggerNotification(DAILY_TRIGGER_ID);
};
