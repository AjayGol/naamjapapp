import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AppStackParamList } from './types';
import { AppTabs } from './AppTabs';
import { SelectNaamScreen } from '../screens/app/SelectNaamScreen';
import { HistoryScreen } from '../screens/app/HistoryScreen';
import { GoalsScreen } from '../screens/app/GoalsScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={AppTabs} />
      <Stack.Screen name="SelectNaam" component={SelectNaamScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
    </Stack.Navigator>
  );
};
