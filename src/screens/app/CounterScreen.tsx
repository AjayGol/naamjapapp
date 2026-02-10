import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Vibration, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Text, Divider, Icon, AppHeader } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { getLocalDateKey, getWeekdayKey } from '../../utils/date';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import Svg, { Circle } from 'react-native-svg';

type SessionEntry = {
  id: string;
  mantra: string;
  count: number;
  target: number;
  completedAt: string;
};

export const CounterScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation =
      useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(108);
  const [mantraName, setMantraName] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [malaCount, setMalaCount] = useState(0);
  const [showTapHint, setShowTapHint] = useState(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = target > 0 ? Math.min(count / target, 1) : 0;
  const ringSize = 260;
  const ringStroke = 16;
  const ringRadius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const countScale = useRef(new Animated.Value(1)).current;

  const loadState = useCallback(async () => {
    const [
      countRaw,
      targetRaw,
      mantraRaw,
      activeRaw,
      malaRaw,
      hintRaw,
      goalsRaw,
    ] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.count),
      AsyncStorage.getItem(STORAGE_KEYS.target),
      AsyncStorage.getItem(STORAGE_KEYS.activeMantra),
      AsyncStorage.getItem(STORAGE_KEYS.sessionActive),
      AsyncStorage.getItem(STORAGE_KEYS.malaCount),
      AsyncStorage.getItem(STORAGE_KEYS.tapHintSeen),
      AsyncStorage.getItem(STORAGE_KEYS.dailyGoals),
    ]);

    const baseTarget = targetRaw ? Number(targetRaw) || 108 : 108;
    const goals = goalsRaw
      ? (JSON.parse(goalsRaw) as Record<number, number>)
      : {};
    const todayTarget = goals[getWeekdayKey()] || baseTarget;
    setTarget(todayTarget);

    setCount(countRaw ? Number(countRaw) || 0 : 0);
    if (mantraRaw) {
      setMantraName(mantraRaw);
    } else {
      const fallback = 'Radha Radha';
      setMantraName(fallback);
      AsyncStorage.setItem(STORAGE_KEYS.activeMantra, fallback);
    }
    setSessionActive(activeRaw === 'true');
    setMalaCount(malaRaw ? Number(malaRaw) || 0 : 0);
    setShowTapHint(hintRaw !== 'true');
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadState();
    }, [loadState]),
  );

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
    };
  }, []);

  const increment = useCallback(() => {
    if (!mantraName.trim()) {
      navigation.navigate('SelectNaam');
      return;
    }
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
        Animated.timing(countScale, {
          toValue: 1.08,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(countScale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
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
        AsyncStorage.setItem(
            STORAGE_KEYS.lastCompletedAt,
            new Date().toISOString(),
        );
        const entry: SessionEntry = {
          id: `${Date.now()}`,
          mantra: mantraName,
          count: target,
          target,
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
  }, [countScale, mantraName, target]);

  return (
      <Screen>
        <AppHeader title="Mantra Counter" />

        <Divider style={styles.divider} />

        <View style={styles.topRow}>
          <Pressable
              onPress={() => navigation.navigate('SelectNaam')}
              style={[
                styles.mantraPill,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
          >
            <Icon
                iconSet="MaterialIcons"
                iconName="spa"
                size={16}
                color={colors.primary}
            />
            <Text variant="sm" weight="semibold">
              {mantraName || 'Select Naam'}
            </Text>
            <Icon
                iconSet="MaterialIcons"
                iconName="chevron-right"
                size={18}
                color={colors.textSecondary}
            />
          </Pressable>
          <View
              style={[
                styles.malaPill,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
          >
            <Icon
                iconSet="MaterialIcons"
                iconName="whatshot"
                size={16}
                color={colors.accent}
            />
            <Text variant="xs" color="textSecondary">
              Mala
            </Text>
            <Text weight="semibold">{malaCount}</Text>
          </View>
        </View>

        <View style={styles.center}>
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
                  stroke={colors.primary}
                  strokeWidth={ringStroke + 8}
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
                  stroke={colors.primary}
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
                    backgroundColor: colors.surface,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
            >
              <Animated.View
                  style={{
                    alignItems: 'center',
                    transform: [{ scale: countScale }],
                  }}
              >
                <Text weight="bold" color="primary" style={styles.count}>
                  {count}
                </Text>
                <Text variant="sm" color="textSecondary">
                  Tap to add
                </Text>
                <Text variant="xs" color="textSecondary">
                  Goal {target}
                </Text>
              </Animated.View>
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
        </View>

        {/* Vibration is always on; no toggle UI */}
        {toastVisible ? (
            <View
                style={[
                  styles.toast,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
            >
              <Icon
                  iconSet="MaterialIcons"
                  iconName="verified"
                  size={18}
                  color={colors.accent}
              />
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
    flex: 1,
    alignItems: 'center',
    gap: 18,
    paddingBottom: 24,
    marginTop : 70
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
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
  count: {
    fontSize: 64,
  },
  circle: {
    width: 176,
    height: 176,
    borderRadius: 88,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  ringWrapper: {
    width: 260,
    height: 260,
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
