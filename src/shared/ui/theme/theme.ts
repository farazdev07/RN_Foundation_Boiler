import type { ViewStyle } from 'react-native';
import { darkColors, lightColors, type ColorTokens } from './colors';
import { breakpoints } from './breakpoints';
import { typography } from './typography';

export type ThemeMode = 'light' | 'dark';

const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
const radii = { sm: 4, md: 8, lg: 16, full: 999 } as const;
// Text and forms stop growing at this width, so a tablet shows a readable
// column instead of full-width lines.
const layout = { maxContentWidth: 720 } as const;

const elevation = (level: number, shadowOpacity: number): ViewStyle => ({
  elevation: level,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: level },
  shadowOpacity,
  shadowRadius: level * 2,
});

const elevations = {
  low: elevation(1, 0.1),
  medium: elevation(3, 0.14),
  high: elevation(6, 0.18),
};

export type Theme = {
  mode: ThemeMode;
  colors: ColorTokens;
  spacing: typeof spacing;
  radii: typeof radii;
  layout: typeof layout;
  breakpoints: typeof breakpoints;
  typography: typeof typography;
  elevations: typeof elevations;
};

const shared = {
  spacing,
  radii,
  layout,
  breakpoints,
  typography,
  elevations,
};

export const themes: Record<ThemeMode, Theme> = {
  light: { mode: 'light', colors: lightColors, ...shared },
  dark: { mode: 'dark', colors: darkColors, ...shared },
};
