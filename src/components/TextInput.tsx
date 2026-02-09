import React from 'react';
import { View, TextInput as RNTextInput, StyleSheet, TextInputProps as RNTextInputProps } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Text } from './Text';

export type TextInputProps = RNTextInputProps & {
  label?: string;
  error?: string;
};

export const TextInput: React.FC<TextInputProps> = ({ label, error, style, ...rest }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {label ? (
        <Text variant="sm" weight="medium" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <RNTextInput
        {...rest}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          { borderColor: error ? colors.error : colors.border, color: colors.textPrimary },
          style,
        ]}
      />
      {error ? (
        <Text variant="xs" color="error" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  error: {
    marginTop: 6,
  },
});
