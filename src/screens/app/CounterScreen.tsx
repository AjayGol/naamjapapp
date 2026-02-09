import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Text, Button, Divider, Icon, AppHeader } from '../../components';
import { useTheme } from '../../hooks/useTheme';

const STORAGE_KEYS = {
  count: 'naamjap.count',
  target: 'naamjap.target',
  sound: 'naamjap.soundEnabled',
  vibration: 'naamjap.vibrationEnabled',
};

export const CounterScreen: React.FC = () => {
  const { colors } = useTheme();
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(108);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  useEffect(() => {
    const loadState = async () => {
      const [countRaw, targetRaw, soundRaw, vibrationRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.count),
        AsyncStorage.getItem(STORAGE_KEYS.target),
        AsyncStorage.getItem(STORAGE_KEYS.sound),
        AsyncStorage.getItem(STORAGE_KEYS.vibration),
      ]);

      if (countRaw) setCount(Number(countRaw) || 0);
      if (targetRaw) setTarget(Number(targetRaw) || 108);
      if (soundRaw) setSoundEnabled(soundRaw === 'true');
      if (vibrationRaw) setVibrationEnabled(vibrationRaw === 'true');
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

  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  const reset = useCallback(() => {
    setCount(0);
  }, []);

  return (
    <Screen>
      <AppHeader title="Mantra Counter" />

      <Divider style={styles.divider} />

      <View style={styles.center}>
        <Text variant="title" weight="bold" color="primary" style={styles.count}>
          {count}
        </Text>

        <Pressable
          onPress={increment}
          style={({ pressed }) => [
            styles.circle,
            {
              borderColor: colors.primary,
              backgroundColor: colors.surface,
              opacity: pressed ? 0.9 : 1,
              shadowColor: colors.textPrimary,
            },
          ]}
        >
          <Text variant="lg" weight="semibold" color="primary">
            Tap
          </Text>
        </Pressable>

        <Text variant="sm" color="textSecondary" style={styles.target}>
          Target: {target}
        </Text>
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
  count: {
    fontSize: 56,
  },
  circle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  target: {
    marginTop: 6,
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
});
