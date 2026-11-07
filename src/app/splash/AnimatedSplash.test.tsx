import { act, render, screen } from '@testing-library/react-native';
import {
  AnimatedSplash,
  SPLASH_FADE_MS,
  SPLASH_SCALE_MS,
} from './AnimatedSplash';

describe('AnimatedSplash', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('adds at most 500 ms to startup', () => {
    expect(Math.max(SPLASH_FADE_MS, SPLASH_SCALE_MS)).toBeLessThanOrEqual(500);
  });

  it('covers the app until ready, then animates away', async () => {
    const { rerender } = await render(<AnimatedSplash ready={false} />);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('animated-splash')).toBeOnTheScreen();

    await rerender(<AnimatedSplash ready />);
    await act(async () => {
      jest.advanceTimersByTime(Math.max(SPLASH_FADE_MS, SPLASH_SCALE_MS) + 50);
    });

    expect(screen.queryByTestId('animated-splash')).toBeNull();
  });
});
