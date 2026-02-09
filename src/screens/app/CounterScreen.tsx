import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Text, Button, Divider, Icon, AppHeader } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { getLocalDateKey } from '../../utils/date';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { AppTabParamList } from '../../navigation';
import Svg, { Circle } from 'react-native-svg';

export const CounterScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(108);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [mantraName, setMantraName] = useState('Naam');
  const [sessionActive, setSessionActive] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);
  const progress = target > 0 ? Math.min(count / target, 1) : 0;
  const ringSize = 230;
  const ringStroke = 14;
  const ringRadius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * ringRadius;

  useEffect(() => {
    const loadState = async () => {
      const [countRaw, targetRaw, soundRaw, vibrationRaw, mantraRaw, activeRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.count),
        AsyncStorage.getItem(STORAGE_KEYS.target),
        AsyncStorage.getItem(STORAGE_KEYS.sound),
        AsyncStorage.getItem(STORAGE_KEYS.vibration),
        AsyncStorage.getItem(STORAGE_KEYS.activeMantra),
        AsyncStorage.getItem(STORAGE_KEYS.sessionActive),
      ]);

      if (countRaw) setCount(Number(countRaw) || 0);
      if (targetRaw) setTarget(Number(targetRaw) || 108);
      if (soundRaw) setSoundEnabled(soundRaw === 'true');
      if (vibrationRaw) setVibrationEnabled(vibrationRaw === 'true');
      if (mantraRaw) setMantraName(mantraRaw);
      if (activeRaw) setSessionActive(activeRaw === 'true');
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
    AsyncStorage.setItem(STORAGE_KEYS.sound, String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.vibration, String(vibrationEnabled));
  }, [vibrationEnabled]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.activeMantra, mantraName);
  }, [mantraName]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.sessionActive, String(sessionActive));
  }, [sessionActive]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

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
      if (next >= target) {
        setSessionActive(false);
        AsyncStorage.setItem(STORAGE_KEYS.sessionActive, 'false');
        AsyncStorage.setItem(STORAGE_KEYS.lastCompletedMantra, mantraName);
        AsyncStorage.setItem(STORAGE_KEYS.lastCompletedAt, new Date().toISOString());
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
  }, [mantraName, target]);

  const reset = useCallback(() => {
    setCount(0);
    setSessionActive(false);
    setToastVisible(false);
    AsyncStorage.setItem(STORAGE_KEYS.sessionActive, 'false');
  }, []);

  return (
    <Screen>
      <AppHeader title="Mantra Counter" />

      <Divider style={styles.divider} />

      <View style={styles.center}>
        <View style={[styles.mantraPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon iconSet="MaterialIcons" iconName="spa" size={16} color={colors.primary} />
          <Text variant="sm" weight="semibold">
            {mantraName}
          </Text>
        </View>
        <View style={styles.countRow}>
          <Text variant="title" weight="bold" color="primary" style={styles.count}>
            {count}
          </Text>
        </View>

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

        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text variant="xs" color="textSecondary">
              Target
            </Text>
            <Text weight="semibold">{target}</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="xs" color="textSecondary">
              Remaining
            </Text>
            <Text weight="semibold" color="accent">
              {Math.max(target - count, 0)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => setSoundEnabled(prev => !prev)}
          style={[styles.toggleButton, { borderColor: colors.border }]}
        >
          <Icon
            iconSet="MaterialIcons"
            iconName={soundEnabled ? 'volume-up' : 'volume-off'}
            size={22}
            color={soundEnabled ? colors.accent : colors.textSecondary}
          />
          <Text variant="sm" color={soundEnabled ? 'accent' : 'textSecondary'}>
            Sound
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setVibrationEnabled(prev => !prev)}
          style={[styles.toggleButton, { borderColor: colors.border }]}
        >
          <Icon
            iconSet="MaterialIcons"
            iconName={vibrationEnabled ? 'vibration' : 'phone-android'}
            size={22}
            color={vibrationEnabled ? colors.accent : colors.textSecondary}
          />
          <Text variant="sm" color={vibrationEnabled ? 'accent' : 'textSecondary'}>
            Vibration
          </Text>
        </Pressable>
      </View>

      <Button label="Reset" variant="outline" onPress={reset} style={styles.reset} />
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
  mantraPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
  statRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 4,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
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
  reset: {
    marginTop: 24,
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
