export type Day = { date: Date; key: string; inMonth: boolean };

// Local calendar date as YYYY-MM-DD, the format markedDates uses.
export const dayKey = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addMonths = (date: Date, months: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

// Six full weeks, so the grid keeps the same height from month to month.
export const buildMonthGrid = (
  year: number,
  month: number,
  weekStartsOn: number,
): Day[] => {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  return Array.from({ length: 42 }, (_, cell) => {
    const date = new Date(year, month, 1 - lead + cell);
    return { date, key: dayKey(date), inMonth: date.getMonth() === month };
  });
};

// Short weekday names in display order, from Intl rather than a table.
export const weekdayNames = (
  weekStartsOn: number,
  locale?: string,
): string[] => {
  const format = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  // 4 Jan 2026 is a Sunday.
  return Array.from({ length: 7 }, (_, column) =>
    format.format(new Date(2026, 0, 4 + ((weekStartsOn + column) % 7))),
  );
};

export const monthTitle = (date: Date, locale?: string): string =>
  new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    date,
  );

type WeekInfo = { firstDay?: number };
type LocaleWithWeek = Intl.Locale & {
  getWeekInfo?: () => WeekInfo;
  weekInfo?: WeekInfo;
};

// Uses the locale's own first day when the engine knows it (1 = Monday ...
// 7 = Sunday), and Sunday otherwise.
export const localeWeekStart = (locale?: string): number => {
  try {
    const tag = locale ?? Intl.DateTimeFormat().resolvedOptions().locale;
    const info = new Intl.Locale(tag) as LocaleWithWeek;
    const firstDay = (info.getWeekInfo?.() ?? info.weekInfo)?.firstDay;
    return firstDay ? firstDay % 7 : 0;
  } catch {
    return 0;
  }
};

export const isOutside = (date: Date, min?: Date, max?: Date): boolean =>
  (min !== undefined && startOfDay(date) < startOfDay(min)) ||
  (max !== undefined && startOfDay(date) > startOfDay(max));

// What a screen reader says for a day cell.
export const formatDayLabel = (
  date: Date,
  markedLabel: string | undefined,
  locale?: string,
): string => {
  const label = new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(
    date,
  );
  return markedLabel ? `${label}, ${markedLabel}` : label;
};
