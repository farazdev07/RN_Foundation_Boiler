import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  createNavigationContainerRef,
  createStaticNavigation,
  type StaticParamList,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import { useSessionStatus } from '@entities/session';
import { HomeScreen } from '@screens/home';
import { LoginScreen } from '@screens/login';
import { SettingsScreen } from '@screens/settings';
import { i18next } from '@shared/lib/i18n';
import {
  ErrorBoundary,
  Icon,
  NetworkBanner,
  useTheme,
  type IconName,
} from '@shared/ui';
import { linking } from './linking';
import { toNavigationTheme } from './navigationTheme';

// Each route gets its own boundary, so one broken screen leaves the rest usable.
const routeLayout = ({ children }: { children: ReactNode }) => (
  <View style={styles.route}>
    <NetworkBanner />
    <ErrorBoundary>{children}</ErrorBoundary>
  </View>
);

const tabIcon =
  (name: IconName) =>
  ({ focused }: { focused: boolean }) => (
    <Icon name={name} size={22} color={focused ? 'primary' : 'textSecondary'} />
  );

const Tabs = createBottomTabNavigator({
  screenLayout: routeLayout,
  screenOptions: { tabBarHideOnKeyboard: true },
  screens: {
    Home: {
      screen: HomeScreen,
      options: {
        tabBarIcon: tabIcon('house'),
        tabBarButtonTestID: 'tab-home',
      },
    },
    Settings: {
      screen: SettingsScreen,
      // Options are static here, so the string is looked up once. Fine while the
      // app is English only; a language switcher would move this into the screen.
      options: () => ({
        title: i18next.t('settings:title'),
        tabBarIcon: tabIcon('settings'),
        tabBarButtonTestID: 'tab-settings',
      }),
    },
  },
});

// Screens start without a header. One that wants a header, native or custom,
// sets `headerShown: true` and, for a custom one, `header` in its own options.
export const stackScreenOptions = (
  mode: 'light' | 'dark',
): NativeStackNavigationOptions => ({
  headerShown: false,
  // iOS hands status bar control to each native screen, so the style is set
  // here rather than with RN's StatusBar component.
  statusBarStyle: mode === 'dark' ? 'light' : 'dark',
});

const useIsSignedIn = () => useSessionStatus() === 'signedIn';
const useIsSignedOut = () => useSessionStatus() === 'signedOut';

// Groups swap the whole screen set on sign-in and sign-out, so signing out
// leaves no signed-in screen in the history to go back to.
const RootStack = createNativeStackNavigator({
  screenOptions: ({ theme }) =>
    stackScreenOptions(theme.dark ? 'dark' : 'light'),
  groups: {
    SignedIn: {
      if: useIsSignedIn,
      screens: { Tabs },
    },
    SignedOut: {
      if: useIsSignedOut,
      screens: {
        Login: { screen: LoginScreen, layout: routeLayout },
      },
    },
  },
});

export type RootStackParamList = StaticParamList<typeof RootStack>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// For navigating from outside a screen, such as a notification handler.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const Navigation = createStaticNavigation(RootStack);

export function RootNavigator() {
  const theme = useTheme();
  const navigationTheme = useMemo(() => toNavigationTheme(theme), [theme]);
  const status = useSessionStatus();

  // The splash covers this until the saved session has been checked.
  if (status === 'unknown') {
    return null;
  }

  return (
    <Navigation ref={navigationRef} theme={navigationTheme} linking={linking} />
  );
}

const styles = StyleSheet.create({
  route: {
    flex: 1,
  },
});
