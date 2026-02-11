import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Switch,
  Pressable,
  ScrollView,
  Linking,
  Share,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Screen, Text, Divider, Icon, Button } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { persistThemeMode } from '../../store/settingsSlice';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { getLocalDateKey } from '../../utils/date';

export const SettingsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const mode = useAppSelector(state => state.settings.themeMode);
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [resetDate, setResetDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetToastVisible, setResetToastVisible] = useState(false);
  const resetToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supportEmail = 'support@naamjap.app';
  const appStoreUrl = 'https://apps.apple.com/app/id0000000000';
  const playStoreUrl =
    'https://play.google.com/store/apps/details?id=com.naamjapapp';

  const handleFeedback = () => {
    Linking.openURL(`mailto:${supportEmail}?subject=Naam%20Jap%20Feedback`);
  };

  const handleRate = () => {
    const url = Platform.OS === 'ios' ? appStoreUrl : playStoreUrl;
    Linking.openURL(url);
  };

  const handleInvite = async () => {
    const url = Platform.OS === 'ios' ? appStoreUrl : playStoreUrl;
    await Share.share({
      message: `Try Naam Jap for daily chanting.\n${url}`,
    });
  };

  const normalizePickedDate = (date: Date) => {
    const year = date.getFullYear();
    const currentYear = new Date().getFullYear();
    if (year > currentYear + 5) {
      const fixed = new Date(date);
      fixed.setFullYear(year - 543);
      return fixed;
    }
    return date;
  };

  const minResetDate = new Date(new Date().getFullYear() - 5, 0, 1);
  const maxResetDate = new Date(new Date().getFullYear() + 5, 11, 31);

  const openResetPicker = () => {
    const now = new Date();
    setResetDate(now);
    setTempDate(now);
    setShowDatePicker(true);
  };

  const openResetConfirm = (date: Date) => {
    setResetDate(normalizePickedDate(date));
    setShowResetConfirm(true);
  };

  const formatResetDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleResetForDate = async () => {
    const dateKey = getLocalDateKey(resetDate);
    const todayKey = getLocalDateKey();
    setResetting(true);
    try {
      const [countsRaw, historyRaw, lastCompletedAtRaw, malaRaw] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.dailyCounts),
          AsyncStorage.getItem(STORAGE_KEYS.sessionHistory),
          AsyncStorage.getItem(STORAGE_KEYS.lastCompletedAt),
          AsyncStorage.getItem(STORAGE_KEYS.malaCount),
        ]);

      const counts = countsRaw
        ? (JSON.parse(countsRaw) as Record<string, number>)
        : {};
      if (counts[dateKey]) {
        delete counts[dateKey];
      }

      const history = historyRaw
        ? (JSON.parse(historyRaw) as { completedAt: string }[])
        : [];
      const filteredHistory = history.filter(entry => {
        const entryKey = getLocalDateKey(new Date(entry.completedAt));
        return entryKey !== dateKey;
      });
      const removedCount = history.length - filteredHistory.length;

      const currentMala = malaRaw ? Number(malaRaw) || 0 : 0;
      const nextMala = Math.max(currentMala - removedCount, 0);

      const updates: Array<Promise<void>> = [
        AsyncStorage.setItem(STORAGE_KEYS.dailyCounts, JSON.stringify(counts)),
        AsyncStorage.setItem(
          STORAGE_KEYS.sessionHistory,
          JSON.stringify(filteredHistory),
        ),
      ];

      if (removedCount > 0) {
        updates.push(
          AsyncStorage.setItem(STORAGE_KEYS.malaCount, String(nextMala)),
        );
      }

      if (
        lastCompletedAtRaw &&
        getLocalDateKey(new Date(lastCompletedAtRaw)) === dateKey
      ) {
        updates.push(
          AsyncStorage.setItem(STORAGE_KEYS.lastCompletedAt, ''),
          AsyncStorage.setItem(STORAGE_KEYS.lastCompletedMantra, ''),
        );
      }

      if (dateKey === todayKey) {
        updates.push(
          AsyncStorage.setItem(STORAGE_KEYS.count, '0'),
          AsyncStorage.setItem(STORAGE_KEYS.sessionActive, 'false'),
        );
      }

      await Promise.all(updates);
      setShowResetConfirm(false);
      setResetToastVisible(true);
      if (resetToastTimer.current) {
        clearTimeout(resetToastTimer.current);
      }
      resetToastTimer.current = setTimeout(() => {
        setResetToastVisible(false);
      }, 1800);
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (resetToastTimer.current) {
        clearTimeout(resetToastTimer.current);
      }
    };
  }, []);

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="title" weight="bold">
          Settings
        </Text>
        <Text variant="sm" color="textSecondary">
          Calm, focused preferences
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Icon
                iconSet="MaterialIcons"
                iconName="dark-mode"
                size={20}
                color={colors.textSecondary}
              />
              <Text>Dark Mode</Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={value => {
                void dispatch(persistThemeMode(value ? 'dark' : 'light'));
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          <Divider />
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Icon
                iconSet="MaterialIcons"
                iconName="vibration"
                size={20}
                color={colors.textSecondary}
              />
              <Text>App Haptics</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          {/*<Divider />*/}
          {/*<Pressable style={styles.rowItem} onPress={() => {}}>*/}
          {/*  <View style={styles.rowLeft}>*/}
          {/*    <Icon iconSet="MaterialIcons" iconName="history" size={20} color={colors.textSecondary} />*/}
          {/*    <Text>Wrapped 2025</Text>*/}
          {/*  </View>*/}
          {/*  <Icon iconSet="MaterialIcons" iconName="chevron-right" size={22} color={colors.textSecondary} />*/}
          {/*</Pressable>*/}
        </View>

        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Pressable
            style={styles.rowItem}
            onPress={() => navigation.navigate('Goals')}
          >
            <View style={styles.rowLeft}>
              <Icon
                iconSet="MaterialIcons"
                iconName="flag"
                size={20}
                color={colors.textSecondary}
              />
              <Text>Goals & Reminders</Text>
            </View>
            <Icon
              iconSet="MaterialIcons"
              iconName="chevron-right"
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Pressable
            style={styles.rowItem}
            onPress={() => navigation.navigate('SelectNaam')}
          >
            <View style={styles.rowLeft}>
              <Icon
                iconSet="MaterialIcons"
                iconName="spa"
                size={20}
                color={colors.textSecondary}
              />
              <Text>Select Naam</Text>
            </View>
            <Icon
              iconSet="MaterialIcons"
              iconName="chevron-right"
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
          <Divider />
          <Pressable
            style={styles.rowItem}
            onPress={() => navigation.navigate('History')}
          >
            <View style={styles.rowLeft}>
              <Icon
                iconSet="MaterialIcons"
                iconName="timeline"
                size={20}
                color={colors.textSecondary}
              />
              <Text>Session History</Text>
            </View>
            <Icon
              iconSet="MaterialIcons"
              iconName="chevron-right"
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
          <Divider />
          {/*<Pressable style={styles.rowItem} onPress={() => {}}>*/}
          {/*  <View style={styles.rowLeft}>*/}
          {/*    <Icon iconSet="MaterialIcons" iconName="add" size={20} color={colors.textSecondary} />*/}
          {/*    <Text>Add Naam Logs</Text>*/}
          {/*  </View>*/}
          {/*  <Icon iconSet="MaterialIcons" iconName="chevron-right" size={22} color={colors.textSecondary} />*/}
          {/*</Pressable>*/}
          <Divider />
          <Pressable style={styles.rowItem} onPress={openResetPicker}>
            <View style={styles.rowLeft}>
              <Icon
                iconSet="MaterialIcons"
                iconName="refresh"
                size={20}
                color={colors.textSecondary}
              />
              <Text>Reset Count</Text>
            </View>
            <Icon
              iconSet="MaterialIcons"
              iconName="chevron-right"
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Pressable style={styles.rowItem} onPress={() => {}}>
            <View style={styles.rowLeft}>
              <Icon
                iconSet="MaterialIcons"
                iconName="language"
                size={20}
                color={colors.textSecondary}
              />
              <Text>Story Language</Text>
            </View>
            <View style={styles.rowRight}>
              <Text color="textSecondary">English</Text>
              <Icon
                iconSet="MaterialIcons"
                iconName="expand-more"
                size={20}
                color={colors.textSecondary}
              />
            </View>
          </Pressable>
        </View>

        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Pressable style={styles.rowItem} onPress={handleFeedback}>
            <View style={styles.rowLeft}>
              <Icon
                iconSet="MaterialIcons"
                iconName="chat-bubble-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text>Write Your Feedback</Text>
            </View>
            <Icon
              iconSet="MaterialIcons"
              iconName="chevron-right"
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
          <Divider />
          <Pressable style={styles.rowItem} onPress={handleRate}>
            <View style={styles.rowLeft}>
              <Icon
                iconSet="MaterialIcons"
                iconName="star-border"
                size={20}
                color={colors.textSecondary}
              />
              <Text>Rate Our App</Text>
            </View>
            <Icon
              iconSet="MaterialIcons"
              iconName="chevron-right"
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
          <Divider />
          <Pressable style={styles.rowItem} onPress={handleInvite}>
            <View style={styles.rowLeft}>
              <Icon
                iconSet="MaterialIcons"
                iconName="share"
                size={20}
                color={colors.textSecondary}
              />
              <Text>Invite Friends & Family</Text>
            </View>
            <Icon
              iconSet="MaterialIcons"
              iconName="chevron-right"
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
          {/*<Divider />*/}
          {/*<Pressable style={styles.rowItem} onPress={() => {}}>*/}
          {/*  <View style={styles.rowLeft}>*/}
          {/*    <Icon iconSet="MaterialIcons" iconName="notes" size={20} color={colors.textSecondary} />*/}
          {/*    <Text>Release Notes</Text>*/}
          {/*  </View>*/}
          {/*</Pressable>*/}
          {/*<Divider />*/}
          {/*<Pressable style={styles.rowItem} onPress={() => {}}>*/}
          {/*  <View style={styles.rowLeft}>*/}
          {/*    <Icon iconSet="MaterialIcons" iconName="playlist-add-check" size={20} color={colors.textSecondary} />*/}
          {/*    <Text>Upcoming Features</Text>*/}
          {/*  </View>*/}
          {/*</Pressable>*/}
        </View>

        {/*<View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>*/}
        {/*  <Pressable style={styles.rowItem} onPress={() => {}}>*/}
        {/*    <View style={styles.rowLeft}>*/}
        {/*      <Icon iconSet="MaterialIcons" iconName="cloud-upload" size={20} color={colors.textSecondary} />*/}
        {/*      <Text>Backup & Restore (Beta)</Text>*/}
        {/*    </View>*/}
        {/*  </Pressable>*/}
        {/*</View>*/}

        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Pressable
            style={styles.rowItem}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <View style={styles.rowLeft}>
              <Icon
                iconSet="MaterialIcons"
                iconName="policy"
                size={20}
                color={colors.textSecondary}
              />
              <Text>Privacy Policy</Text>
            </View>
            <Icon
              iconSet="MaterialIcons"
              iconName="chevron-right"
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
          <Divider />
          <Pressable
            style={styles.rowItem}
            onPress={() => navigation.navigate('Terms')}
          >
            <View style={styles.rowLeft}>
              <Icon
                iconSet="MaterialIcons"
                iconName="gavel"
                size={20}
                color={colors.textSecondary}
              />
              <Text>Terms & Conditions</Text>
            </View>
            <Icon
              iconSet="MaterialIcons"
              iconName="chevron-right"
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
          <Divider />
          <Pressable
            style={styles.rowItem}
            onPress={() => navigation.navigate('About')}
          >
            <View style={styles.rowLeft}>
              <Icon
                iconSet="MaterialIcons"
                iconName="person"
                size={20}
                color={colors.textSecondary}
              />
              <Text>About Me</Text>
            </View>
            <Icon
              iconSet="MaterialIcons"
              iconName="chevron-right"
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
          <Divider />
          <Pressable
            style={styles.rowItem}
            onPress={() => navigation.navigate('Support')}
          >
            <View style={styles.rowLeft}>
              <Icon
                iconSet="MaterialIcons"
                iconName="support-agent"
                size={20}
                color={colors.textSecondary}
              />
              <Text>Support</Text>
            </View>
            <Icon
              iconSet="MaterialIcons"
              iconName="chevron-right"
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        {/*<View style={styles.footer}>*/}
        {/*  <Text variant="sm" color="textSecondary">*/}
        {/*    Let’s Connect*/}
        {/*  </Text>*/}
        {/*  <View style={styles.socialRow}>*/}
        {/*    <Icon*/}
        {/*      iconSet="MaterialIcons"*/}
        {/*      iconName="mail-outline"*/}
        {/*      size={22}*/}
        {/*      color={colors.textSecondary}*/}
        {/*    />*/}
        {/*    <Icon*/}
        {/*      iconSet="MaterialIcons"*/}
        {/*      iconName="language"*/}
        {/*      size={22}*/}
        {/*      color={colors.textSecondary}*/}
        {/*    />*/}
        {/*    <Icon*/}
        {/*      iconSet="MaterialIcons"*/}
        {/*      iconName="alternate-email"*/}
        {/*      size={22}*/}
        {/*      color={colors.textSecondary}*/}
        {/*    />*/}
        {/*    <Icon*/}
        {/*      iconSet="MaterialIcons"*/}
        {/*      iconName="camera-alt"*/}
        {/*      size={22}*/}
        {/*      color={colors.textSecondary}*/}
        {/*    />*/}
        {/*  </View>*/}
        {/*  <Text variant="xs" color="textSecondary">*/}
        {/*    Version 1.0.12*/}
        {/*  </Text>*/}
        {/*</View>*/}
      </ScrollView>

      {Platform.OS === 'android' && showDatePicker ? (
        <DateTimePicker
          value={resetDate}
          mode="date"
          display="calendar"
          locale="en-US"
          themeVariant={isDark ? 'dark' : 'light'}
          textColor={colors.textPrimary}
          minimumDate={minResetDate}
          maximumDate={maxResetDate}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (event.type === 'set' && date) {
              openResetConfirm(normalizePickedDate(date));
            }
          }}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={showDatePicker} transparent animationType="slide">
          <Pressable
            style={styles.timeBackdrop}
            onPress={() => setShowDatePicker(false)}
          >
            <Pressable
              style={[styles.timeSheet, { backgroundColor: colors.surface }]}
              onPress={() => {}}
            >
              <View
                style={[styles.sheetHandle, { backgroundColor: colors.border }]}
              />
              <View
                style={[
                  styles.timeHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <Text color="textSecondary">Cancel</Text>
                </Pressable>
                <Text weight="semibold">Select date</Text>
                <Pressable
                  onPress={() => {
                    setShowDatePicker(false);
                    openResetConfirm(normalizePickedDate(tempDate));
                  }}
                >
                  <Text color="primary">Done</Text>
                </Pressable>
              </View>
              <View style={{ alignItems: 'center' }}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  locale="en-US"
                  themeVariant={isDark ? 'dark' : 'light'}
                  textColor={colors.textPrimary}
                  minimumDate={minResetDate}
                  maximumDate={maxResetDate}
                  onChange={(event, date) => {
                    if (date) {
                      setTempDate(normalizePickedDate(date));
                    }
                  }}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      <Modal visible={showResetConfirm} transparent animationType="slide">
        <View style={styles.confirmBackdrop}>
          <Pressable
            style={styles.confirmDismiss}
            onPress={() => setShowResetConfirm(false)}
          />
          <View
            style={[
              styles.confirmSheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.sheetHandle, { backgroundColor: colors.border }]}
            />
            <Text variant="lg" weight="bold">
              Reset Count for {formatResetDate(resetDate)}?
            </Text>
            <Text variant="sm" color="textSecondary" style={styles.confirmBody}>
              This will reset the Naam Jap count for this day. This action
              cannot be undone.
            </Text>
            <View style={styles.confirmActions}>
              <Button
                label="Reset"
                onPress={handleResetForDate}
                loading={resetting}
                style={[
                  styles.confirmButton,
                  { backgroundColor: colors.error, borderColor: colors.error },
                ]}
              />
              <Button
                label="Cancel"
                variant="outline"
                onPress={() => setShowResetConfirm(false)}
                style={styles.confirmButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {resetToastVisible ? (
        <View
          style={[
            styles.toast,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Icon
            iconSet="MaterialIcons"
            iconName="check-circle"
            size={18}
            color={colors.accent}
          />
          <Text weight="semibold">Reset successfully</Text>
        </View>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    alignItems: 'flex-start',
    gap: 6,
    paddingBottom: 10,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 6,
    gap: 0,
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
  footer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timeBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  timeSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 18,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sheetHandle: {
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  confirmDismiss: {
    flex: 1,
  },
  confirmSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 12,
  },
  confirmBody: {
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  confirmButton: {
    flex: 1,
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
