import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader, Screen, Text, Divider, Icon } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { formatRangeLabel, getLocalDateKey } from '../../utils/date';
import { BarChart } from 'react-native-gifted-charts';

type Period = 'weekly' | 'monthly' | 'yearly';

type BarPoint = {
  label: string;
  value: number;
};

export const StatsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
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

  const { bars, total, avg, rangeLabel, focusLabels } = useMemo(() => {
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
        focusLabels: dates.map(key =>
          `${new Date(key).getDate()} ${new Date(key).toLocaleString('en-US', { weekday: 'short' })}`,
        ),
      };
    }

    if (period === 'monthly') {
      const dates = getCurrentMonthDates(anchorDate);
      const barsData = dates.map((key, index) => ({
        label: (() => {
          const dayNumber = index + 1;
          if (dayNumber === 1 || dayNumber === 2) {
            return String(dayNumber);
          }
          return dayNumber % 2 === 0 ? String(dayNumber) : '';
        })(),
        value: dailyCounts[key] || 0,
      }));
      const totalValue = barsData.reduce((sum, item) => sum + item.value, 0);
      const rangeLabel = anchorDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      return {
        bars: barsData,
        total: totalValue,
        avg: Math.round(totalValue / dates.length),
        rangeLabel,
        focusLabels: dates.map((_, index) => String(index + 1)),
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
      focusLabels: yearTotals.map(item => item.label),
    };
  }, [anchorDate, dailyCounts, getCurrentMonthDates, getCurrentWeekDates, period]);

  const maxValue = Math.max(1, ...bars.map(item => item.value));
  const barCount = bars.length;
  const availableChartWidth = Math.max(240, screenWidth - 44);
  const fitBarsToWidth = useCallback(
    (
      count: number,
      initialSpacing: number,
      endSpacing: number,
      minBarWidth: number,
      maxBarWidth: number,
      minSpacing: number,
      maxSpacing: number,
    ) => {
      if (count <= 1) {
        return { barWidth: maxBarWidth, spacing: 0 };
      }
      const usableWidth = Math.max(
        80,
        availableChartWidth - initialSpacing - endSpacing,
      );
      const spacingAtMaxBar =
        (usableWidth - count * maxBarWidth) / (count - 1);

      if (spacingAtMaxBar >= minSpacing) {
        return {
          barWidth: Math.floor(maxBarWidth),
          spacing: Math.floor(Math.min(maxSpacing, spacingAtMaxBar)),
        };
      }

      const candidateBar =
        (usableWidth - (count - 1) * minSpacing) / count;
      const barWidth = Math.floor(
        Math.max(minBarWidth, Math.min(maxBarWidth, candidateBar)),
      );
      const spacing = Math.floor(
        Math.max(1, (usableWidth - count * barWidth) / (count - 1)),
      );
      return {
        barWidth,
        spacing: Math.max(1, Math.min(maxSpacing, spacing)),
      };
    },
    [availableChartWidth],
  );
  const minHeight = 0;
  const hasData = total > 0;
  const isMonthly = period === 'monthly';
  const isWeekly = period === 'weekly';
  const slotWidth = availableChartWidth / Math.max(1, barCount);
  const monthlyLabelWidth = Math.max(12, Math.min(18, Math.round(slotWidth * 0.8)));
  const weeklyLabelWidth = Math.max(26, Math.min(36, Math.round(slotWidth * 0.9)));
  const yearlyLabelWidth = Math.max(28, Math.min(40, Math.round(slotWidth * 0.9)));
  const monthlyLeftPadding = Math.max(4, Math.round(monthlyLabelWidth * 0.25));
  const monthlyRightPadding = Math.max(10, Math.round(monthlyLabelWidth * 0.55));
  const weeklyLeftPadding = Math.max(4, Math.round(weeklyLabelWidth * 0.2));
  const weeklyRightPadding = Math.max(14, Math.round(weeklyLabelWidth * 0.7));
  const yearlyLeftPadding = Math.max(8, Math.round(yearlyLabelWidth * 0.3));
  const yearlyRightPadding = Math.max(18, Math.round(yearlyLabelWidth * 0.75));
  const chartHeight = period === 'weekly' ? 236 : isMonthly ? 224 : 216;
  const chartInitialSpacing = isWeekly
    ? weeklyLeftPadding
    : isMonthly
      ? monthlyLeftPadding
      : yearlyLeftPadding;
  const chartEndSpacing = isWeekly
    ? weeklyRightPadding
    : isMonthly
      ? monthlyRightPadding
      : yearlyRightPadding;
  const { barWidth, spacing } = useMemo(() => {
    if (period === 'weekly') {
      return fitBarsToWidth(
        barCount,
        chartInitialSpacing,
        chartEndSpacing,
        16,
        24,
        6,
        36,
      );
    }
    if (period === 'monthly') {
      return fitBarsToWidth(
        barCount,
        chartInitialSpacing,
        chartEndSpacing,
        3,
        5,
        2,
        8,
      );
    }
    return fitBarsToWidth(
      barCount,
      chartInitialSpacing,
      chartEndSpacing,
      18,
      30,
      8,
      52,
    );
  }, [
    barCount,
    chartEndSpacing,
    chartInitialSpacing,
    fitBarsToWidth,
    period,
  ]);
  const baseLabelSlot = Math.max(
    12,
    Math.floor(
      (availableChartWidth - chartInitialSpacing - chartEndSpacing) /
        Math.max(1, barCount),
    ),
  );
  const labelWidth =
    period === 'monthly'
      ? Math.max(12, Math.min(monthlyLabelWidth, baseLabelSlot + 1))
      : period === 'yearly'
        ? Math.max(24, Math.min(yearlyLabelWidth, baseLabelSlot + 2))
        : Math.max(24, Math.min(weeklyLabelWidth, baseLabelSlot + 2));
  const chartMaxValue = hasData
    ? (() => {
        if (maxValue <= 10) return 10;
        if (maxValue <= 50) return 50;
        if (maxValue <= 100) return 100;
        if (maxValue <= 500) return Math.ceil(maxValue / 50) * 50;
        if (maxValue <= 2000) return Math.ceil(maxValue / 100) * 100;
        return Math.ceil(maxValue / 500) * 500;
      })()
    : 1;
  const chartData = bars.map(item => {
    return {
      value: item.value || 0,
      label: item.label || ' ',
      frontColor: '#111111',
    };
  });
  const chartKey = useMemo(
    () => `${period}-${rangeLabel}-${bars.map(item => item.value).join(',')}`,
    [bars, period, rangeLabel],
  );
  const focusedIndex = useMemo(() => {
    if (hasData) {
      const target = Math.max(...bars.map(item => item.value));
      return Math.max(
        0,
        bars.findIndex(item => item.value === target),
      );
    }
    if (period === 'weekly') {
      const dates = getCurrentWeekDates(anchorDate);
      const today = getLocalDateKey();
      const idx = dates.indexOf(today);
      return idx >= 0 ? idx : 0;
    }
    if (period === 'monthly') {
      const today = new Date();
      if (
        today.getFullYear() === anchorDate.getFullYear() &&
        today.getMonth() === anchorDate.getMonth()
      ) {
        return Math.max(0, today.getDate() - 1);
      }
      return 0;
    }
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 4;
    return Math.max(0, Math.min(4, currentYear - startYear));
  }, [anchorDate, bars, getCurrentWeekDates, hasData, period]);
  const focusedLabel = focusLabels[focusedIndex] || '';
  const periodTitle =
    period === 'weekly' ? 'Daily' : period === 'monthly' ? 'Monthly' : 'Yearly';

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
                style={
                  active
                    ? [styles.periodTextActive, { color: colors.surface }]
                    : [styles.periodText, { color: colors.textSecondary }]
                }
              >
                {item === 'weekly'
                  ? 'Daily'
                  : item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="lg" color="textSecondary" style={styles.rangeLabel}>
        {rangeLabel}
      </Text>

      <View style={styles.metricsRow}>
        <View
          style={[
            styles.metricItem,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={styles.metricValue}>
            {total}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Total Count
          </Text>
        </View>
        <View
          style={[
            styles.metricItem,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={styles.metricValue}>
            {avg}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Avg / {period === 'yearly' ? 'Year' : 'Day'}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.chartSection,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.chartWrap}>
          <BarChart
            key={chartKey}
            data={chartData}
            height={chartHeight}
            barWidth={barWidth}
            spacing={spacing}
            initialSpacing={chartInitialSpacing}
            endSpacing={chartEndSpacing}
            maxValue={chartMaxValue}
            minHeight={minHeight}
            noOfSections={3}
            hideRules
            hideYAxisText
            yAxisThickness={0}
            xAxisThickness={0}
            xAxisTextNumberOfLines={period === 'weekly' ? 2 : 1}
            xAxisLabelTextStyle={{
              color: colors.textSecondary,
              fontSize: period === 'monthly' ? 10 : 12,
              textAlign: 'center',
              lineHeight: period === 'weekly' ? 16 : 14,
            }}
            xAxisLabelsHeight={period === 'weekly' ? 46 : 36}
            xAxisLabelsVerticalShift={period === 'monthly' ? 10 : period === 'yearly' ? 12 : 0}
            labelWidth={labelWidth}
            disableScroll
            showScrollIndicator={false}
            barBorderRadius={14}
            frontColor="#111111"
            backgroundColor="transparent"
            isAnimated={false}
          />
        </View>
        <Text style={[styles.focusedLabel, { color: colors.textSecondary }]}>
          {focusedLabel || periodTitle}
        </Text>
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
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  periodText: {
    color: '#171717',
  },
  periodTextActive: {
    color: '#111111',
  },
  rangeLabel: {
    marginTop: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
  },
  metricValue: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '700',
    color: '#111111',
  },
  metricLabel: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  chartSection: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingTop: 10,
    paddingBottom: 12,
    minHeight: 270,
  },
  chartWrap: {
    minHeight: 248,
    justifyContent: 'flex-end',
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
  focusedLabel: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
  bottomLine: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 16,
    lineHeight: 22,
    color: '#111111',
  },
});
