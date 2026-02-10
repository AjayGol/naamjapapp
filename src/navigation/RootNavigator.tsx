import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const isSignedIn = true;
  const [checked, setChecked] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const flag = await AsyncStorage.getItem(STORAGE_KEYS.onboardingDone);
      setHasOnboarded(flag === 'true');
      setChecked(true);
    };
    load();
  }, []);

  if (!checked) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!hasOnboarded ? (
        <Stack.Screen name="Onboarding">
          {() => <OnboardingScreen onDone={() => setHasOnboarded(true)} />}
        </Stack.Screen>
      ) : null}
      {isSignedIn ? (
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};
