import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export type ScreenProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export const Screen: React.FC<ScreenProps> = ({ children, style }) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.base, { backgroundColor: colors.background }, style]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  base: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
