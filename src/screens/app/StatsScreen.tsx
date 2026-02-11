import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader, Screen, Text, Divider, Icon } from '../../components';
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
  const [malaCount, setMalaCount] = useState(0);
  const [anchorDate, setAnchorDate] = useState(() => new Date());

  const getCurrentWeekDates = useCallback((baseDate: Date) => {
    const day = baseDate.getDay(); // 0=Sun, 1=Mon, ...
    const diffToMonday = (day + 6) % 7;
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - diffToMonday);
    const dates: string[] = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(getLocalDateKey(d));
    }
    return dates;
  }, []);

  const getCurrentMonthDates = useCallback((baseDate: Date) => {
    const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
    const daysInMonth = end.getDate();
    const dates: string[] = [];
    for (let i = 0; i < daysInMonth; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(getLocalDateKey(d));
    }
    return dates;
  }, []);

  const getWeekStart = useCallback((date: Date) => {
    const day = date.getDay();
    const diffToMonday = (day + 6) % 7;
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(date.getDate() - diffToMonday);
    return start;
  }, []);

  const load = useCallback(async () => {
    const [raw, malaRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.dailyCounts),
      AsyncStorage.getItem(STORAGE_KEYS.malaCount),
    ]);
    setDailyCounts(raw ? (JSON.parse(raw) as Record<string, number>) : {});
    setMalaCount(malaRaw ? Number(malaRaw) || 0 : 0);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setAnchorDate(new Date());
  }, [period]);

  const canGoNext = useMemo(() => {
    const today = new Date();
    if (period === 'weekly') {
      return getWeekStart(anchorDate).getTime() < getWeekStart(today).getTime();
    }
    if (period === 'monthly') {
      return (
        anchorDate.getFullYear() < today.getFullYear() ||
        (anchorDate.getFullYear() === today.getFullYear() &&
          anchorDate.getMonth() < today.getMonth())
      );
    }
    return false;
  }, [anchorDate, getWeekStart, period]);

  const shiftPeriod = useCallback(
    (direction: -1 | 1) => {
      setAnchorDate(prev => {
        const next = new Date(prev);
        if (period === 'weekly') {
          next.setDate(prev.getDate() + direction * 7);
        } else if (period === 'monthly') {
          next.setMonth(prev.getMonth() + direction);
        } else {
          return prev;
        }
        return next;
      });
    },
    [period],
  );

  const { bars, total, avg, rangeLabel } = useMemo(() => {
    if (period === 'weekly') {
      const dates = getCurrentWeekDates(anchorDate);
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
      const dates = getCurrentMonthDates(anchorDate);
      const barsData = dates.map((key, index) => ({
        label: index % 5 === 0 ? new Date(key).getDate().toString() : '',
        value: dailyCounts[key] || 0,
      }));
      const totalValue = barsData.reduce((sum, item) => sum + item.value, 0);
      const rangeLabel = anchorDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      return {
        bars: barsData,
        total: totalValue,
        avg: Math.round(totalValue / dates.length),
        rangeLabel,
      };
    }

    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 4;
    const yearTotals: BarPoint[] = Array.from({ length: 5 }, (_, index) => ({
      label: String(startYear + index),
      value: 0,
    }));

    Object.entries(dailyCounts).forEach(([key, value]) => {
      const year = Number(key.slice(0, 4));
      if (Number.isNaN(year) || year > currentYear) return;
      const index = year - startYear;
      if (index >= 0 && index < yearTotals.length) {
        yearTotals[index].value += value;
      }
    });

    const totalValue = yearTotals.reduce((sum, item) => sum + item.value, 0);
    return {
      bars: yearTotals,
      total: totalValue,
      avg: Math.round(totalValue / yearTotals.length),
      rangeLabel: `${startYear} - ${currentYear}`,
    };
  }, [anchorDate, dailyCounts, getCurrentMonthDates, getCurrentWeekDates, period]);

  const maxValue = Math.max(1, ...bars.map(item => item.value));
  const barCount = bars.length;
  const barWidth =
    barCount >= 28 ? 6 : barCount >= 24 ? 8 : barCount >= 16 ? 12 : barCount >= 10 ? 18 : 26;
  const spacing =
    barCount >= 28 ? 6 : barCount >= 24 ? 8 : barCount >= 16 ? 10 : barCount >= 10 ? 14 : 18;
  const minHeight = 0;
  const hasData = total > 0;
  const chartData = bars.map(item => {
    return {
      value: item.value || 0,
      label: item.label || ' ',
      frontColor: colors.primary,
    };
  });
  const chartKey = useMemo(
    () => `${period}-${rangeLabel}-${bars.map(item => item.value).join(',')}`,
    [bars, period, rangeLabel],
  );

  return (
    <Screen>
      <AppHeader
        title="Naam Jap Stats"
        right={
          <View style={styles.headerArrows}>
            <Pressable
              onPress={() => shiftPeriod(-1)}
              style={({ pressed }) => [
                styles.arrowButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Icon iconSet="MaterialIcons" iconName="chevron-left" size={24} color={colors.textPrimary} />
            </Pressable>
            <Pressable
              onPress={() => shiftPeriod(1)}
              disabled={!canGoNext}
              style={({ pressed }) => [
                styles.arrowButton,
                { opacity: canGoNext ? (pressed ? 0.6 : 1) : 0.3 },
              ]}
            >
              <Icon iconSet="MaterialIcons" iconName="chevron-right" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>
        }
      />
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
            Avg / {period === 'yearly' ? 'Year' : 'Day'}
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
            key={chartKey}
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
            xAxisTextNumberOfLines={period === 'weekly' ? 2 : 1}
            xAxisLabelTextStyle={{
              color: colors.textSecondary,
              fontSize: period === 'monthly' ? 10 : 11,
              textAlign: 'center',
              lineHeight: period === 'weekly' ? 14 : 12,
            }}
            xAxisLabelsHeight={period === 'weekly' ? 40 : 34}
            xAxisLabelsVerticalShift={period === 'monthly' ? 15 : period === 'yearly' ? 18 : 0}
            labelWidth={period === 'yearly' ? 30 : period === 'monthly' ? 22 : 28}
            disableScroll
            showScrollIndicator={false}
            barBorderRadius={12}
            frontColor={colors.primary}
            backgroundColor="transparent"
            isAnimated={false}
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

      <Text variant="sm" weight="semibold" style={styles.bottomLine}>
        Count: {total} | Malas: {malaCount}
      </Text>
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
  headerArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
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
  bottomLine: {
    textAlign: 'center',
    marginTop: 14,
  },
});
