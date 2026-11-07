import { z } from 'zod';
import { defineKey } from '@shared/storage';

// Written through the same key ThemeProvider reads, so tests get a real dark theme.
const preferenceKey = defineKey({
  name: 'theme.preference',
  schema: z.enum(['system', 'light', 'dark']),
  version: 1,
  kind: 'user',
  scope: 'device',
});

export const darkColorPreference = (): void => {
  preferenceKey.set('dark');
};
