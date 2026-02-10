import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppHeader, Screen, Text, Divider } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';

export const TermsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <Screen>
      <AppHeader title="Terms & Conditions" onBack={() => navigation.goBack()} />
      <Divider style={styles.divider} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text weight="semibold">Usage</Text>
          <Text variant="sm" color="textSecondary">
            Naam Jap is provided for personal spiritual practice. Please use respectfully.
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text weight="semibold">Data & Responsibility</Text>
          <Text variant="sm" color="textSecondary">
            Your data is stored locally. You are responsible for backups and device security.
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text weight="semibold">Updates</Text>
          <Text variant="sm" color="textSecondary">
            We may update these terms. Continued use means acceptance of the latest version.
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
