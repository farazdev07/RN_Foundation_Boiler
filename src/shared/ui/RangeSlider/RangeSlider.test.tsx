import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { clamp, snap, toPosition, toValue } from './rangeMath';
import { RangeSlider, type Range } from './index';

describe('rangeMath', () => {
  it('clamps', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it.each([
    [7, 0, 100, 5, 5],
    [8, 0, 100, 5, 10],
    [0.30000000000000004, 0, 1, 0.1, 0.3],
    [130, 0, 100, 10, 100],
    [13, 10, 20, 4, 14],
  ])('snaps %d in [%d, %d] by %d to %d', (value, min, max, step, expected) => {
    expect(snap(value, min, max, step)).toBe(expected);
  });

  it('maps values and positions both ways', () => {
    expect(toPosition(50, 0, 100, 200)).toBe(100);
    expect(toValue(100, 0, 100, 200)).toBe(50);
    expect(toValue(-20, 0, 100, 200)).toBe(0);
    expect(toValue(10, 0, 100, 0)).toBe(0);
    expect(toPosition(5, 5, 5, 200)).toBe(0);
  });
});

type SliderProps = Parameters<typeof RangeSlider>[0];

const renderSlider = async (props: Partial<SliderProps> = {}) => {
  const onChange = jest.fn<void, [Range]>();
  await renderWithTheme(
    <RangeSlider
      testID="price"
      label="Price"
      value={[20, 80]}
      onChange={onChange}
      step={5}
      formatValue={value => `USD ${value}`}
      {...props}
    />,
  );
  await fireEvent(screen.getByTestId('price-area'), 'layout', {
    nativeEvent: { layout: { width: 328, height: 28 } },
  });
  return onChange;
};

const act = (label: string, actionName: 'increment' | 'decrement') =>
  fireEvent(screen.getByLabelText(label), 'accessibilityAction', {
    nativeEvent: { actionName },
  });

describe('RangeSlider', () => {
  it('shows the label and the formatted range', async () => {
    await renderSlider();

    expect(screen.getByText('Price')).toBeOnTheScreen();
    expect(screen.getByText('USD 20 to USD 80')).toBeOnTheScreen();
  });

  it('steps each thumb with accessibility actions', async () => {
    const onChange = await renderSlider();

    await act('Price minimum', 'increment');
    expect(onChange).toHaveBeenLastCalledWith([25, 80]);

    await act('Price maximum', 'decrement');
    expect(onChange).toHaveBeenLastCalledWith([20, 75]);
  });

  it('keeps the thumbs apart and inside the range', async () => {
    const onChange = await renderSlider({ value: [0, 10], minGap: 10 });

    await act('Price minimum', 'decrement');
    expect(onChange).toHaveBeenLastCalledWith([0, 10]);

    await act('Price minimum', 'increment');
    expect(onChange).toHaveBeenLastCalledWith([0, 10]);
  });

  it('ignores input while disabled', async () => {
    const onChange = await renderSlider({ disabled: true });

    await act('Price minimum', 'increment');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Price minimum')).toBeDisabled();
  });
});
