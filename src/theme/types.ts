export type ThemeMode = 'system' | 'light' | 'dark';

export type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accent: string;
  error: string;
};

export type Theme = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
};
