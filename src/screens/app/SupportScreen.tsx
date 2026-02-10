import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppHeader, Screen, Text, Divider } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';

export const SupportScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <Screen>
      <AppHeader title="Support" onBack={() => navigation.goBack()} />
      <Divider style={styles.divider} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text weight="semibold">Need help?</Text>
          <Text variant="sm" color="textSecondary">
            Email us at support@naamjap.app and we will get back to you soon.
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text weight="semibold">Suggestions</Text>
          <Text variant="sm" color="textSecondary">
            We love feedback. Share feature ideas or issues anytime.
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
