import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { enableScreens } from 'react-native-screens';
import { store } from './src/store';
import { ThemeProvider } from './src/theme';
import { RootNavigator } from './src/navigation';
import { useTheme } from './src/hooks/useTheme';
import { useAppDispatch } from './src/hooks/redux';
import { hydrateSettings } from './src/store/settingsSlice';

enableScreens();

const AppContent: React.FC = () => {
  const { isDark, colors } = useTheme();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(hydrateSettings());
  }, [dispatch]);

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
