import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader, Screen, Text, Divider } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { STORAGE_KEYS } from '../../utils/storageKeys';

type SessionEntry = {
  id: string;
  mantra: string;
  count: number;
  target: number;
  mood?: string;
  completedAt: string;
};

export const HistoryScreen: React.FC = () => {
  const { colors } = useTheme();
  const [items, setItems] = useState<SessionEntry[]>([]);

  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.sessionHistory);
    const list = raw ? (JSON.parse(raw) as SessionEntry[]) : [];
    setItems(list);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <AppHeader title="Session History" />
      <Divider style={styles.divider} />
      {items.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text weight="semibold">No sessions yet</Text>
          <Text variant="sm" color="textSecondary">
            Complete your first 108 to see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const date = new Date(item.completedAt);
            return (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.cardRow}>
                  <Text weight="semibold">{item.mantra}</Text>
                  <Text variant="xs" color="textSecondary">
                    {date.toDateString()}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text variant="sm" color="textSecondary">
                    Count {item.count}/{item.target}
                  </Text>
                  {item.mood ? (
                    <Text variant="sm" color="textSecondary">
                      Mood: {item.mood}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  divider: {
    marginVertical: 16,
  },
  list: {
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
});
