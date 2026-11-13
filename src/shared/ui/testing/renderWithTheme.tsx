import type { PropsWithChildren, ReactElement } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { render } from '@testing-library/react-native';
import { common, initI18n } from '@shared/lib/i18n';
import { ThemeProvider } from '../theme';

// Shared components read their own labels from the common namespace.
initI18n({ common });

// The app's providers that shared UI depends on. Passed as a wrapper so
// rerender keeps them.
function Providers({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView>
      <ThemeProvider>{children}</ThemeProvider>
    </GestureHandlerRootView>
  );
}

export const renderWithTheme = (ui: ReactElement) =>
  render(ui, { wrapper: Providers });
