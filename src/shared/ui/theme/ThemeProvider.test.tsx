import { Text } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { act, render, screen } from '@testing-library/react-native';
import {
  ThemeProvider,
  makeStyles,
  useTheme,
  useThemePreference,
  type ThemePreference,
} from '@shared/ui/theme';

const mockColorScheme = jest.fn<'light' | 'dark' | null, []>();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockColorScheme(),
}));

const setSystemScheme = (scheme: 'light' | 'dark' | null) =>
  mockColorScheme.mockReturnValue(scheme);

let setPreference: (preference: ThemePreference) => void;

const useBackground = makeStyles(theme => ({
  box: { backgroundColor: theme.colors.background },
}));

function Probe() {
  const { mode } = useTheme();
  const { preference, setPreference: set } = useThemePreference();
  const styles = useBackground();
  setPreference = set;

  return (
    <Text>{`${mode}:${preference}:${String(styles.box.backgroundColor)}`}</Text>
  );
}

const renderProbe = () =>
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );

describe('ThemeProvider', () => {
  beforeEach(() => {
    createMMKV({ id: 'device' }).clearAll();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('follows the system by default', async () => {
    setSystemScheme('dark');

    await renderProbe();

    expect(screen.getByText('dark:system:#0F1216')).toBeOnTheScreen();
  });

  it('treats an unknown system scheme as light', async () => {
    setSystemScheme(null);

    await renderProbe();

    expect(screen.getByText('light:system:#F6F7F9')).toBeOnTheScreen();
  });

  it('lets the user override the system and remembers it', async () => {
    setSystemScheme('light');
    await renderProbe();

    await act(async () => setPreference('dark'));

    expect(screen.getByText('dark:dark:#0F1216')).toBeOnTheScreen();

    await screen.unmount();
    await renderProbe();

    expect(screen.getByText('dark:dark:#0F1216')).toBeOnTheScreen();
  });

  it('throws a clear error outside the provider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(render(<Probe />)).rejects.toThrow('inside ThemeProvider');
  });
});
