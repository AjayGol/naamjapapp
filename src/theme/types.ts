export type ThemeMode = 'system' | 'light' | 'dark';

export type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
};

export type Theme = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
};
