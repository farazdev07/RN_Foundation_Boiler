import NetInfo from '@react-native-community/netinfo';
import { act, renderHook } from '@testing-library/react-native';
import { isOnline, useIsOnline } from '@shared/lib/network';

describe('isOnline', () => {
  it.each([
    [{ isConnected: true, isInternetReachable: true }, true],
    [{ isConnected: true, isInternetReachable: null }, true],
    [{ isConnected: true, isInternetReachable: false }, false],
    [{ isConnected: false, isInternetReachable: null }, false],
    [{ isConnected: null, isInternetReachable: null }, false],
  ])('%j -> %s', (state, expected) => {
    expect(isOnline(state)).toBe(expected);
  });
});

describe('useIsOnline', () => {
  it('follows NetInfo and unsubscribes on unmount', async () => {
    const unsubscribe = jest.fn();
    let emit: (state: object) => void = () => undefined;
    jest.mocked(NetInfo.addEventListener).mockImplementationOnce(listener => {
      emit = listener as (state: object) => void;
      return unsubscribe;
    });

    const { result, unmount } = await renderHook(() => useIsOnline());

    expect(result.current).toBe(true);
    await act(async () =>
      emit({ isConnected: false, isInternetReachable: null }),
    );
    expect(result.current).toBe(false);

    await unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
