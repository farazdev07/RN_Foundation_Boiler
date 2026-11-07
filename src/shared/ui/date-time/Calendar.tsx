import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { makeStyles } from '../theme';
import {
  addMonths,
  buildMonthGrid,
  dayKey,
  formatDayLabel,
  isOutside,
  localeWeekStart,
  monthTitle,
  weekdayNames,
} from './calendarMath';

type Props = {
  selected?: Date | null;
  onSelect: (date: Date) => void;
  // Days that carry something, as YYYY-MM-DD keys (see dayKey).
  markedDates?: ReadonlySet<string>;
  minDate?: Date;
  maxDate?: Date;
  // 0 = Sunday. Defaults to the device locale's first day of the week.
  weekStartsOn?: number;
  locale?: string;
  previousLabel?: string;
  nextLabel?: string;
  // Read after a marked day's date by screen readers.
  markedLabel?: string;
};

const useStyles = makeStyles(({ colors, radii, spacing }) => ({
  container: { gap: spacing.sm },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nav: { padding: spacing.sm },
  row: { flexDirection: 'row' },
  cell: {
    alignItems: 'center',
    aspectRatio: 1,
    flex: 1,
    justifyContent: 'center',
  },
  day: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  selected: { backgroundColor: colors.primary },
  today: { borderColor: colors.primary, borderWidth: 1 },
  mark: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    bottom: 4,
    height: 4,
    position: 'absolute',
    width: 4,
  },
  markOnSelected: { backgroundColor: colors.textOnPrimary },
}));

export function Calendar({
  selected,
  onSelect,
  markedDates,
  minDate,
  maxDate,
  weekStartsOn,
  locale,
  previousLabel = 'Previous month',
  nextLabel = 'Next month',
  markedLabel = 'marked',
}: Props) {
  const styles = useStyles();
  const [month, setMonth] = useState(() =>
    addMonths(selected ?? new Date(), 0),
  );
  const weekStart = weekStartsOn ?? localeWeekStart(locale);
  const days = useMemo(
    () => buildMonthGrid(month.getFullYear(), month.getMonth(), weekStart),
    [month, weekStart],
  );
  const names = useMemo(
    () => weekdayNames(weekStart, locale),
    [weekStart, locale],
  );
  const todayKey = dayKey(new Date());
  const selectedKey = selected ? dayKey(selected) : undefined;
  const weeks = Array.from({ length: 6 }, (_, week) =>
    days.slice(week * 7, week * 7 + 7),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={previousLabel}
          onPress={() => setMonth(current => addMonths(current, -1))}
          style={styles.nav}
          hitSlop={8}
        >
          <Icon name="chevron-left" size={22} />
        </Pressable>
        <Text variant="subtitle" accessibilityRole="header">
          {monthTitle(month, locale)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={nextLabel}
          onPress={() => setMonth(current => addMonths(current, 1))}
          style={styles.nav}
          hitSlop={8}
        >
          <Icon name="chevron-right" size={22} />
        </Pressable>
      </View>
      <View style={styles.row} importantForAccessibility="no-hide-descendants">
        {names.map(name => (
          <View key={name} style={styles.cell}>
            <Text variant="caption" color="textSecondary">
              {name}
            </Text>
          </View>
        ))}
      </View>
      {weeks.map(week => (
        <View key={week[0]!.key} style={styles.row}>
          {week.map(({ date, key, inMonth }) => {
            const disabled = !inMonth || isOutside(date, minDate, maxDate);
            const isSelected = key === selectedKey;
            const marked = markedDates?.has(key) ?? false;
            return (
              <View key={key} style={styles.cell}>
                {inMonth ? (
                  <Pressable
                    testID={`calendar-day-${key}`}
                    accessibilityRole="button"
                    accessibilityLabel={formatDayLabel(
                      date,
                      marked ? markedLabel : undefined,
                      locale,
                    )}
                    accessibilityState={{ selected: isSelected, disabled }}
                    disabled={disabled}
                    onPress={() => onSelect(date)}
                    style={[
                      styles.day,
                      key === todayKey && styles.today,
                      isSelected && styles.selected,
                    ]}
                  >
                    <Text
                      color={
                        isSelected
                          ? 'textOnPrimary'
                          : disabled
                            ? 'disabled'
                            : 'textPrimary'
                      }
                    >
                      {date.getDate()}
                    </Text>
                    {marked ? (
                      <View
                        style={[
                          styles.mark,
                          isSelected && styles.markOnSelected,
                        ]}
                      />
                    ) : null}
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
