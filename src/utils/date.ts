export const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLastNDates = (days: number) => {
  const result: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    result.push(getLocalDateKey(d));
  }
  return result;
};

export const getLastNMonths = (months: number) => {
  const result: { key: string; label: string }[] = [];
  const today = new Date();
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'short' });
    result.push({ key, label });
  }
  return result;
};

export const formatRangeLabel = (startKey: string, endKey: string) => {
  const start = new Date(startKey);
  const end = new Date(endKey);
  const startLabel = start.toLocaleString('en-US', { day: 'numeric', month: 'short' });
  const endLabel = end.toLocaleString('en-US', { day: 'numeric', month: 'short' });
  return `${startLabel} - ${endLabel}`;
};

export const getStreaks = (dailyCounts: Record<string, number>) => {
  const hasCount = (key: string) => (dailyCounts[key] || 0) > 0;
  const todayKey = getLocalDateKey();
  let current = 0;
  let longest = 0;

  // Build a set of all days with counts
  const keys = Object.keys(dailyCounts).filter(key => hasCount(key));
  if (keys.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Compute longest streak by walking sorted days
  const sorted = keys.sort();
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(sorted[i - 1]);
    const next = new Date(sorted[i]);
    const diff = Math.round((next.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      run += 1;
    } else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  longest = Math.max(longest, run);

  // Current streak: count back from today
  let cursor = new Date(todayKey);
  while (hasCount(getLocalDateKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, longest };
};

export const getWeekdayKey = (date = new Date()) => {
  return date.getDay();
};
