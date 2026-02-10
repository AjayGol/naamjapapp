import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Switch,
  Pressable,
  ScrollView,
} from 'react-native';
import { Screen, Text, Divider, Icon } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { persistThemeMode } from '../../store/settingsSlice';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';

export const SettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const mode = useAppSelector(state => state.settings.themeMode);
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Icon iconSet="MaterialIcons" iconName="light-mode" size={20} color={colors.textSecondary} />
              <Text>Light Mode</Text>
            </View>
            <Switch
              value={mode === 'light'}
              onValueChange={value => {
                void dispatch(persistThemeMode(value ? 'light' : 'dark'));
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          <Divider />
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Icon iconSet="MaterialIcons" iconName="vibration" size={20} color={colors.textSecondary} />
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

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable style={styles.rowItem} onPress={() => navigation.navigate('Goals')}>
            <View style={styles.rowLeft}>
              <Icon iconSet="MaterialIcons" iconName="flag" size={20} color={colors.textSecondary} />
              <Text>Goals & Reminders</Text>
            </View>
            <Icon iconSet="MaterialIcons" iconName="chevron-right" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable style={styles.rowItem} onPress={() => navigation.navigate('SelectNaam')}>
            <View style={styles.rowLeft}>
              <Icon iconSet="MaterialIcons" iconName="spa" size={20} color={colors.textSecondary} />
              <Text>Select Naam</Text>
            </View>
            <Icon iconSet="MaterialIcons" iconName="chevron-right" size={22} color={colors.textSecondary} />
          </Pressable>
          <Divider />
          <Pressable style={styles.rowItem} onPress={() => navigation.navigate('History')}>
            <View style={styles.rowLeft}>
              <Icon iconSet="MaterialIcons" iconName="timeline" size={20} color={colors.textSecondary} />
              <Text>Session History</Text>
            </View>
            <Icon iconSet="MaterialIcons" iconName="chevron-right" size={22} color={colors.textSecondary} />
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
          <Pressable style={styles.rowItem} onPress={() => {}}>
            <View style={styles.rowLeft}>
              <Icon iconSet="MaterialIcons" iconName="refresh" size={20} color={colors.textSecondary} />
              <Text>Reset Count</Text>
            </View>
            <Icon iconSet="MaterialIcons" iconName="chevron-right" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable style={styles.rowItem} onPress={() => {}}>
            <View style={styles.rowLeft}>
              <Icon iconSet="MaterialIcons" iconName="language" size={20} color={colors.textSecondary} />
              <Text>Story Language</Text>
            </View>
            <View style={styles.rowRight}>
              <Text color="textSecondary">English</Text>
              <Icon iconSet="MaterialIcons" iconName="expand-more" size={20} color={colors.textSecondary} />
            </View>
          </Pressable>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable style={styles.rowItem} onPress={() => {}}>
            <View style={styles.rowLeft}>
              <Icon iconSet="MaterialIcons" iconName="chat-bubble-outline" size={20} color={colors.textSecondary} />
              <Text>Write Your Feedback</Text>
            </View>
          </Pressable>
          <Divider />
          <Pressable style={styles.rowItem} onPress={() => {}}>
            <View style={styles.rowLeft}>
              <Icon iconSet="MaterialIcons" iconName="star-border" size={20} color={colors.textSecondary} />
              <Text>Rate Our App</Text>
            </View>
          </Pressable>
          <Divider />
          <Pressable style={styles.rowItem} onPress={() => {}}>
            <View style={styles.rowLeft}>
              <Icon iconSet="MaterialIcons" iconName="share" size={20} color={colors.textSecondary} />
              <Text>Invite Friends & Family</Text>
            </View>
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

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable style={styles.rowItem} onPress={() => navigation.navigate('PrivacyPolicy')}>
            <View style={styles.rowLeft}>
              <Icon iconSet="MaterialIcons" iconName="policy" size={20} color={colors.textSecondary} />
              <Text>Privacy Policy</Text>
            </View>
            <Icon iconSet="MaterialIcons" iconName="chevron-right" size={22} color={colors.textSecondary} />
          </Pressable>
          <Divider />
          <Pressable style={styles.rowItem} onPress={() => navigation.navigate('Terms')}>
            <View style={styles.rowLeft}>
              <Icon iconSet="MaterialIcons" iconName="gavel" size={20} color={colors.textSecondary} />
              <Text>Terms & Conditions</Text>
            </View>
            <Icon iconSet="MaterialIcons" iconName="chevron-right" size={22} color={colors.textSecondary} />
          </Pressable>
          <Divider />
          <Pressable style={styles.rowItem} onPress={() => navigation.navigate('About')}>
            <View style={styles.rowLeft}>
              <Icon iconSet="MaterialIcons" iconName="person" size={20} color={colors.textSecondary} />
              <Text>About Me</Text>
            </View>
            <Icon iconSet="MaterialIcons" iconName="chevron-right" size={22} color={colors.textSecondary} />
          </Pressable>
          <Divider />
          <Pressable style={styles.rowItem} onPress={() => navigation.navigate('Support')}>
            <View style={styles.rowLeft}>
              <Icon iconSet="MaterialIcons" iconName="support-agent" size={20} color={colors.textSecondary} />
              <Text>Support</Text>
            </View>
            <Icon iconSet="MaterialIcons" iconName="chevron-right" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text variant="sm" color="textSecondary">
            Let’s Connect
          </Text>
          <View style={styles.socialRow}>
            <Icon iconSet="MaterialIcons" iconName="mail-outline" size={22} color={colors.textSecondary} />
            <Icon iconSet="MaterialIcons" iconName="language" size={22} color={colors.textSecondary} />
            <Icon iconSet="MaterialIcons" iconName="alternate-email" size={22} color={colors.textSecondary} />
            <Icon iconSet="MaterialIcons" iconName="camera-alt" size={22} color={colors.textSecondary} />
          </View>
          <Text variant="xs" color="textSecondary">
            Version 1.0.12
          </Text>
        </View>
      </ScrollView>

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
    paddingBottom : 10
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
});
