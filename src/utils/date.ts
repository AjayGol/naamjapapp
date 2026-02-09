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
