import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import '@app/i18n';
import { store } from '@app/store/store';
import { useDirection } from '@shared/lib/i18n';
import { ThemeProvider, ToastViewport } from '@shared/ui';

export function AppProviders({ children }: PropsWithChildren) {
  // Everything below lays out in the current language's direction, and flips
  // as soon as the language changes.
  const direction = useDirection();

  return (
    <Provider store={store}>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <KeyboardProvider>
            <ThemeProvider>
              <View testID="app-root" style={[styles.root, { direction }]}>
                {children}
                <ToastViewport />
              </View>
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
