import { AppState, Text } from 'react-native';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { activeDotIndex } from './activeDot';
import { Carousel } from './index';

const slides = ['One', 'Two', 'Three'];

const renderCarousel = async (
  props: Partial<Parameters<typeof Carousel<string>>[0]> = {},
) => {
  const onIndexChange = jest.fn();
  await renderWithTheme(
    <Carousel
      testID="carousel"
      data={slides}
      keyExtractor={item => item}
      renderItem={({ item }) => <Text>{item}</Text>}
      onIndexChange={onIndexChange}
      {...props}
    />,
  );
  await fireEvent(screen.getByTestId('carousel'), 'layout', {
    nativeEvent: { layout: { width: 300, height: 200 } },
  });
  return onIndexChange;
};

const position = () =>
  screen.getByLabelText(/^\d+ \/ \d+$/).props.accessibilityLabel;

describe('activeDotIndex', () => {
  it.each([
    [0, 3, 5, 0],
    [2, 3, 5, 2],
    [9, 3, 5, 2],
    [0, 10, 5, 0],
    [9, 10, 5, 4],
    [5, 10, 5, 2],
    [0, 1, 5, 0],
  ])('slide %i of %i with %i dots lights dot %i', (index, count, max, dot) => {
    expect(activeDotIndex(index, count, max)).toBe(dot);
  });
});

describe('Carousel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('advances on its own and wraps around', async () => {
    const onIndexChange = await renderCarousel({ intervalMs: 1000 });

    expect(position()).toBe('1 / 3');
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(position()).toBe('2 / 3');
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(position()).toBe('1 / 3');
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
  });

  it('stays still while paused or dragged', async () => {
    await renderCarousel({ intervalMs: 1000, paused: true });
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(position()).toBe('1 / 3');
  });

  it('pauses while the user drags and follows the swipe', async () => {
    const onIndexChange = await renderCarousel({ intervalMs: 1000 });
    const list = screen.getByTestId('carousel-list');

    await fireEvent(list, 'scrollBeginDrag');
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(position()).toBe('1 / 3');

    await fireEvent(list, 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 600, y: 0 } },
    });
    expect(position()).toBe('3 / 3');
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
  });

  it('pauses in the background', async () => {
    const listeners: ((state: string) => void)[] = [];
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_, listener) => {
        listeners.push(listener as (state: string) => void);
        return { remove: jest.fn() } as never;
      });
    await renderCarousel({ intervalMs: 1000 });

    await act(async () => {
      listeners.forEach(listener => listener('background'));
      jest.advanceTimersByTime(3000);
    });

    expect(position()).toBe('1 / 3');
  });

  it('shows no dots and does not move with a single slide', async () => {
    await renderCarousel({ data: ['Only'] });
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.getByText('Only')).toBeOnTheScreen();
    expect(screen.queryByLabelText(/\//)).toBeNull();
  });
});
