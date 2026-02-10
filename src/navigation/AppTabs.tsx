import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { AppTabParamList } from './types';
import { HomeScreen } from '../screens/app/HomeScreen';
import { CounterScreen } from '../screens/app/CounterScreen';
import { StatsScreen } from '../screens/app/StatsScreen';
import { SettingsScreen } from '../screens/app/SettingsScreen';
import { useTheme } from '../hooks/useTheme';
import { Icon } from '../components/Icon';
import {Platform} from "react-native";

const Tab = createBottomTabNavigator<AppTabParamList>();

export const AppTabs: React.FC = () => {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 75 : 60,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? colors.border : '#888888',
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'Home'
              ? 'home'
              : route.name === 'Counter'
                ? 'add-circle'
                : route.name === 'Stats'
                  ? 'bar-chart'
                  : 'settings';
          return <Icon iconSet="MaterialIcons" iconName={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Counter" component={CounterScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};
