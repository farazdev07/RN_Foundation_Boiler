import { act, renderHook } from '@testing-library/react-native';
import { useDebounce } from '@shared/lib/debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('settles on the last value after the delay', async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebounce(value, 400),
      { initialProps: { value: 'a' } },
    );

    await rerender({ value: 'ab' });
    await act(async () => jest.advanceTimersByTime(200));
    await rerender({ value: 'abc' });
    await act(async () => jest.advanceTimersByTime(399));

    expect(result.current).toBe('a');

    await act(async () => jest.advanceTimersByTime(1));

    expect(result.current).toBe('abc');
  });
});
