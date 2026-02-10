import notifee, {
  AndroidImportance,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';

const CHANNEL_ID_SOUND = 'naamjap-reminders';
const CHANNEL_ID_SILENT = 'naamjap-reminders-silent';
const DAILY_TRIGGER_ID = 'naamjap-daily-reminder';

export const configureNotifications = async () => {
  await notifee.requestPermission();

  await notifee.createChannel({
    id: CHANNEL_ID_SOUND,
    name: 'Naam Jap Reminders',
    description: 'Daily reminders for your Naam Jap practice',
    importance: AndroidImportance.DEFAULT,
    vibration: false,
  });

  await notifee.createChannel({
    id: CHANNEL_ID_SILENT,
    name: 'Naam Jap Reminders (Silent)',
    description: 'Silent reminders for your Naam Jap practice',
    importance: AndroidImportance.LOW,
    vibration: false,
    sound: undefined,
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
        channelId: CHANNEL_ID_SOUND,
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

export type ReminderWindow = {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
};

export type ReminderTime = {
  hour: number;
  minute: number;
};

const buildTimesForWindow = (
  window: ReminderWindow,
  intervalMinutes: number,
) => {
  const start = window.startHour * 60 + window.startMinute;
  const end = window.endHour * 60 + window.endMinute;
  const times: Array<{ hour: number; minute: number }> = [];
  for (let minutes = start; minutes < end; minutes += intervalMinutes) {
    const hour = Math.floor(minutes / 60) % 24;
    const minute = minutes % 60;
    times.push({ hour, minute });
  }
  return times;
};

export const scheduleIntervalReminders = async (
  intervalMinutes: number,
  windows: ReminderWindow[],
  soundEnabled: boolean,
) => {
  const now = new Date();
  const times = windows.flatMap(window =>
    buildTimesForWindow(window, intervalMinutes),
  );
  const channelId = soundEnabled ? CHANNEL_ID_SOUND : CHANNEL_ID_SILENT;
  const ids: string[] = [];

  for (let index = 0; index < times.length; index += 1) {
    const { hour, minute } = times[index];
    const next = new Date();
    next.setHours(hour, minute, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    const id = `naamjap-interval-${String(hour).padStart(2, '0')}${String(
      minute,
    ).padStart(2, '0')}-${index}`;
    ids.push(id);
    await notifee.createTriggerNotification(
      {
        id,
        title: 'Naam Jap',
        body: 'Time for Naam Jap',
        android: {
          channelId,
          pressAction: { id: 'default' },
        },
        ios: {
          sound: soundEnabled ? 'default' : undefined,
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: next.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      },
    );
  }

  return ids;
};

export const cancelIntervalReminders = async (ids: string[]) => {
  await Promise.all(ids.map(id => notifee.cancelTriggerNotification(id)));
};

export const scheduleCustomTimeReminders = async (
  times: ReminderTime[],
  soundEnabled: boolean,
) => {
  const now = new Date();
  const channelId = soundEnabled ? CHANNEL_ID_SOUND : CHANNEL_ID_SILENT;
  const ids: string[] = [];

  for (let index = 0; index < times.length; index += 1) {
    const { hour, minute } = times[index];
    const next = new Date();
    next.setHours(hour, minute, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    const id = `naamjap-custom-${String(hour).padStart(2, '0')}${String(
      minute,
    ).padStart(2, '0')}-${index}`;
    ids.push(id);
    await notifee.createTriggerNotification(
      {
        id,
        title: 'Naam Jap',
        body: 'Time for Naam Jap',
        android: {
          channelId,
          pressAction: { id: 'default' },
        },
        ios: {
          sound: soundEnabled ? 'default' : undefined,
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: next.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      },
    );
  }

  return ids;
};

export const cancelCustomTimeReminders = async (ids: string[]) => {
  await Promise.all(ids.map(id => notifee.cancelTriggerNotification(id)));
};
