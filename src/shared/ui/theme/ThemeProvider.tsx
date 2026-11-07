import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  StyleSheet,
  useColorScheme,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { z } from 'zod';
import { defineKey } from '@shared/storage';
import { themes, type Theme } from './theme';

const preferenceSchema = z.enum(['system', 'light', 'dark']);

export type ThemePreference = z.infer<typeof preferenceSchema>;

// A device setting, so it survives logout. Read synchronously so the first frame
// is already in the right theme.
const preferenceKey = defineKey({
  name: 'theme.preference',
  schema: preferenceSchema,
  version: 1,
  kind: 'user',
  scope: 'device',
});

type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setStoredPreference] = useState<ThemePreference>(
    () => preferenceKey.get() ?? 'system',
  );

  const setPreference = useCallback((next: ThemePreference) => {
    preferenceKey.set(next);
    setStoredPreference(next);
  }, []);

  const value = useMemo(() => {
    const system = systemScheme === 'dark' ? 'dark' : 'light';
    const mode = preference === 'system' ? system : preference;

    return { theme: themes[mode], preference, setPreference };
  }, [preference, setPreference, systemScheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

const useThemeContext = (): ThemeContextValue => {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('Theme hooks must be used inside ThemeProvider');
  }
  return value;
};

export const useTheme = (): Theme => useThemeContext().theme;

export const useThemePreference = () => {
  const { preference, setPreference } = useThemeContext();
  return { preference, setPreference };
};

type NamedStyles<T> = { [K in keyof T]: ViewStyle | TextStyle | ImageStyle };

// Styles are rebuilt only when the theme changes, not on every render.
export const makeStyles =
  <T extends NamedStyles<T>>(factory: (theme: Theme) => T) =>
  (): T => {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
