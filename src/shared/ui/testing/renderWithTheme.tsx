import type { PropsWithChildren, ReactElement } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme';

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
