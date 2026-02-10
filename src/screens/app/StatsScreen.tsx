import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader, Screen, Text, Divider } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import {
  formatRangeLabel,
  getLocalDateKey,
  getLastNDates,
  getLastNMonths,
} from '../../utils/date';
import { BarChart } from 'react-native-gifted-charts';
import { Platform } from 'react-native';

type Period = 'weekly' | 'monthly' | 'yearly';

type BarPoint = {
  label: string;
  value: number;
};

export const StatsScreen: React.FC = () => {
  const { colors } = useTheme();
  const [period, setPeriod] = useState<Period>('weekly');
  const [dailyCounts, setDailyCounts] = useState<Record<string, number>>({});

  const getCurrentWeekDates = useCallback(() => {
    const today = new Date();
    const day = today.getDay(); // 0=Sun, 1=Mon, ...
    const diffToMonday = (day + 6) % 7;
    const start = new Date(today);
    start.setDate(today.getDate() - diffToMonday);
    const dates: string[] = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(getLocalDateKey(d));
    }
    return dates;
  }, []);

  const getCurrentMonthDates = useCallback(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysInMonth = end.getDate();
    const dates: string[] = [];
    for (let i = 0; i < daysInMonth; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(getLocalDateKey(d));
    }
    return dates;
  }, []);

  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.dailyCounts);
    setDailyCounts(raw ? (JSON.parse(raw) as Record<string, number>) : {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { bars, total, avg, rangeLabel } = useMemo(() => {
    if (period === 'weekly') {
      const dates = getCurrentWeekDates();
      const barsData = dates.map(key => ({
        label: `${new Date(key).getDate()}\n${new Date(key).toLocaleString('en-US', { weekday: 'short' })}`,
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
      const dates = getCurrentMonthDates();
      const barsData = dates.map((key, index) => ({
        label: index % 3 === 0 ? new Date(key).getDate().toString() : '',
        value: dailyCounts[key] || 0,
      }));
      const totalValue = barsData.reduce((sum, item) => sum + item.value, 0);
      const today = new Date();
      const rangeLabel = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      return {
        bars: barsData,
        total: totalValue,
        avg: Math.round(totalValue / dates.length),
        rangeLabel,
      };
    }

    const today = new Date();
    const startYear = today.getFullYear() - 2;
    const yearTotals: BarPoint[] = Array.from({ length: 3 }, (_, index) => ({
      label: String(startYear + index),
      value: 0,
    }));

    Object.entries(dailyCounts).forEach(([key, value]) => {
      const year = Number(key.slice(0, 4));
      const index = year - startYear;
      if (index >= 0 && index < yearTotals.length) {
        yearTotals[index].value += value;
      }
    });

    const totalValue = yearTotals.reduce((sum, item) => sum + item.value, 0);
    return {
      bars: yearTotals,
      total: totalValue,
      avg: Math.round(totalValue / 3),
      rangeLabel: `${startYear} - ${startYear + 2}`,
    };
  }, [dailyCounts, period]);

  const maxValue = Math.max(1, ...bars.map(item => item.value));
  const barCount = bars.length;
  const barWidth =
    barCount >= 24 ? 8 : barCount >= 16 ? 12 : barCount >= 10 ? 18 : 26;
  const spacing =
    barCount >= 24 ? 6 : barCount >= 16 ? 10 : barCount >= 10 ? 14 : 18;
  const minHeight = 6;
  const hasData = total > 0;
  const chartData = bars.map(item => {
    const value = item.value || 0;
    const displayValue =
      hasData && value === 0 ? Math.max(1, Math.round(maxValue * 0.02)) : value;
    return {
      value: displayValue,
      label: item.label || ' ',
      frontColor: colors.primary,
    };
  });

  return (
    <Screen>
      <AppHeader title="Naam Jap Stats" />
      <Divider style={styles.divider} />

      <View
        style={[
          styles.periodRow,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {(['weekly', 'monthly', 'yearly'] as Period[]).map(item => {
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
              <Text
                variant="sm"
                weight="semibold"
                color="textSecondary"
                style={active ? { color: colors.surface } : undefined}
              >
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
        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text variant="lg" weight="bold">
            {total}
          </Text>
          <Text variant="sm" color="textSecondary">
            Total Count
          </Text>
        </View>
        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text variant="lg" weight="bold">
            {avg}
          </Text>
          <Text variant="sm" color="textSecondary">
            Avg / {period === 'yearly' ? 'Month' : 'Day'}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.chartCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {hasData ? (
          <BarChart
            data={chartData}
            height={210}
            barWidth={barWidth}
            spacing={spacing}
            initialSpacing={12}
            endSpacing={12}
            maxValue={maxValue}
            minHeight={minHeight}
            noOfSections={3}
            hideRules
            hideYAxisText
            yAxisThickness={0}
            xAxisThickness={0}
            xAxisTextNumberOfLines={2}
            xAxisLabelTextStyle={{
              color: colors.textSecondary,
              fontSize: 11,
              textAlign: 'center',
              lineHeight: 14,
            }}
            xAxisLabelsHeight={40}
            disableScroll={barCount <= 10}
            showScrollIndicator={false}
            barBorderRadius={12}
            frontColor={colors.primary}
            backgroundColor="transparent"
            isAnimated
            animationDuration={700}
          />
        ) : (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyTrack,
                { backgroundColor: colors.border },
              ]}
            />
            <Text variant="sm" color="textSecondary">
              No stats yet. Start a chant to see progress.
            </Text>
          </View>
        )}
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
    paddingVertical: 12,
    paddingHorizontal: 10,
    minHeight: 220,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  emptyTrack: {
    height: 6,
    width: '65%',
    borderRadius: 999,
    opacity: Platform.OS === 'android' ? 0.6 : 0.4,
  },
});
