import type { PropsWithChildren } from 'react';
import { createMMKV } from 'react-native-mmkv';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { selectSessionStatus, sessionSlice, signedIn } from '@entities/session';
import { baseApi } from '@shared/api';
import { common, initI18n } from '@shared/lib/i18n';
import { ThemeProvider } from '@shared/ui';
import { settingsStrings, SettingsScreen } from '@screens/settings';

const makeStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      [sessionSlice.name]: sessionSlice.reducer,
    },
    middleware: getDefault => getDefault().concat(baseApi.middleware),
    enhancers: getDefault => getDefault({ autoBatch: false }),
  });

const renderSettings = async (store = makeStore()) => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>
      <ThemeProvider>{children}</ThemeProvider>
    </Provider>
  );
  await render(<SettingsScreen />, { wrapper });
  return store;
};

describe('SettingsScreen', () => {
  beforeAll(() => {
    initI18n({ common, settings: settingsStrings });
  });

  beforeEach(() => {
    createMMKV({ id: 'device' }).clearAll();
  });

  it('switches and remembers the theme preference', async () => {
    await renderSettings();

    expect(screen.getByRole('radio', { name: 'Match system' })).toBeChecked();

    await fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(createMMKV({ id: 'device' }).getString('theme.preference')).toBe(
      '{"v":1,"d":"dark"}',
    );
  });

  it('logs out only after confirmation', async () => {
    const store = makeStore();
    store.dispatch(signedIn());
    await renderSettings(store);

    await fireEvent.press(screen.getByTestId('settings-logout'));
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(selectSessionStatus(store.getState())).toBe('signedIn');

    await fireEvent.press(screen.getByTestId('settings-logout'));
    const [, confirm] = screen.getAllByRole('button', { name: 'Log out' });
    await fireEvent.press(confirm!);

    expect(selectSessionStatus(store.getState())).toBe('signedOut');
  });
});
