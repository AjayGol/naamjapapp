import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Switch,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader, Screen, Text, Divider, Icon, TextInput, Button } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import {
  cancelDailyReminder,
  scheduleDailyReminder,
} from '../../services/notifications';

export const GoalsScreen: React.FC = () => {
  const { colors } = useTheme();
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(() => {
    const date = new Date();
    date.setHours(8, 0, 0, 0);
    return date;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dailyGoals, setDailyGoals] = useState<Record<number, number>>({});
  const [defaultGoal, setDefaultGoal] = useState(108);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalDay, setGoalDay] = useState<number | null>(null);
  const [goalValue, setGoalValue] = useState('');
  const [goalError, setGoalError] = useState('');

  const weekDays = useMemo(
    () => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    [],
  );

  useEffect(() => {
    const load = async () => {
      const [remEnabledRaw, remTimeRaw, goalsRaw, targetRaw] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.reminderEnabled),
          AsyncStorage.getItem(STORAGE_KEYS.reminderTime),
          AsyncStorage.getItem(STORAGE_KEYS.dailyGoals),
          AsyncStorage.getItem(STORAGE_KEYS.target),
        ]);

      if (remEnabledRaw) setReminderEnabled(remEnabledRaw === 'true');
      if (remTimeRaw) {
        const [h, m] = remTimeRaw.split(':').map(Number);
        const date = new Date();
        date.setHours(h || 8, m || 0, 0, 0);
        setReminderTime(date);
        if (remEnabledRaw === 'true') {
          scheduleDailyReminder(date.getHours(), date.getMinutes());
        }
      }
      if (goalsRaw) {
        setDailyGoals(JSON.parse(goalsRaw) as Record<number, number>);
      }
      if (targetRaw) {
        setDefaultGoal(Number(targetRaw) || 108);
      }
    };
    load();
  }, []);

  const saveReminder = useCallback(
    async (enabled: boolean, time = reminderTime) => {
      setReminderEnabled(enabled);
      await AsyncStorage.setItem(
        STORAGE_KEYS.reminderEnabled,
        String(enabled),
      );
      const hh = String(time.getHours()).padStart(2, '0');
      const mm = String(time.getMinutes()).padStart(2, '0');
      await AsyncStorage.setItem(
        STORAGE_KEYS.reminderTime,
        `${hh}:${mm}`,
      );
      if (enabled) {
        scheduleDailyReminder(time.getHours(), time.getMinutes());
      } else {
        cancelDailyReminder();
      }
    },
    [reminderTime],
  );

  const openGoalEditor = useCallback(
    (dayIndex: number) => {
      setGoalDay(dayIndex);
      const current =
        dayIndex === -1 ? defaultGoal : dailyGoals[dayIndex] || defaultGoal;
      setGoalValue(String(current));
      setGoalError('');
      setGoalModalVisible(true);
    },
    [dailyGoals, defaultGoal],
  );

  const saveGoal = useCallback(async () => {
    const value = Number(goalValue);
    if (!value || value <= 0) {
      setGoalError('Enter a valid number');
      return;
    }
    if (goalDay === null) return;
    if (goalDay === -1) {
      setDefaultGoal(value);
      await AsyncStorage.setItem(STORAGE_KEYS.target, String(value));
    } else {
      const next = { ...dailyGoals, [goalDay]: value };
      setDailyGoals(next);
      await AsyncStorage.setItem(
        STORAGE_KEYS.dailyGoals,
        JSON.stringify(next),
      );
    }
    setGoalModalVisible(false);
  }, [dailyGoals, goalDay, goalValue]);

  return (
    <Screen>
      <AppHeader title="Goals & Reminders" />
      <Divider style={styles.divider} />

      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionTitleRow}>
          <Text weight="semibold">Daily goals</Text>
          <Text variant="xs" color="textSecondary">
            Schedule by day
          </Text>
        </View>
        <Pressable style={styles.rowItem} onPress={() => openGoalEditor(-1)}>
          <View style={styles.rowLeft}>
            <Icon iconSet="MaterialIcons" iconName="flag" size={20} color={colors.textSecondary} />
            <Text>Default goal</Text>
          </View>
          <View style={styles.rowRight}>
            <Text color="textSecondary">{defaultGoal}</Text>
            <Icon iconSet="MaterialIcons" iconName="chevron-right" size={22} color={colors.textSecondary} />
          </View>
        </Pressable>
        {weekDays.map((day, index) => {
          const value = dailyGoals[index] || defaultGoal;
          return (
            <View key={day}>
              <Divider />
              <Pressable style={styles.rowItem} onPress={() => openGoalEditor(index)}>
                <View style={styles.rowLeft}>
                  <Icon iconSet="MaterialIcons" iconName="today" size={20} color={colors.textSecondary} />
                  <Text>{day}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text color="textSecondary">{value}</Text>
                  <Icon iconSet="MaterialIcons" iconName="chevron-right" size={22} color={colors.textSecondary} />
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.rowItem}>
          <View style={styles.rowLeft}>
            <Icon iconSet="MaterialIcons" iconName="notifications" size={20} color={colors.textSecondary} />
            <Text>Quiet reminders</Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={value => {
              void saveReminder(value);
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>
        <Divider />
        <Pressable style={styles.rowItem} onPress={() => setShowTimePicker(true)}>
          <View style={styles.rowLeft}>
            <Icon iconSet="MaterialIcons" iconName="schedule" size={20} color={colors.textSecondary} />
            <Text>Reminder time</Text>
          </View>
          <View style={styles.rowRight}>
            <Text color="textSecondary">
              {reminderTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </Text>
            <Icon iconSet="MaterialIcons" iconName="expand-more" size={22} color={colors.textSecondary} />
          </View>
        </Pressable>
      </View>

      <Modal transparent animationType="fade" visible={goalModalVisible}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text weight="semibold">Set goal</Text>
            <TextInput
              placeholder="Enter number"
              value={goalValue}
              onChangeText={text => {
                setGoalValue(text.replace(/[^0-9]/g, ''));
                if (goalError) setGoalError('');
              }}
              keyboardType="number-pad"
              error={goalError}
            />
            <Button label="Save" onPress={saveGoal} />
            <Pressable onPress={() => setGoalModalVisible(false)}>
              <Text variant="sm" color="textSecondary">
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {showTimePicker ? (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          display="spinner"
          onChange={(event, date) => {
            setShowTimePicker(false);
            if (date) {
              setReminderTime(date);
              void saveReminder(reminderEnabled, date);
            }
          }}
        />
      ) : null}
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
    gap: 12,
  },
});
