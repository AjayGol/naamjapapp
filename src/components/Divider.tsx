import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export const Divider: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { colors } = useTheme();
  return <View style={[styles.base, { backgroundColor: colors.border }, style]} />;
};

const styles = StyleSheet.create({
  base: {
    height: 1,
    width: '100%',
    opacity: 0.8,
  },
});
