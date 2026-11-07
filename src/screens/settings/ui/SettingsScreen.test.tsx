import { createMMKV } from 'react-native-mmkv';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { common, initI18n } from '@shared/lib/i18n';
import { ThemeProvider } from '@shared/ui';
import { settingsStrings, SettingsScreen } from '@screens/settings';

describe('SettingsScreen', () => {
  beforeAll(() => {
    initI18n({ common, settings: settingsStrings });
  });

  beforeEach(() => {
    createMMKV({ id: 'device' }).clearAll();
  });

  it('switches and remembers the theme preference', async () => {
    await render(
      <ThemeProvider>
        <SettingsScreen />
      </ThemeProvider>,
    );

    expect(screen.getByRole('radio', { name: 'Match system' })).toBeChecked();

    await fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(createMMKV({ id: 'device' }).getString('theme.preference')).toBe(
      '{"v":1,"d":"dark"}',
    );
  });
});
