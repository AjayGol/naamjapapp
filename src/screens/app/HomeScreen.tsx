import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Screen, Text, Button, Divider, Icon, TextInput } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { getLocalDateKey } from '../../utils/date';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { AppTabParamList } from '../../navigation';

const MANTRA_PRESETS = [
  'Radha Radha',
  'Ram Ram',
  'Om Namah Shivaya',
  'Waheguru',
  'Hare Krishna',
  'Om',
];

export const HomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  const [mantraName, setMantraName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(108);
  const [sessionActive, setSessionActive] = useState(false);
  const [lastCompletedMantra, setLastCompletedMantra] = useState('');
  const [lastCompletedAt, setLastCompletedAt] = useState('');
  const [error, setError] = useState('');
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
    ] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.count),
      AsyncStorage.getItem(STORAGE_KEYS.target),
      AsyncStorage.getItem(STORAGE_KEYS.sessionActive),
      AsyncStorage.getItem(STORAGE_KEYS.activeMantra),
      AsyncStorage.getItem(STORAGE_KEYS.lastCompletedMantra),
      AsyncStorage.getItem(STORAGE_KEYS.lastCompletedAt),
    ]);

    setCount(countRaw ? Number(countRaw) || 0 : 0);
    setTarget(targetRaw ? Number(targetRaw) || 108 : 108);
    setSessionActive(activeRaw === 'true');
    setMantraName(mantraRaw || '');
    setSelectedPreset(mantraRaw && MANTRA_PRESETS.includes(mantraRaw) ? mantraRaw : null);
    setLastCompletedMantra(completedRaw || '');
    setLastCompletedAt(completedAtRaw || '');
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadState();
    }, [loadState]),
  );

  const startChanting = useCallback(async () => {
    const trimmed = mantraName.trim();
    if (!trimmed) {
      setError('Please enter a mantra name');
      return;
    }

    setError('');
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.activeMantra, trimmed),
      AsyncStorage.setItem(STORAGE_KEYS.count, '0'),
      AsyncStorage.setItem(STORAGE_KEYS.target, String(target || 108)),
      AsyncStorage.setItem(STORAGE_KEYS.sessionActive, 'true'),
    ]);

    setCount(0);
    setSessionActive(true);
    navigation.navigate('Counter');
  }, [mantraName, navigation, target]);

  const continueChanting = useCallback(() => {
    navigation.navigate('Counter');
  }, [navigation]);

  const add108 = useCallback(() => {
    setCount(prev => {
      const next = prev + 108;
      AsyncStorage.setItem(STORAGE_KEYS.count, String(next));
      const todayKey = getLocalDateKey();
      AsyncStorage.getItem(STORAGE_KEYS.dailyCounts).then(raw => {
        const data = raw ? (JSON.parse(raw) as Record<string, number>) : {};
        data[todayKey] = (data[todayKey] || 0) + 108;
        AsyncStorage.setItem(STORAGE_KEYS.dailyCounts, JSON.stringify(data));
      });
      return next;
    });
  }, []);

  const activeMantra = useMemo(() => {
    if (mantraName.trim()) return mantraName.trim();
    if (selectedPreset) return selectedPreset;
    return '';
  }, [mantraName, selectedPreset]);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon iconSet="MaterialIcons" iconName="self-improvement" size={22} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text variant="title" weight="bold">
              Naam Jap
            </Text>
            <Text variant="sm" color="textSecondary">
              Calm, focused chanting
            </Text>
          </View>
        </View>
      </View>

      <Divider style={styles.divider} />

      <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.statsRow}>
          <View>
            <Text variant="sm" color="textSecondary">
              Today
            </Text>
            <Text variant="xl" weight="bold" color="primary">
              {count}
            </Text>
          </View>
          <View>
            <Text variant="sm" color="textSecondary">
              Target
            </Text>
            <Text variant="lg" weight="semibold">
              {target}
            </Text>
          </View>
          <View>
            <Text variant="sm" color="textSecondary">
              Remaining
            </Text>
            <Text variant="lg" weight="semibold" color="accent">
              {Math.max(target - count, 0)}
            </Text>
          </View>
        </View>

        {sessionActive && count < target ? (
          <View style={[styles.inlineBanner, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Icon iconSet="MaterialIcons" iconName="pending-actions" size={18} color={colors.secondary} />
            <View style={styles.inlineBannerText}>
              <Text weight="semibold">Pending session</Text>
              <Text variant="sm" color="textSecondary">
                Continue {activeMantra || 'your mantra'} to reach {target}.
              </Text>
            </View>
            <Button label="Continue" onPress={continueChanting} style={styles.inlineBannerButton} />
          </View>
        ) : null}

        {!sessionActive && lastCompletedMantra ? (
          <View style={[styles.inlineBanner, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Icon iconSet="MaterialIcons" iconName="verified" size={18} color={colors.accent} />
            <View style={styles.inlineBannerText}>
              <Text weight="semibold" color="accent">
                Completed 108
              </Text>
              <Text variant="sm" color="textSecondary">
                {lastCompletedMantra} {completedDate ? `· ${completedDate}` : ''}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.form}>
        <Text variant="sm" weight="semibold" style={styles.sectionTitle}>
          Choose mantra
        </Text>
        <Pressable
          onPress={() => setDropdownOpen(prev => !prev)}
          style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Text>
            {selectedPreset || 'Select from list'}
          </Text>
          <Icon iconSet="MaterialIcons" iconName={dropdownOpen ? 'expand-less' : 'expand-more'} size={22} color={colors.textSecondary} />
        </Pressable>
        {dropdownOpen ? (
          <View style={[styles.dropdownList, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            {MANTRA_PRESETS.map(item => (
              <Pressable
                key={item}
                onPress={() => {
                  setSelectedPreset(item);
                  setMantraName(item);
                  setDropdownOpen(false);
                  if (error) setError('');
                }}
                style={styles.dropdownItem}
              >
                <Text>{item}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.orRow}>
          <Divider style={[styles.orLine, { backgroundColor: colors.border }]} />
          <Text variant="xs" color="textSecondary">
            OR
          </Text>
          <Divider style={[styles.orLine, { backgroundColor: colors.border }]} />
        </View>

        <TextInput
          label="Custom mantra"
          placeholder="Type your own mantra"
          value={mantraName}
          onChangeText={text => {
            setMantraName(text);
            setSelectedPreset(MANTRA_PRESETS.includes(text) ? text : null);
            if (error) setError('');
          }}
          error={error}
        />
      </View>

      <View style={styles.actions}>
        <Button
          label={sessionActive ? 'Continue Chanting' : 'Start Chanting'}
          onPress={sessionActive ? continueChanting : startChanting}
        />
        <Button label="Add 108" variant="secondary" onPress={add108} />
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
    </Screen>
  );
};

const styles = StyleSheet.create({
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
  },
  divider: {
    marginVertical: 20,
  },
  statsCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    gap: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  inlineBannerText: {
    flex: 1,
    gap: 2,
  },
  inlineBannerButton: {
    minHeight: 36,
    paddingHorizontal: 10,
  },
  count: {
    marginTop: 4,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  form: {
    marginTop: 18,
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
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
