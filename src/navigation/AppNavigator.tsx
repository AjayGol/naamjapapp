import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AppStackParamList } from './types';
import { AppTabs } from './AppTabs';
import { SelectNaamScreen } from '../screens/app/SelectNaamScreen';
import { HistoryScreen } from '../screens/app/HistoryScreen';
import { GoalsScreen } from '../screens/app/GoalsScreen';
import { PrivacyPolicyScreen } from '../screens/app/PrivacyPolicyScreen';
import { TermsScreen } from '../screens/app/TermsScreen';
import { AboutScreen } from '../screens/app/AboutScreen';
import { SupportScreen } from '../screens/app/SupportScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={AppTabs} />
      <Stack.Screen name="SelectNaam" component={SelectNaamScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
    </Stack.Navigator>
  );
};
