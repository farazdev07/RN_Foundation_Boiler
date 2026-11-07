import type { PropsWithChildren } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';
import { sessionSlice, signedIn } from '@entities/session';
import { socket } from '@shared/api';
import { useRealtime } from './useRealtime';

const makeStore = () =>
  configureStore({ reducer: { session: sessionSlice.reducer } });

describe('useRealtime', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('connects only while signed in and wakes when the network returns', async () => {
    const start = jest.spyOn(socket, 'start');
    const stop = jest.spyOn(socket, 'stop');
    const wake = jest.spyOn(socket, 'wake');
    let networkListener: (state: object) => void = () => undefined;
    jest.mocked(NetInfo.addEventListener).mockImplementation(listener => {
      networkListener = listener as (state: object) => void;
      return () => undefined;
    });
    const store = makeStore();
    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider store={store}>{children}</Provider>
    );

    await renderHook(() => useRealtime(), { wrapper });
    expect(start).not.toHaveBeenCalled();

    await act(async () => {
      store.dispatch(signedIn());
    });
    expect(start).toHaveBeenCalledTimes(1);

    await act(async () => {
      networkListener({ isConnected: true, isInternetReachable: true });
    });
    expect(wake).toHaveBeenCalled();

    await act(async () => {
      store.dispatch(sessionSlice.actions.loggedOut());
    });
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
