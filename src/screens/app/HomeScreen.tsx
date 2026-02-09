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

export const HomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  const stackNavigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [mantraName, setMantraName] = useState('');
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
    setLastCompletedMantra(completedRaw || '');
    setLastCompletedAt(completedAtRaw || '');
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadState();
    }, [loadState]),
  );

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
      AsyncStorage.setItem(STORAGE_KEYS.target, String(target || 108)),
      AsyncStorage.setItem(STORAGE_KEYS.sessionActive, 'true'),
    ]);

    setCount(0);
    setSessionActive(true);
    navigation.navigate('Counter');
  }, [activeMantra, navigation, target]);

  const continueChanting = useCallback(() => {
    navigation.navigate('Counter');
  }, [navigation]);

  const activeMantra = useMemo(() => mantraName.trim(), [mantraName]);

  const openSelectNaam = useCallback(() => {
    stackNavigation.navigate('SelectNaam');
  }, [stackNavigation]);

  const progress = target > 0 ? Math.min(count / target, 1) : 0;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
            {sessionActive ? (
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Icon
                  iconSet="MaterialIcons"
                  iconName="radio-button-checked"
                  size={14}
                  color={colors.secondary}
                />
                <Text variant="xs" color="textSecondary">
                  Active
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Divider style={styles.divider} />

        <View
          style={[
            styles.progressCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.progressHeader}>
            <View>
              <Text variant="sm" color="textSecondary">
                Today
              </Text>
              <Text variant="xl" weight="bold" color="primary">
                {count}
              </Text>
            </View>
            <View style={styles.targetBox}>
              <Text variant="xs" color="textSecondary">
                Target
              </Text>
              <Text variant="lg" weight="semibold">
                {target}
              </Text>
            </View>
          </View>
          <View
            style={[styles.progressTrack, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(progress * 100)}%`,
                  backgroundColor: colors.accent,
                },
              ]}
            />
          </View>
          <Text variant="xs" color="textSecondary">
            Remaining {Math.max(target - count, 0)}
          </Text>
        </View>

        {sessionActive && count < target ? (
          <View
            style={[
              styles.bannerCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Icon
              iconSet="MaterialIcons"
              iconName="pending-actions"
              size={18}
              color={colors.secondary}
            />
            <View style={styles.bannerText}>
              <Text weight="semibold">Continue your session</Text>
              <Text variant="sm" color="textSecondary">
                {activeMantra || 'Your mantra'} · {target - count} left
              </Text>
            </View>
            <Button
              label="Continue"
              onPress={continueChanting}
              style={styles.bannerButton}
            />
          </View>
        ) : null}

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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  divider: {
    marginVertical: 16,
  },
  progressCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetBox: {
    alignItems: 'flex-end',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  bannerText: {
    flex: 1,
    gap: 2,
  },
  bannerButton: {
    minHeight: 36,
    paddingHorizontal: 10,
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
