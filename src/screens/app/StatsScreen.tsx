import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader, Screen, Text, Divider } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { formatRangeLabel, getLastNDates, getLastNMonths } from '../../utils/date';
import { BarChart } from 'react-native-gifted-charts';
import Svg, { Pattern, Rect } from 'react-native-svg';

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
      const label = new Date(dates[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        bars: [{ label, value }],
        total: value,
        avg: value,
        rangeLabel: new Date(dates[0]).toDateString(),
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
  const barCount = bars.length;
  const barWidth =
    barCount > 24 ? 8 : barCount > 16 ? 10 : barCount > 10 ? 12 : barCount > 7 ? 14 : 18;
  const spacing = barCount > 24 ? 6 : barCount > 16 ? 8 : barCount > 10 ? 10 : 12;
  const minHeight = 6;
  const hasData = total > 0;
  const patternId = 'barTrackPattern';

  const chartData = bars.map(item => {
    const value = item.value || 0;
    const displayValue =
      hasData && value === 0 ? Math.max(1, Math.round(maxValue * 0.02)) : value;
    return {
      value: displayValue,
      label: item.label || ' ',
      frontColor: colors.accent,
      showGradient: false,
    };
  });

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

      <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <BarChart
          data={chartData}
          height={200}
          barWidth={barWidth}
          spacing={spacing}
          initialSpacing={16}
          endSpacing={16}
          maxValue={maxValue}
          minHeight={minHeight}
          noOfSections={4}
          hideRules
          hideYAxisText
          yAxisThickness={0}
          xAxisThickness={0}
          barBorderRadius={12}
          xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11 }}
          xAxisLabelsHeight={24}
          disableScroll={false}
          showScrollIndicator={false}
          frontColor={colors.accent}
          backgroundColor="transparent"
          patternId={patternId}
          barBackgroundPattern={() => (
            <Svg>
              <Pattern id={patternId} patternUnits="objectBoundingBox" width="1" height="1">
                <Rect x="0" y="0" width="1" height="1" rx="0.5" ry="0.5" fill={colors.border} />
              </Pattern>
            </Svg>
          )}
        />
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
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});
