import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';

export type AppHeaderProps = {
  title: string;
  subtitle?: string;
};

export const AppHeader: React.FC<AppHeaderProps> = ({ title, subtitle }) => {
  return (
    <View style={styles.container}>
      <Text variant="title" weight="bold">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="sm" color="textSecondary">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
});
