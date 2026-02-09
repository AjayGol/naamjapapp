import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen, Text, Button, Divider, Icon } from '../../components';
import { useTheme } from '../../hooks/useTheme';

export const HomeScreen: React.FC = () => {
  const { colors, isDark } = useTheme();

  return (
    <Screen>
      <View style={styles.header}>
        <Icon iconSet="MaterialIcons" iconName="self-improvement" size={28} color={colors.primary} />
        <Text variant="title" weight="bold" style={styles.title}>
          Naam Jap
        </Text>
        <Text variant="sm" color="secondary">
          Calm, focused chanting
        </Text>
      </View>

      <Divider style={styles.divider} />

      <View
        style={[
          styles.card,
          { borderColor: colors.border, backgroundColor: isDark ? '#121212' : '#F7F7F7' },
        ]}
      >
        <Text variant="lg" weight="semibold">
          Today’s count
        </Text>
        <Text variant="xl" weight="bold" color="primary" style={styles.count}>
          108
        </Text>
        <Text variant="sm" color="secondary">
          Daily goal: 1000
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="Start Chanting" onPress={() => {}} />
        <Button label="Add 108" variant="secondary" onPress={() => {}} />
        <Button label="Reset" variant="outline" onPress={() => {}} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    gap: 6,
  },
  title: {
    marginTop: 6,
  },
  divider: {
    marginVertical: 20,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 6,
  },
  count: {
    marginTop: 4,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
});
