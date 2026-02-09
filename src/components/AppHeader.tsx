import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { useTheme } from '../hooks/useTheme';

export type AppHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  onBack,
  right,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backButton}>
            <Icon
              iconSet="MaterialIcons"
              iconName="chevron-left"
              size={28}
              color={colors.textPrimary}
            />
          </Pressable>
        ) : null}
        <View style={styles.titleWrap}>
          <Text variant="title" weight="bold">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="sm" color="textSecondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    gap: 6,
  },
  right: {
    alignItems: 'flex-end',
  },
});
