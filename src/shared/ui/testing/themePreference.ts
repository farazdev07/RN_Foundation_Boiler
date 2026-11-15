import { preferenceKey } from '../theme/ThemeProvider';

// Written through the key ThemeProvider reads, so tests get a real dark theme.
export const darkColorPreference = (): void => {
  preferenceKey.set('dark');
};
