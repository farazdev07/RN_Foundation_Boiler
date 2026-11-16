import { useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  createNavigationContainerRef,
  createStaticNavigation,
  type NavigationState,
  type StaticParamList,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import { useSessionStatus } from '@entities/session';
import { FavoritesScreen } from '@screens/favorites'; // @unit:products
import { HomeScreen } from '@screens/home';
import { LoginScreen } from '@screens/login';
import { OnboardingScreen, useOnboardingDone } from '@screens/onboarding'; // @unit:onboarding
import { ProductDetailsScreen } from '@screens/product-details'; // @unit:products
import { ProductListScreen } from '@screens/product-list'; // @unit:products
import { SettingsScreen } from '@screens/settings';
import { i18next, useDirection, useTranslation } from '@shared/lib/i18n';
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
      options: () => ({
        title: i18next.t('home:title'),
        tabBarIcon: tabIcon('house'),
        tabBarButtonTestID: 'tab-home',
      }),
    },
    // @unit-start:products
    Products: {
      screen: ProductListScreen,
      options: () => ({
        title: i18next.t('productList:title'),
        tabBarIcon: tabIcon('shopping-bag'),
        tabBarButtonTestID: 'tab-products',
      }),
    },
    Favorites: {
      screen: FavoritesScreen,
      options: () => ({
        title: i18next.t('favorites:title'),
        tabBarIcon: tabIcon('heart'),
        tabBarButtonTestID: 'tab-favorites',
      }),
    },
    // @unit-end:products
    Settings: {
      screen: SettingsScreen,
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
const useNeedsOnboarding = () => !useOnboardingDone(); // @unit:onboarding

// Groups swap the whole screen set on sign-in and sign-out, so signing out
// leaves no signed-in screen in the history to go back to.
const RootStack = createNativeStackNavigator({
  screenOptions: ({ theme }) =>
    stackScreenOptions(theme.dark ? 'dark' : 'light'),
  groups: {
    SignedIn: {
      if: useIsSignedIn,
      screens: {
        Tabs,
        // @unit-start:products
        ProductDetails: {
          screen: ProductDetailsScreen,
          layout: routeLayout,
          // The title arrives with the product.
          options: {
            headerShown: true,
            title: '',
            headerBackButtonDisplayMode: 'minimal',
          },
          linking: { path: 'products/:id', parse: { id: Number } },
        },
        // @unit-end:products
      },
    },
    SignedOut: {
      if: useIsSignedOut,
      screens: {
        // @unit-start:onboarding
        // First in the group, so it is where a new install starts. Completing
        // it removes the screen, which leaves Login.
        Onboarding: {
          if: useNeedsOnboarding,
          screen: OnboardingScreen,
          layout: routeLayout,
        },
        // @unit-end:onboarding
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

// For reading or driving navigation from outside a screen: the language
// switch below uses it, and a notification handler would.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const Navigation = createStaticNavigation(RootStack);

type Props = {
  // Called once the first screen has mounted.
  onReady?: () => void;
};

export function RootNavigator({ onReady }: Props) {
  const theme = useTheme();
  const navigationTheme = useMemo(() => toNavigationTheme(theme), [theme]);
  const status = useSessionStatus();
  // Titles are read with i18next.t in the static config above, once per mount.
  // A language change remounts the navigator to re-read them, and hands it the
  // state it had, so the user stays on the screen they were on.
  const { i18n } = useTranslation();
  const direction = useDirection();
  const [saved, setSaved] = useState<{
    language: string;
    state: NavigationState | undefined;
  }>({ language: i18n.language, state: undefined });
  if (saved.language !== i18n.language) {
    setSaved({
      language: i18n.language,
      state: navigationRef.isReady() ? navigationRef.getRootState() : undefined,
    });
  }

  // The splash covers this until the saved session has been checked.
  if (status === 'unknown') {
    return null;
  }

  return (
    <Navigation
      key={saved.language}
      ref={navigationRef}
      {...(saved.state && { initialState: saved.state })}
      theme={navigationTheme}
      direction={direction}
      linking={linking}
      {...(onReady && { onReady })}
    />
  );
}

const styles = StyleSheet.create({
  route: {
    flex: 1,
  },
});
