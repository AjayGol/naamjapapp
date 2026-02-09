import React, { createContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from './colors';
import type { Theme } from './types';
import { useAppSelector } from '../hooks/redux';

export const ThemeContext = createContext<Theme>({
  mode: 'system',
  isDark: false,
  colors: LightColors,
});

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const systemScheme = useColorScheme();
  const themeMode = useAppSelector(state => state.settings.themeMode);

  const isDark = useMemo(() => {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return systemScheme === 'dark';
  }, [systemScheme, themeMode]);

  const value = useMemo<Theme>(() => {
    return {
      mode: themeMode,
      isDark,
      colors: isDark ? DarkColors : LightColors,
    };
  }, [isDark, themeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
