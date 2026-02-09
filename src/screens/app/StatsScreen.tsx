import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader, Screen, Text, Divider } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { formatRangeLabel, getLastNDates, getLastNMonths } from '../../utils/date';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

type BarPoint = {
  label: string;
  value: number;
};

export const StatsScreen: React.FC = () => {
  const { colors } = useTheme();
  const [period, setPeriod] = useState<Period>('daily');
  const [dailyCounts, setDailyCounts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.dailyCounts);
    setDailyCounts(raw ? (JSON.parse(raw) as Record<string, number>) : {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { bars, total, avg, rangeLabel } = useMemo(() => {
    if (period === 'daily') {
      const dates = getLastNDates(1);
      const value = dailyCounts[dates[0]] || 0;
      return {
        bars: [{ label: 'Today', value }],
        total: value,
        avg: value,
        rangeLabel: dates[0],
      };
    }

    if (period === 'weekly') {
      const dates = getLastNDates(7);
      const barsData = dates.map(key => ({
        label: new Date(key).toLocaleString('en-US', { weekday: 'short' }),
        value: dailyCounts[key] || 0,
      }));
      const totalValue = barsData.reduce((sum, item) => sum + item.value, 0);
      return {
        bars: barsData,
        total: totalValue,
        avg: Math.round(totalValue / 7),
        rangeLabel: formatRangeLabel(dates[0], dates[dates.length - 1]),
      };
    }

    if (period === 'monthly') {
      const dates = getLastNDates(30);
      const barsData = dates.map((key, index) => ({
        label: index % 5 === 0 ? new Date(key).getDate().toString() : '',
        value: dailyCounts[key] || 0,
      }));
      const totalValue = barsData.reduce((sum, item) => sum + item.value, 0);
      return {
        bars: barsData,
        total: totalValue,
        avg: Math.round(totalValue / 30),
        rangeLabel: formatRangeLabel(dates[0], dates[dates.length - 1]),
      };
    }

    const months = getLastNMonths(12);
    const monthTotals: BarPoint[] = months.map(month => ({
      label: month.label,
      value: 0,
    }));

    Object.entries(dailyCounts).forEach(([key, value]) => {
      const monthKey = key.slice(0, 7);
      const index = months.findIndex(item => item.key === monthKey);
      if (index >= 0) monthTotals[index].value += value;
    });

    const totalValue = monthTotals.reduce((sum, item) => sum + item.value, 0);
    return {
      bars: monthTotals,
      total: totalValue,
      avg: Math.round(totalValue / 12),
      rangeLabel: `${months[0].label} - ${months[months.length - 1].label}`,
    };
  }, [dailyCounts, period]);

  const maxValue = Math.max(1, ...bars.map(item => item.value));

  return (
    <Screen>
      <AppHeader title="Naam Jap Stats" />
      <Divider style={styles.divider} />

      <View style={[styles.periodRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map(item => {
          const active = period === item;
          return (
            <Pressable
              key={item}
              onPress={() => setPeriod(item)}
              style={[
                styles.periodButton,
                { backgroundColor: active ? colors.primary : 'transparent' },
              ]}
            >
              <Text variant="sm" weight="semibold" color={active ? 'surface' : 'textSecondary'}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="sm" color="textSecondary" style={styles.rangeLabel}>
        {rangeLabel}
      </Text>

      <View style={styles.statsRow}>
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text variant="lg" weight="bold">
            {total}
          </Text>
          <Text variant="sm" color="textSecondary">
            Total Count
          </Text>
        </View>
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text variant="lg" weight="bold">
            {avg}
          </Text>
          <Text variant="sm" color="textSecondary">
            Avg / {period === 'yearly' ? 'Month' : 'Day'}
          </Text>
        </View>
      </View>

      <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.chartArea}>
          {bars.map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.barGroup}>
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: colors.accent,
                    height: `${Math.round((item.value / maxValue) * 100)}%`,
                  },
                ]}
              />
              <Text variant="xs" color="textSecondary" style={styles.barLabel}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  divider: {
    marginVertical: 16,
  },
  periodRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    padding: 6,
    gap: 6,
  },
  periodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  rangeLabel: {
    marginTop: 12,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  chartCard: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  chartArea: {
    height: 220,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: '60%',
    borderRadius: 10,
  },
  barLabel: {
    marginTop: 6,
    textAlign: 'center',
  },
});
