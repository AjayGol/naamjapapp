import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppHeader, Screen, Text, Divider } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';

export const PrivacyPolicyScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <Screen>
      <AppHeader title="Privacy Policy" onBack={() => navigation.goBack()} />
      <Divider style={styles.divider} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text weight="semibold">Your Privacy</Text>
          <Text variant="sm" color="textSecondary">
            Naam Jap stores your chanting data only on your device (count, goals, and history).
            We do not collect or sell personal information.
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text weight="semibold">What We Store</Text>
          <Text variant="sm" color="textSecondary">• Mantra selections and favorites</Text>
          <Text variant="sm" color="textSecondary">• Daily counts and session history</Text>
          <Text variant="sm" color="textSecondary">• Reminder settings</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text weight="semibold">Contact</Text>
          <Text variant="sm" color="textSecondary">
            If you have privacy questions, contact us at support@naamjap.app.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  divider: {
    marginVertical: 16,
  },
  content: {
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
});
