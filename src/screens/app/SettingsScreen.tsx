import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen, Text, Button, TextInput, Divider, Loader, Icon } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { persistThemeMode } from '../../store/settingsSlice';

export const SettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const mode = useAppSelector(state => state.settings.themeMode);
  const [name, setName] = useState('');

  return (
    <Screen>
      <View style={styles.header}>
        <Icon iconSet="MaterialIcons" iconName="tune" size={24} color={colors.primary} />
        <Text variant="title" weight="bold">
          Settings
        </Text>
        <Text variant="sm" color="textSecondary">
          Customize your practice
        </Text>
      </View>

      <Divider style={styles.divider} />

      <Text variant="lg" weight="semibold">
        Theme
      </Text>
      <View style={styles.row}>
        <Button
          label={`System ${mode === 'system' ? '✓' : ''}`}
          variant="outline"
          onPress={() => dispatch(persistThemeMode('system'))}
        />
        <Button
          label={`Light ${mode === 'light' ? '✓' : ''}`}
          variant="outline"
          onPress={() => dispatch(persistThemeMode('light'))}
        />
        <Button
          label={`Dark ${mode === 'dark' ? '✓' : ''}`}
          variant="outline"
          onPress={() => dispatch(persistThemeMode('dark'))}
        />
      </View>

      <Divider style={styles.divider} />

      <Text variant="lg" weight="semibold">
        Profile
      </Text>
      <TextInput
        label="Display name"
        placeholder="Your name"
        value={name}
        onChangeText={setName}
      />
      <View style={styles.helperRow}>
        <Icon iconSet="MaterialIcons" iconName="info" size={18} color={colors.secondary} />
        <Text variant="xs" color="textSecondary">
          This is just a demo field
        </Text>
      </View>

      <Divider style={styles.divider} />

      <Text variant="lg" weight="semibold">
        Loading state
      </Text>
      <Loader />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    gap: 6,
  },
  divider: {
    marginVertical: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
});
