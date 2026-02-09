import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { AppTabParamList } from './types';
import { HomeScreen } from '../screens/app/HomeScreen';
import { SettingsScreen } from '../screens/app/SettingsScreen';
import { useTheme } from '../hooks/useTheme';
import { Icon } from '../components/Icon';

const Tab = createBottomTabNavigator<AppTabParamList>();

export const AppTabs: React.FC = () => {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? colors.border : '#888888',
        tabBarIcon: ({ color, size }) => {
          const iconName = route.name === 'Home' ? 'home' : 'settings';
          return <Icon iconSet="MaterialIcons" iconName={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};
