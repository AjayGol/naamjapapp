import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Vibration, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Text, Divider, Icon, AppHeader } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { getLocalDateKey, getWeekdayKey } from '../../utils/date';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import Svg, { Circle } from 'react-native-svg';

type SessionEntry = {
  id: string;
  mantra: string;
  count: number;
  target: number;
  mood?: string;
  completedAt: string;
};

type FocusTimerState = {
  duration: number;
  remaining: number;
  running: boolean;
  startedAt?: number;
};

const MOODS = ['Peace', 'Focus', 'Gratitude', 'Healing'];
const TIMER_OPTIONS = [5, 10, 15];

export const CounterScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(108);
  const [mantraName, setMantraName] = useState('Naam');
  const [sessionActive, setSessionActive] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [malaCount, setMalaCount] = useState(0);
  const [showTapHint, setShowTapHint] = useState(true);
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);
  const [focusDuration, setFocusDuration] = useState(600);
  const [focusRemaining, setFocusRemaining] = useState(600);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusStartedAt, setFocusStartedAt] = useState<number | undefined>(
    undefined,
  );
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progress = target > 0 ? Math.min(count / target, 1) : 0;
  const ringSize = 230;
  const ringStroke = 14;
  const ringRadius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const countScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loadState = async () => {
      const [
        countRaw,
        targetRaw,
        mantraRaw,
        activeRaw,
        malaRaw,
        hintRaw,
        goalsRaw,
        moodRaw,
        focusRaw,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.count),
        AsyncStorage.getItem(STORAGE_KEYS.target),
        AsyncStorage.getItem(STORAGE_KEYS.activeMantra),
        AsyncStorage.getItem(STORAGE_KEYS.sessionActive),
        AsyncStorage.getItem(STORAGE_KEYS.malaCount),
        AsyncStorage.getItem(STORAGE_KEYS.tapHintSeen),
        AsyncStorage.getItem(STORAGE_KEYS.dailyGoals),
        AsyncStorage.getItem(STORAGE_KEYS.currentMood),
        AsyncStorage.getItem(STORAGE_KEYS.focusTimer),
      ]);

      const baseTarget = targetRaw ? Number(targetRaw) || 108 : 108;
      const goals = goalsRaw
        ? (JSON.parse(goalsRaw) as Record<number, number>)
        : {};
      const todayTarget = goals[getWeekdayKey()] || baseTarget;
      setTarget(todayTarget);

      if (countRaw) setCount(Number(countRaw) || 0);
      if (mantraRaw) setMantraName(mantraRaw);
      if (activeRaw) setSessionActive(activeRaw === 'true');
      if (malaRaw) setMalaCount(Number(malaRaw) || 0);
      if (hintRaw === 'true') setShowTapHint(false);
      if (moodRaw) setSelectedMood(moodRaw);

      if (focusRaw) {
        const parsed = JSON.parse(focusRaw) as FocusTimerState;
        const baseDuration = parsed.duration || 600;
        const remaining = parsed.remaining ?? baseDuration;
        if (parsed.running && parsed.startedAt) {
          const elapsed = Math.floor((Date.now() - parsed.startedAt) / 1000);
          const nextRemaining = Math.max(0, baseDuration - elapsed);
          setFocusDuration(baseDuration);
          setFocusRemaining(nextRemaining);
          setFocusRunning(nextRemaining > 0);
          setFocusStartedAt(nextRemaining > 0 ? Date.now() : undefined);
        } else {
          setFocusDuration(baseDuration);
          setFocusRemaining(remaining);
          setFocusRunning(false);
          setFocusStartedAt(undefined);
        }
      }
    };

    loadState();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.count, String(count));
  }, [count]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.target, String(target));
  }, [target]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.activeMantra, mantraName);
  }, [mantraName]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.sessionActive, String(sessionActive));
  }, [sessionActive]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.malaCount, String(malaCount));
  }, [malaCount]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
      if (focusTimerRef.current) {
        clearInterval(focusTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!focusRunning) {
      if (focusTimerRef.current) {
        clearInterval(focusTimerRef.current);
        focusTimerRef.current = null;
      }
      return;
    }

    focusTimerRef.current = setInterval(() => {
      setFocusRemaining(prev => {
        if (prev <= 1) {
          if (focusTimerRef.current) {
            clearInterval(focusTimerRef.current);
            focusTimerRef.current = null;
          }
          setFocusRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (focusTimerRef.current) {
        clearInterval(focusTimerRef.current);
        focusTimerRef.current = null;
      }
    };
  }, [focusRunning]);

  useEffect(() => {
    const payload: FocusTimerState = {
      duration: focusDuration,
      remaining: focusRemaining,
      running: focusRunning,
    };
    if (focusRunning && focusStartedAt) {
      payload.startedAt = focusStartedAt;
    }
    AsyncStorage.setItem(STORAGE_KEYS.focusTimer, JSON.stringify(payload));
  }, [focusDuration, focusRemaining, focusRunning, focusStartedAt]);

  const increment = useCallback(() => {
    setCount(prev => {
      if (prev >= target) {
        return prev;
      }
      const next = prev + 1;
      const todayKey = getLocalDateKey();
      AsyncStorage.getItem(STORAGE_KEYS.dailyCounts).then(raw => {
        const data = raw ? (JSON.parse(raw) as Record<string, number>) : {};
        data[todayKey] = (data[todayKey] || 0) + 1;
        AsyncStorage.setItem(STORAGE_KEYS.dailyCounts, JSON.stringify(data));
      });
      Vibration.vibrate(10);
      Animated.sequence([
        Animated.timing(countScale, { toValue: 1.08, duration: 120, useNativeDriver: true }),
        Animated.timing(countScale, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
      setShowTapHint(prev => {
        if (prev) {
          AsyncStorage.setItem(STORAGE_KEYS.tapHintSeen, 'true');
        }
        return false;
      });
      if (next >= target) {
        setSessionActive(false);
        AsyncStorage.setItem(STORAGE_KEYS.sessionActive, 'false');
        AsyncStorage.setItem(STORAGE_KEYS.lastCompletedMantra, mantraName);
        AsyncStorage.setItem(STORAGE_KEYS.lastCompletedAt, new Date().toISOString());
        const entry: SessionEntry = {
          id: `${Date.now()}`,
          mantra: mantraName,
          count: target,
          target,
          mood: selectedMood,
          completedAt: new Date().toISOString(),
        };
        AsyncStorage.getItem(STORAGE_KEYS.sessionHistory).then(raw => {
          const list = raw ? (JSON.parse(raw) as SessionEntry[]) : [];
          const nextList = [entry, ...list].slice(0, 200);
          AsyncStorage.setItem(
            STORAGE_KEYS.sessionHistory,
            JSON.stringify(nextList),
          );
        });
        setMalaCount(prev => {
          const nextMala = prev + 1;
          AsyncStorage.setItem(STORAGE_KEYS.malaCount, String(nextMala));
          return nextMala;
        });
        setToastVisible(true);
        if (toastTimer.current) {
          clearTimeout(toastTimer.current);
        }
        toastTimer.current = setTimeout(() => {
          setToastVisible(false);
        }, 2000);
        setTimeout(() => {
          setCount(0);
          setSessionActive(true);
          AsyncStorage.setItem(STORAGE_KEYS.count, '0');
          AsyncStorage.setItem(STORAGE_KEYS.sessionActive, 'true');
        }, 500);
      } else {
        setSessionActive(true);
      }
      return next;
    });
  }, [countScale, mantraName, selectedMood, target]);

  const formatTime = useMemo(() => {
    const mins = Math.floor(focusRemaining / 60);
    const secs = focusRemaining % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [focusRemaining]);

  const startFocusTimer = useCallback(
    (minutes: number) => {
      const duration = minutes * 60;
      setFocusDuration(duration);
      setFocusRemaining(duration);
      setFocusRunning(true);
      setFocusStartedAt(Date.now());
    },
    [],
  );

  const toggleFocusTimer = useCallback(() => {
    setFocusRunning(prev => {
      const next = !prev;
      if (next) {
        if (focusRemaining <= 0) {
          setFocusRemaining(focusDuration);
        }
        setFocusStartedAt(Date.now());
      } else {
        setFocusStartedAt(undefined);
      }
      return next;
    });
  }, [focusDuration, focusRemaining]);

  const setMood = useCallback((value: string) => {
    setSelectedMood(value);
    AsyncStorage.setItem(STORAGE_KEYS.currentMood, value);
  }, []);

  return (
    <Screen>
      <AppHeader title="Mantra Counter" />

      <Divider style={styles.divider} />

      <View style={styles.center}>
        <View style={styles.topRow}>
          <Pressable
            onPress={() => navigation.navigate('SelectNaam')}
            style={[styles.mantraPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Icon iconSet="MaterialIcons" iconName="spa" size={16} color={colors.primary} />
            <Text variant="sm" weight="semibold">
              {mantraName}
            </Text>
            <Icon iconSet="MaterialIcons" iconName="chevron-right" size={18} color={colors.textSecondary} />
          </Pressable>
          <View style={[styles.malaPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon iconSet="MaterialIcons" iconName="whatshot" size={16} color={colors.accent} />
            <Text variant="xs" color="textSecondary">
              Mala
            </Text>
            <Text weight="semibold">{malaCount}</Text>
          </View>
        </View>
        <Animated.View style={[styles.countRow, { transform: [{ scale: countScale }] }]}>
          <Text variant="title" weight="bold" color="primary" style={styles.count}>
            {count}
          </Text>
        </Animated.View>

        <View style={styles.ringWrapper}>
          <Svg width={ringSize} height={ringSize} style={styles.ringSvg}>
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              stroke={colors.border}
              strokeWidth={ringStroke}
              fill="none"
            />
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              stroke={colors.accent}
              strokeWidth={ringStroke + 6}
              opacity={0.12}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              rotation={-90}
              originX={ringSize / 2}
              originY={ringSize / 2}
            />
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              stroke={colors.accent}
              strokeWidth={ringStroke}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              rotation={-90}
              originX={ringSize / 2}
              originY={ringSize / 2}
            />
          </Svg>
          <Pressable
            onPress={increment}
            style={({ pressed }) => [
              styles.circle,
              {
                borderColor: colors.primary,
                backgroundColor: colors.surface,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text variant="lg" weight="semibold" color="primary">
              Tap
            </Text>
          </Pressable>
        </View>

        <Text variant="sm" color="textSecondary" style={styles.remaining}>
          Remaining {Math.max(target - count, 0)}
        </Text>
        {showTapHint ? (
          <Text variant="xs" color="textSecondary" style={styles.hint}>
            Tap the circle to add a chant
          </Text>
        ) : null}

        <View
          style={[
            styles.toolsCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.toolsSection}>
            <View style={styles.toolsHeader}>
              <Text weight="semibold">Intention</Text>
              <Text variant="xs" color="textSecondary">
                {selectedMood}
              </Text>
            </View>
            <View style={styles.chipRow}>
              {MOODS.map(mood => {
                const active = mood === selectedMood;
                return (
                  <Pressable
                    key={mood}
                    onPress={() => setMood(mood)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : 'transparent',
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="xs"
                      weight="semibold"
                      color="textPrimary"
                      style={active ? { color: colors.surface } : undefined}
                    >
                      {mood}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.toolsDivider, { backgroundColor: colors.border }]} />

          <View style={styles.toolsSection}>
            <View style={styles.toolsHeader}>
              <Text weight="semibold">Focus timer</Text>
              <Text variant="xs" color="textSecondary">
                {formatTime}
              </Text>
            </View>
            <View style={styles.chipRow}>
              {TIMER_OPTIONS.map(mins => {
                const active = focusDuration === mins * 60;
                return (
                  <Pressable
                    key={mins}
                    onPress={() => startFocusTimer(mins)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active
                          ? colors.secondary
                          : 'transparent',
                        borderColor: active ? colors.secondary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="xs"
                      weight="semibold"
                      color="textPrimary"
                      style={active ? { color: colors.surface } : undefined}
                    >
                      {mins} min
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={toggleFocusTimer}
                style={[
                  styles.chip,
                  {
                    backgroundColor: focusRunning
                      ? colors.accent
                      : 'transparent',
                    borderColor: focusRunning ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text
                  variant="xs"
                  weight="semibold"
                  color="textPrimary"
                  style={focusRunning ? { color: colors.surface } : undefined}
                >
                  {focusRunning ? 'Pause' : 'Start'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Vibration is always on; no toggle UI */}
      {toastVisible ? (
        <View style={[styles.toast, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon iconSet="MaterialIcons" iconName="verified" size={18} color={colors.accent} />
          <Text weight="semibold" color="accent">
            Completed 108
          </Text>
          <Text variant="xs" color="textSecondary">
            {mantraName} · restarting
          </Text>
        </View>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  divider: {
    marginVertical: 16,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginTop: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mantraPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  malaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  count: {
    fontSize: 56,
  },
  circle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  ringWrapper: {
    width: 230,
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSvg: {
    position: 'absolute',
  },
  remaining: {
    marginTop: 6,
  },
  hint: {
    marginTop: 4,
  },
  toolsCard: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginTop: 6,
  },
  toolsSection: {
    gap: 10,
  },
  toolsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolsDivider: {
    height: 1,
    width: '100%',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 28,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
