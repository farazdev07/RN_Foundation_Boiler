import { useMemo, type PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import '@app/i18n';
import { toNavigationTheme } from '@app/navigation/navigationTheme';
import { store } from '@app/store/store';
import { ThemeProvider, ToastViewport, useTheme } from '@shared/ui';

function ThemedNavigation({ children }: PropsWithChildren) {
  const theme = useTheme();
  const navigationTheme = useMemo(() => toNavigationTheme(theme), [theme]);

  return (
    <NavigationContainer theme={navigationTheme}>
      {children}
    </NavigationContainer>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <KeyboardProvider>
            <ThemeProvider>
              <ThemedNavigation>{children}</ThemedNavigation>
              <ToastViewport />
            </ThemeProvider>
          </KeyboardProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
