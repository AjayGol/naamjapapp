import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppHeader, Screen, Text, Divider } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';

export const AboutScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <Screen>
      <AppHeader title="About" onBack={() => navigation.goBack()} />
      <Divider style={styles.divider} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text weight="semibold">Naam Jap</Text>
          <Text variant="sm" color="textSecondary">
            A simple spiritual companion to build daily chanting habits with calm focus.
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text weight="semibold">Developer</Text>
          <Text variant="sm" color="textSecondary">
            Made with devotion and care. Thank you for supporting the journey.
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
