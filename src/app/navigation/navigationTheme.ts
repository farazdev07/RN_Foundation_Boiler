import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import type { Theme as AppTheme } from '@shared/ui';

export const toNavigationTheme = ({ mode, colors }: AppTheme): Theme => {
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
    },
  };
};
