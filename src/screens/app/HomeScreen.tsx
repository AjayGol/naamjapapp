import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Screen, Text, Button, Divider, Icon } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { AppTabParamList } from '../../navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { getStreaks, getWeekdayKey } from '../../utils/date';
import LinearGradient from 'react-native-linear-gradient';

type SessionEntry = {
  id: string;
  mantra: string;
  count: number;
  target: number;
  completedAt: string;
};

export const HomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  const stackNavigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [mantraName, setMantraName] = useState('');
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(108);
  const [defaultTarget, setDefaultTarget] = useState(108);
  const [sessionActive, setSessionActive] = useState(false);
  const [lastCompletedMantra, setLastCompletedMantra] = useState('');
  const [lastCompletedAt, setLastCompletedAt] = useState('');
  const [error, setError] = useState('');
  const [streaks, setStreaks] = useState({ current: 0, longest: 0 });
  const [history, setHistory] = useState<SessionEntry[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTimeLabel, setReminderTimeLabel] = useState('');
  const completedDate =
    lastCompletedAt && !Number.isNaN(new Date(lastCompletedAt).getTime())
      ? new Date(lastCompletedAt).toDateString()
      : '';

  const loadState = useCallback(async () => {
    const [
      countRaw,
      targetRaw,
      activeRaw,
      mantraRaw,
      completedRaw,
      completedAtRaw,
      countsRaw,
      historyRaw,
      favoritesRaw,
      dailyGoalsRaw,
      reminderEnabledRaw,
      reminderTimeRaw,
    ] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.count),
      AsyncStorage.getItem(STORAGE_KEYS.target),
      AsyncStorage.getItem(STORAGE_KEYS.sessionActive),
      AsyncStorage.getItem(STORAGE_KEYS.activeMantra),
      AsyncStorage.getItem(STORAGE_KEYS.lastCompletedMantra),
      AsyncStorage.getItem(STORAGE_KEYS.lastCompletedAt),
      AsyncStorage.getItem(STORAGE_KEYS.dailyCounts),
      AsyncStorage.getItem(STORAGE_KEYS.sessionHistory),
      AsyncStorage.getItem(STORAGE_KEYS.favoriteMantras),
      AsyncStorage.getItem(STORAGE_KEYS.dailyGoals),
      AsyncStorage.getItem(STORAGE_KEYS.reminderEnabled),
      AsyncStorage.getItem(STORAGE_KEYS.reminderTime),
    ]);

    const baseTarget = targetRaw ? Number(targetRaw) || 108 : 108;
    const goals = dailyGoalsRaw
      ? (JSON.parse(dailyGoalsRaw) as Record<number, number>)
      : {};
    const todayTarget = goals[getWeekdayKey()] || baseTarget;

    setCount(countRaw ? Number(countRaw) || 0 : 0);
    setDefaultTarget(baseTarget);
    setTarget(todayTarget);
    setSessionActive(activeRaw === 'true');
    setMantraName(mantraRaw || '');
    setLastCompletedMantra(completedRaw || '');
    setLastCompletedAt(completedAtRaw || '');
    const counts = countsRaw
      ? (JSON.parse(countsRaw) as Record<string, number>)
      : {};
    setStreaks(getStreaks(counts));
    setHistory(historyRaw ? (JSON.parse(historyRaw) as SessionEntry[]) : []);
    setFavorites(
      favoritesRaw ? (JSON.parse(favoritesRaw) as string[]) : [],
    );
    setReminderEnabled(reminderEnabledRaw === 'true');
    if (reminderTimeRaw) {
      const [h, m] = reminderTimeRaw.split(':').map(Number);
      const date = new Date();
      date.setHours(h || 8, m || 0, 0, 0);
      setReminderTimeLabel(
        date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      );
    } else {
      setReminderTimeLabel('');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadState();
    }, [loadState]),
  );

  const continueChanting = useCallback(() => {
    navigation.navigate('Counter');
  }, [navigation]);

  const activeMantra = useMemo(() => mantraName.trim(), [mantraName]);

  const startChanting = useCallback(async () => {
    const trimmed = activeMantra.trim();
    if (!trimmed) {
      setError('Please enter a mantra name');
      return;
    }

    setError('');
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.activeMantra, trimmed),
      AsyncStorage.setItem(STORAGE_KEYS.count, '0'),
      AsyncStorage.setItem(
        STORAGE_KEYS.target,
        String(defaultTarget || 108),
      ),
      AsyncStorage.setItem(STORAGE_KEYS.sessionActive, 'true'),
    ]);

    setCount(0);
    setSessionActive(true);
    navigation.navigate('Counter');
  }, [activeMantra, navigation, target]);

  const openSelectNaam = useCallback(() => {
    stackNavigation.navigate('SelectNaam');
  }, [stackNavigation]);

  const progress = target > 0 ? Math.min(count / target, 1) : 0;
  const isFavorite = favorites.includes(activeMantra);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Icon
              iconSet="MaterialIcons"
              iconName="self-improvement"
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={styles.headerText}>
            <Text variant="title" weight="bold">
              Naam Jap
            </Text>
            <Text variant="sm" color="textSecondary">
              Calm, focused chanting
            </Text>
          </View>
          <Pressable
            onPress={() => stackNavigation.navigate('Goals')}
            style={[
              styles.goalIcon,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Icon
              iconSet="MaterialIcons"
              iconName="flag"
              size={18}
              color={colors.primary}
            />
          </Pressable>
        </View>
      </View>

      <Divider style={styles.divider} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.heroCard,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <LinearGradient
            colors={[`${colors.primary}12`, colors.surface]}
            style={styles.heroGradient}
          />
          <View style={styles.heroContent}>
            <View style={styles.heroTop}>
              <View>
                <Text variant="sm" color="textSecondary">
                  Today
                </Text>
                <Text variant="xl" weight="bold" color="primary">
                  {count}
                </Text>
              </View>
              <View style={styles.heroTarget}>
                <Text variant="xs" color="textSecondary">
                  Goal
                </Text>
                <Text variant="lg" weight="semibold">
                  {target}
                </Text>
              </View>
            </View>
            <View
              style={[styles.heroTrack, { backgroundColor: colors.border }]}
            >
              <View
                style={[
                  styles.heroFill,
                  {
                    width: `${Math.round(progress * 100)}%`,
                    backgroundColor: colors.accent,
                  },
                ]}
              />
            </View>
            <View style={styles.heroFooter}>
              <Text variant="xs" color="textSecondary">
                Remaining {Math.max(target - count, 0)}
              </Text>
              {sessionActive ? (
                <View
                  style={[
                    styles.activeChip,
                    { backgroundColor: `${colors.secondary}1A` },
                  ]}
                >
                  <Icon
                    iconSet="MaterialIcons"
                    iconName="radio-button-checked"
                    size={12}
                    color={colors.secondary}
                  />
                  <Text variant="xs" color="textSecondary">
                    Active
                  </Text>
                </View>
              ) : null}
            </View>
            {sessionActive && count < target ? (
              <View style={styles.heroContinueRow}>
                <View style={styles.heroContinueText}>
                  <Text weight="semibold">Continue your session</Text>
                  <Text variant="xs" color="textSecondary">
                    {activeMantra || 'Your mantra'} · {target - count} left
                  </Text>
                </View>
                <Button
                  label="Continue"
                  onPress={continueChanting}
                  style={styles.heroContinueBtn}
                />
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.cardRow}>
          <Pressable
            onPress={() => stackNavigation.navigate('Goals')}
            style={[
              styles.goalsCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.goalsAccent, { backgroundColor: colors.accent }]} />
            <View style={styles.goalsBody}>
              <View style={styles.goalsHeader}>
                <Text weight="semibold">Goals & reminders</Text>
                <Icon
                  iconSet="MaterialIcons"
                  iconName="chevron-right"
                  size={22}
                  color={colors.textSecondary}
                />
              </View>
              <Text variant="xs" color="textSecondary">
                Today goal {target}
                {reminderEnabled && reminderTimeLabel
                  ? ` · Reminder ${reminderTimeLabel}`
                  : ''}
              </Text>
            </View>
          </Pressable>

          <View
            style={[
              styles.streakCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.streakCol}>
              <Text variant="xs" color="textSecondary">
                Current streak
              </Text>
              <Text variant="lg" weight="bold">
                {streaks.current} days
              </Text>
            </View>
            <View
              style={[
                styles.streakDivider,
                { backgroundColor: colors.border },
              ]}
            />
            <View style={styles.streakCol}>
              <Text variant="xs" color="textSecondary">
                Best streak
              </Text>
              <Text variant="lg" weight="bold">
                {streaks.longest} days
              </Text>
            </View>
          </View>
        </View>

        {!sessionActive && lastCompletedMantra ? (
          <View
            style={[
              styles.bannerCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Icon
              iconSet="MaterialIcons"
              iconName="verified"
              size={18}
              color={colors.accent}
            />
            <View style={styles.bannerText}>
              <Text weight="semibold" color="accent">
                Completed 108
              </Text>
              <Text variant="sm" color="textSecondary">
                {lastCompletedMantra}{' '}
                {completedDate ? `· ${completedDate}` : ''}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.sectionHeader}>
            <Text variant="sm" weight="semibold">
              Choose mantra
            </Text>
            <Text variant="xs" color="textSecondary">
              Tap to change
            </Text>
          </View>
          <Pressable
            onPress={openSelectNaam}
            style={[
              styles.selectCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.selectAccent, { backgroundColor: colors.accent }]}
            />
            <View style={styles.selectBadgeWrap}>
              <View
                style={[
                  styles.selectBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Icon
                  iconSet="MaterialIcons"
                  iconName="spa"
                  size={18}
                  color={colors.surface}
                />
              </View>
            </View>
            <View style={styles.selectContent}>
              <Text variant="xs" color="textSecondary">
                Current Naam
              </Text>
              <Text variant="lg" weight="bold">
                {activeMantra || 'Select Naam'}
              </Text>
              <View style={styles.selectMeta}>
                <Icon
                  iconSet="MaterialIcons"
                  iconName="touch-app"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text variant="xs" color="textSecondary">
                  Open selection
                </Text>
              </View>
            </View>
            <View style={styles.selectAction}>
              {isFavorite ? (
                <View
                  style={[
                    styles.favoritePill,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Icon
                    iconSet="MaterialIcons"
                    iconName="star"
                    size={12}
                    color={colors.surface}
                  />
                  <Text variant="xs" color="surface">
                    Favorite
                  </Text>
                </View>
              ) : null}
              <Icon
                iconSet="MaterialIcons"
                iconName="chevron-right"
                size={22}
                color={colors.textSecondary}
              />
            </View>
          </Pressable>
          {error ? (
            <Text variant="xs" color="error">
              {error}
            </Text>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text variant="sm" weight="semibold">
            Recent sessions
          </Text>
          <Pressable onPress={() => stackNavigation.navigate('History')}>
            <Text variant="xs" color="textSecondary">
              View all
            </Text>
          </Pressable>
        </View>
        {history.length === 0 ? (
          <View
            style={[
              styles.emptyHistory,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text variant="sm" color="textSecondary">
              Complete your first 108 to see history here.
            </Text>
          </View>
        ) : (
          history.slice(0, 2).map(item => {
            const date = new Date(item.completedAt).toDateString();
            return (
              <View
                key={item.id}
                style={[
                  styles.historyCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.historyRow}>
                  <Text weight="semibold">{item.mantra}</Text>
                  <Text variant="xs" color="textSecondary">
                    {date}
                  </Text>
                </View>
                <Text variant="xs" color="textSecondary">
                  {item.count}/{item.target}
                </Text>
              </View>
            );
          })
        )}

        <View style={styles.actions}>
          <Button
            label={sessionActive ? 'Continue Chanting' : 'Start Chanting'}
            onPress={sessionActive ? continueChanting : startChanting}
          />
          <Button
            label="Reset"
            variant="outline"
            onPress={async () => {
              setCount(0);
              setSessionActive(false);
              await Promise.all([
                AsyncStorage.setItem(STORAGE_KEYS.count, '0'),
                AsyncStorage.setItem(STORAGE_KEYS.sessionActive, 'false'),
              ]);
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
  },
  header: {
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    gap: 4,
    flex: 1,
  },
  goalIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    marginVertical: 16,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    padding: 18,
    gap: 14,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTarget: {
    alignItems: 'flex-end',
  },
  heroTrack: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  heroFill: {
    height: '100%',
    borderRadius: 999,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroContinueRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroContinueText: {
    flex: 1,
    gap: 2,
  },
  heroContinueBtn: {
    minHeight: 36,
    paddingHorizontal: 12,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardRow: {
    gap: 12,
    marginTop: 12,
  },
  goalsCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalsAccent: {
    width: 4,
    height: 44,
    borderRadius: 999,
  },
  goalsBody: {
    flex: 1,
    gap: 6,
  },
  goalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakCol: {
    gap: 4,
    flex: 1,
  },
  streakDivider: {
    width: 1,
    height: 36,
    marginHorizontal: 12,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  form: {
    marginTop: 18,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  selectCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  selectAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  selectBadgeWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectContent: {
    flex: 1,
    gap: 4,
  },
  selectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectAction: {
    alignItems: 'flex-end',
    gap: 2,
  },
  favoritePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
    marginTop: 10,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyHistory: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
});
