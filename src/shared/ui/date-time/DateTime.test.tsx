import { Platform } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
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
import { Calendar, DateTimeField } from './index';

describe('calendarMath', () => {
  it('keys days by local calendar date', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('builds six weeks that start on the chosen weekday', () => {
    // 1 Nov 2026 is a Sunday.
    const sundayFirst = buildMonthGrid(2026, 10, 0);
    expect(sundayFirst).toHaveLength(42);
    expect(sundayFirst[0]!.key).toBe('2026-11-01');

    const mondayFirst = buildMonthGrid(2026, 10, 1);
    expect(mondayFirst[0]!.key).toBe('2026-10-26');
    expect(mondayFirst[0]!.inMonth).toBe(false);
    expect(mondayFirst.filter(day => day.inMonth)).toHaveLength(30);
  });

  it('names weekdays in display order', () => {
    expect(weekdayNames(1, 'en-US')[0]).toBe('Mon');
    expect(weekdayNames(0, 'en-US')[0]).toBe('Sun');
  });

  it('formats titles and labels with Intl', () => {
    expect(monthTitle(new Date(2026, 10, 7), 'en-US')).toBe('November 2026');
    expect(formatDayLabel(new Date(2026, 10, 7), 'marked', 'en-US')).toBe(
      'Saturday, November 7, 2026, marked',
    );
  });

  it('moves between months from any day', () => {
    expect(dayKey(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-02-01');
  });

  it('compares limits by day, not time', () => {
    const min = new Date(2026, 10, 7, 18);
    expect(isOutside(new Date(2026, 10, 7, 8), min)).toBe(false);
    expect(isOutside(new Date(2026, 10, 6), min)).toBe(true);
  });

  it('falls back to Sunday when the locale is unknown to the engine', () => {
    expect(localeWeekStart('not a locale')).toBe(0);
    expect(localeWeekStart('en-US')).toBe(0);
  });
});

describe('Calendar', () => {
  const day = new Date(2026, 10, 7);

  it('shows the selected month and selects a day', async () => {
    const onSelect = jest.fn();
    await renderWithTheme(
      <Calendar
        selected={day}
        onSelect={onSelect}
        weekStartsOn={1}
        locale="en-US"
      />,
    );

    expect(screen.getByText('November 2026')).toBeOnTheScreen();
    expect(screen.getByTestId('calendar-day-2026-11-07')).toBeSelected();

    await fireEvent.press(screen.getByTestId('calendar-day-2026-11-12'));

    expect(onSelect).toHaveBeenCalledWith(new Date(2026, 10, 12));
  });

  it('pages between months', async () => {
    await renderWithTheme(
      <Calendar selected={day} onSelect={jest.fn()} locale="en-US" />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('December 2026')).toBeOnTheScreen();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Previous month' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Previous month' }),
    );
    expect(screen.getByText('October 2026')).toBeOnTheScreen();
  });

  it('disables days outside the limits and announces marked days', async () => {
    const onSelect = jest.fn();
    await renderWithTheme(
      <Calendar
        selected={day}
        onSelect={onSelect}
        minDate={new Date(2026, 10, 5)}
        markedDates={new Set(['2026-11-10'])}
        locale="en-US"
      />,
    );

    const early = screen.getByTestId('calendar-day-2026-11-04');
    expect(early).toBeDisabled();
    await fireEvent.press(early);
    expect(onSelect).not.toHaveBeenCalled();

    expect(
      screen.getByLabelText('Tuesday, November 10, 2026, marked'),
    ).toBeOnTheScreen();
  });
});

describe('DateTimeField', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
    jest.clearAllMocks();
  });

  it('shows the placeholder, then the formatted value', async () => {
    const { rerender } = await renderWithTheme(
      <DateTimeField
        label="Birthday"
        placeholder="Pick a date"
        value={null}
        onChange={jest.fn()}
        locale="en-US"
      />,
    );
    expect(screen.getByText('Pick a date')).toBeOnTheScreen();

    await rerender(
      <DateTimeField
        label="Birthday"
        value={new Date(2026, 10, 7)}
        onChange={jest.fn()}
        locale="en-US"
      />,
    );
    expect(screen.getByText('Nov 7, 2026')).toBeOnTheScreen();
  });

  it('on Android, opens the system dialog and keeps the picked value', async () => {
    Platform.OS = 'android';
    const onChange = jest.fn();
    await renderWithTheme(
      <DateTimeField testID="when" value={null} onChange={onChange} />,
    );

    await fireEvent.press(screen.getByTestId('when'));
    const open = jest.mocked(DateTimePickerAndroid.open);
    const options = open.mock.calls[0]![0];

    expect(options.onDismiss).toBeUndefined();
    const picked = new Date(2026, 10, 9);
    options.onValueChange?.(
      { nativeEvent: { timestamp: picked.getTime(), utcOffset: 0 } },
      picked,
    );
    expect(onChange).toHaveBeenCalledWith(picked);
  });

  it('on iOS, keeps the choice only after Done', async () => {
    Platform.OS = 'ios';
    const onChange = jest.fn();
    await renderWithTheme(
      <DateTimeField
        testID="when"
        value={new Date(2026, 10, 7)}
        onChange={onChange}
      />,
    );

    await fireEvent.press(screen.getByTestId('when'));
    const picked = new Date(2026, 10, 20);
    await fireEvent(
      screen.getByTestId('when-picker'),
      'valueChange',
      {},
      picked,
    );
    expect(onChange).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(onChange).toHaveBeenCalledWith(picked);
  });
});
