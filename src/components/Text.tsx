import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export type TextVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'title';
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type TextColor = 'text' | 'primary' | 'secondary';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: TextColor;
};

const fontSizes: Record<TextVariant, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  title: 28,
};

const fontWeights: Record<TextWeight, RNTextProps['style']> = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
};

export const Text: React.FC<TextProps> = ({
  variant = 'md',
  weight = 'regular',
  color = 'text',
  style,
  children,
  ...rest
}) => {
  const { colors } = useTheme();
  const textColor =
    color === 'primary' ? colors.primary : color === 'secondary' ? colors.secondary : colors.text;

  return (
    <RNText
      {...rest}
      style={[
        styles.base,
        { fontSize: fontSizes[variant], color: textColor },
        fontWeights[weight],
        style,
      ]}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
