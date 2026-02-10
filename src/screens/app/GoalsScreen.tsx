import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Switch,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppHeader,
  Screen,
  Text,
  Divider,
  Icon,
  Button,
} from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import {
  cancelCustomTimeReminders,
  cancelIntervalReminders,
  scheduleIntervalReminders,
  scheduleCustomTimeReminders,
  type ReminderWindow,
  type ReminderTime,
} from '../../services/notifications';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';

type WindowOption = {
  id: string;
  label: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
};

export const GoalsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const intervalOptions = useMemo(() => [15, 30, 45, 60, 90, 120], []);
  const windowOptions = useMemo<WindowOption[]>(
    () => [
      {
        id: '6-9',
        label: '6 am to 9 am',
        startHour: 6,
        startMinute: 0,
        endHour: 9,
        endMinute: 0,
      },
      {
        id: '9-12',
        label: '9 am to 12 pm',
        startHour: 9,
        startMinute: 0,
        endHour: 12,
        endMinute: 0,
      },
      {
        id: '12-15',
        label: '12 pm to 3 pm',
        startHour: 12,
        startMinute: 0,
        endHour: 15,
        endMinute: 0,
      },
      {
        id: '15-18',
        label: '3 pm to 6 pm',
        startHour: 15,
        startMinute: 0,
        endHour: 18,
        endMinute: 0,
      },
      {
        id: '18-21',
        label: '6 pm to 9 pm',
        startHour: 18,
        startMinute: 0,
        endHour: 21,
        endMinute: 0,
      },
      {
        id: '21-24',
        label: '9 pm to 12 am',
        startHour: 21,
        startMinute: 0,
        endHour: 24,
        endMinute: 0,
      },
      {
        id: '0-4',
        label: '12 am to 4 am',
        startHour: 0,
        startMinute: 0,
        endHour: 4,
        endMinute: 0,
      },
    ],
    [],
  );
  const defaultActive = useMemo(
    () => windowOptions.slice(0, 5).map(option => option.id),
    [windowOptions],
  );

  const [reminderInterval, setReminderInterval] = useState(15);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeWindows, setActiveWindows] = useState<string[]>(defaultActive);
  const [reminderMode, setReminderMode] = useState<'interval' | 'custom'>(
    'interval',
  );
  const [intervalPickerVisible, setIntervalPickerVisible] = useState(false);
  const [customTimePickerVisible, setCustomTimePickerVisible] = useState(false);
  const [customTimeDraft, setCustomTimeDraft] = useState(() => {
    const date = new Date();
    date.setHours(8, 0, 0, 0);
    return date;
  });
  const [customTimes, setCustomTimes] = useState<ReminderTime[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    const load = async () => {
      const [intervalRaw, windowsRaw, soundRaw, customTimesRaw, modeRaw] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.reminderInterval),
          AsyncStorage.getItem(STORAGE_KEYS.reminderActiveWindows),
          AsyncStorage.getItem(STORAGE_KEYS.reminderSoundEnabled),
          AsyncStorage.getItem(STORAGE_KEYS.reminderCustomTimes),
          AsyncStorage.getItem(STORAGE_KEYS.reminderMode),
        ]);

      if (intervalRaw) {
        const parsed = Number(intervalRaw);
        if (!Number.isNaN(parsed)) setReminderInterval(parsed);
      }
      if (windowsRaw) {
        const parsed = JSON.parse(windowsRaw) as string[];
        if (Array.isArray(parsed) && parsed.length) {
          setActiveWindows(parsed);
        }
      } else {
        setActiveWindows(defaultActive);
      }
      if (soundRaw) {
        setSoundEnabled(soundRaw === 'true');
      }
      if (customTimesRaw) {
        const parsed = JSON.parse(customTimesRaw) as ReminderTime[];
        if (Array.isArray(parsed)) {
          setCustomTimes(parsed);
        }
      }
      if (modeRaw === 'custom' || modeRaw === 'interval') {
        setReminderMode(modeRaw);
      }
    };
    load();
  }, [defaultActive]);

  const toggleWindow = useCallback((id: string) => {
    setActiveWindows(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id],
    );
  }, []);

  const handleSetReminder = useCallback(async () => {
    setStatusMessage('');
    setStatusError('');
    if (reminderMode === 'interval' && !activeWindows.length) {
      setStatusError('Select at least one active time block.');
      return;
    }
    if (reminderMode === 'custom' && !customTimes.length) {
      setStatusError('Add at least one custom time.');
      return;
    }

    const storedIdsRaw = await AsyncStorage.getItem(STORAGE_KEYS.reminderIds);
    if (storedIdsRaw) {
      const storedIds = JSON.parse(storedIdsRaw) as string[];
      if (Array.isArray(storedIds) && storedIds.length) {
        await cancelIntervalReminders(storedIds);
      }
    }
    const storedCustomIdsRaw = await AsyncStorage.getItem(
      STORAGE_KEYS.reminderCustomIds,
    );
    if (storedCustomIdsRaw) {
      const storedCustomIds = JSON.parse(storedCustomIdsRaw) as string[];
      if (Array.isArray(storedCustomIds) && storedCustomIds.length) {
        await cancelCustomTimeReminders(storedCustomIds);
      }
    }

    let ids: string[] = [];
    let customIds: string[] = [];
    if (reminderMode === 'interval') {
      const windows: ReminderWindow[] = windowOptions
        .filter(option => activeWindows.includes(option.id))
        .map(option => ({
          startHour: option.startHour,
          startMinute: option.startMinute,
          endHour: option.endHour,
          endMinute: option.endMinute,
        }));

      ids = await scheduleIntervalReminders(
        reminderInterval,
        windows,
        soundEnabled,
      );
    } else if (reminderMode === 'custom') {
      customIds = await scheduleCustomTimeReminders(customTimes, soundEnabled);
    }

    await AsyncStorage.setItem(
      STORAGE_KEYS.reminderInterval,
      String(reminderInterval),
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.reminderActiveWindows,
      JSON.stringify(activeWindows),
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.reminderSoundEnabled,
      String(soundEnabled),
    );
    await AsyncStorage.setItem(STORAGE_KEYS.reminderIds, JSON.stringify(ids));
    await AsyncStorage.setItem(
      STORAGE_KEYS.reminderCustomTimes,
      JSON.stringify(customTimes),
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.reminderCustomIds,
      JSON.stringify(customIds),
    );
    await AsyncStorage.setItem(STORAGE_KEYS.reminderMode, reminderMode);
    await AsyncStorage.setItem(STORAGE_KEYS.reminderEnabled, 'true');

    setStatusMessage('Reminders set successfully.');
  }, [
    activeWindows,
    reminderInterval,
    soundEnabled,
    windowOptions,
    customTimes,
    reminderMode,
  ]);

  const handleStopReminder = useCallback(async () => {
    setStatusMessage('');
    setStatusError('');
    const [storedIdsRaw, storedCustomIdsRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.reminderIds),
      AsyncStorage.getItem(STORAGE_KEYS.reminderCustomIds),
    ]);
    if (storedIdsRaw) {
      const storedIds = JSON.parse(storedIdsRaw) as string[];
      if (Array.isArray(storedIds) && storedIds.length) {
        await cancelIntervalReminders(storedIds);
      }
    }
    if (storedCustomIdsRaw) {
      const storedCustomIds = JSON.parse(storedCustomIdsRaw) as string[];
      if (Array.isArray(storedCustomIds) && storedCustomIds.length) {
        await cancelCustomTimeReminders(storedCustomIds);
      }
    }
    await AsyncStorage.setItem(STORAGE_KEYS.reminderEnabled, 'false');
    setStatusMessage('Reminders turned off.');
  }, []);

  const addCustomTime = useCallback(() => {
    const hour = customTimeDraft.getHours();
    const minute = customTimeDraft.getMinutes();
    const exists = customTimes.some(
      item => item.hour === hour && item.minute === minute,
    );
    if (!exists) {
      setCustomTimes(prev => [...prev, { hour, minute }]);
    }
    setCustomTimePickerVisible(false);
  }, [customTimeDraft, customTimes]);

  const removeCustomTime = useCallback((index: number) => {
    setCustomTimes(prev => prev.filter((_, idx) => idx !== index));
  }, []);

  const formatTime = useCallback((time: ReminderTime) => {
    const date = new Date();
    date.setHours(time.hour, time.minute, 0, 0);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }, []);

  return (
    <Screen>
      <AppHeader title="Goals & Reminders" onBack={() => navigation.goBack()} />
      <Divider style={styles.divider} />

      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.sectionTitleRow}>
          <Text weight="semibold">Reminder type</Text>
        </View>
        <View style={styles.modeRow}>
          <Pressable
            style={[
              styles.modeChip,
              {
                borderColor:
                  reminderMode === 'interval' ? colors.primary : colors.border,
                backgroundColor:
                  reminderMode === 'interval' ? colors.primary : colors.surface,
              },
            ]}
            onPress={() => setReminderMode('interval')}
          >
            <Text
              variant="sm"
              style={{
                color:
                  reminderMode === 'interval'
                    ? colors.surface
                    : colors.textPrimary,
              }}
            >
              Interval
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.modeChip,
              {
                borderColor:
                  reminderMode === 'custom' ? colors.primary : colors.border,
                backgroundColor:
                  reminderMode === 'custom' ? colors.primary : colors.surface,
              },
            ]}
            onPress={() => setReminderMode('custom')}
          >
            <Text
              variant="sm"
              style={{
                color:
                  reminderMode === 'custom'
                    ? colors.surface
                    : colors.textPrimary,
              }}
            >
              Custom times
            </Text>
          </Pressable>
        </View>
      </View>

      {reminderMode === 'interval' ? (
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Pressable
            style={[
              styles.rowItem,
              reminderMode !== 'interval' && styles.disabledRow,
            ]}
            onPress={() => setIntervalPickerVisible(true)}
            disabled={reminderMode !== 'interval'}
          >
            <View style={styles.rowLeft}>
              <Icon
                iconSet="MaterialIcons"
                iconName="timer"
                size={20}
                color={colors.textSecondary}
              />
              <Text>Reminder interval</Text>
            </View>
            <View style={styles.rowRight}>
              <Text color="textSecondary">
                Every {reminderInterval} minutes
              </Text>
              <Icon
                iconSet="MaterialIcons"
                iconName="expand-more"
                size={22}
                color={colors.textSecondary}
              />
            </View>
          </Pressable>
          <Divider />
          <View
            style={[
              styles.rowItem,
              reminderMode !== 'interval' && styles.disabledRow,
            ]}
          >
            <View style={styles.rowLeft}>
              <Icon
                iconSet="MaterialIcons"
                iconName="notifications"
                size={20}
                color={colors.textSecondary}
              />
              <Text>Notification sound</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={value => {
                setSoundEnabled(value);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>
      ) : null}

      {reminderMode === 'custom' ? (
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionTitleRow}>
            <Text weight="semibold">Custom reminder times</Text>
            <Pressable onPress={() => setCustomTimePickerVisible(true)}>
              <Text variant="sm" color={'primary'}>
                Add time
              </Text>
            </Pressable>
          </View>
          {customTimes.length ? (
            <View style={styles.customTimesRow}>
              {customTimes.map((time, index) => (
                <View
                  key={`${time.hour}-${time.minute}-${index}`}
                  style={[
                    styles.customTimeChip,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <Text variant="sm">{formatTime(time)}</Text>
                  <Pressable
                    onPress={() => removeCustomTime(index)}
                    disabled={reminderMode !== 'custom'}
                  >
                    <Icon
                      iconSet="MaterialIcons"
                      iconName="close"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text
              variant="sm"
              color="textSecondary"
              style={styles.emptyCustomText}
            >
              Add a specific time if you prefer exact reminders.
            </Text>
          )}
        </View>
      ) : null}

      {reminderMode === 'interval' ? (
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionTitleRow}>
            <Text weight="semibold">Daily active hours (IST)</Text>
            <Icon
              iconSet="MaterialIcons"
              iconName="schedule"
              size={18}
              color={colors.textSecondary}
            />
          </View>
          <View
            style={[
              styles.hoursCard,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
              reminderMode !== 'interval' && styles.disabledRow,
            ]}
          >
            {windowOptions.map(option => {
              const isSelected = activeWindows.includes(option.id);
              return (
                <Pressable
                  key={option.id}
                  style={[
                    styles.hourChip,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.surface,
                    },
                  ]}
                  onPress={() => toggleWindow(option.id)}
                  disabled={reminderMode !== 'interval'}
                >
                  <View style={styles.chipContent}>
                    {isSelected ? (
                      <Icon
                        iconSet="MaterialIcons"
                        iconName="check"
                        size={14}
                        color={colors.surface}
                      />
                    ) : null}
                    <Text
                      variant="sm"
                      style={{
                        color: isSelected ? colors.surface : colors.textPrimary,
                      }}
                    >
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <Button label="Set Reminder" onPress={handleSetReminder} />
      <Pressable style={styles.stopRow} onPress={handleStopReminder}>
        <Text variant="sm" color="textSecondary">
          Stop reminders
        </Text>
      </Pressable>

      {statusMessage ? (
        <Text variant="sm" color="textSecondary" style={styles.statusText}>
          {statusMessage}
        </Text>
      ) : null}
      {statusError ? (
        <Text variant="sm" color="accent" style={styles.statusText}>
          {statusError}
        </Text>
      ) : null}

      <Modal transparent animationType="fade" visible={intervalPickerVisible}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIntervalPickerVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => {}}
          >
            <Text weight="semibold">Choose interval</Text>
            {intervalOptions.map(option => (
              <Pressable
                key={option}
                style={styles.modalRow}
                onPress={() => {
                  setReminderInterval(option);
                  setIntervalPickerVisible(false);
                }}
              >
                <Text>Every {option} minutes</Text>
                {reminderInterval === option ? (
                  <Icon
                    iconSet="MaterialIcons"
                    iconName="check"
                    size={18}
                    color={colors.primary}
                  />
                ) : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent animationType="fade" visible={customTimePickerVisible}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setCustomTimePickerVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => {}}
          >
            <Text weight="semibold">Pick a time</Text>
            <DateTimePicker
              value={customTimeDraft}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                if (date) setCustomTimeDraft(date);
              }}
            />
            <Button label="Add time" onPress={addCustomTime} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  divider: {
    marginVertical: 16,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 6,
    gap: 0,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  rowItem: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  hoursCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 8,
    marginBottom: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  hourChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customTimesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  customTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyCustomText: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  stopRow: {
    alignItems: 'center',
    marginTop: 10,
  },
  statusText: {
    textAlign: 'center',
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
  },
  modalRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  disabledRow: {
    opacity: 0.5,
  },
});
