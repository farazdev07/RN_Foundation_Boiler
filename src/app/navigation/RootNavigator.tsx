import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@screens/home';
import { SettingsScreen } from '@screens/settings';
import { useTranslation } from '@shared/lib/i18n';
import {
  ErrorBoundary,
  Icon,
  NetworkBanner,
  useTheme,
  type IconName,
} from '@shared/ui';

export type TabParamList = {
  Home: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

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

function TabNavigator() {
  const { t } = useTranslation('settings');

  return (
    <Tabs.Navigator
      screenLayout={routeLayout}
      screenOptions={{ tabBarHideOnKeyboard: true }}
    >
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: tabIcon('house'),
          tabBarButtonTestID: 'tab-home',
        }}
      />
      <Tabs.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('title'),
          tabBarIcon: tabIcon('settings'),
          tabBarButtonTestID: 'tab-settings',
        }}
      />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { mode } = useTheme();

  // iOS hands status bar control to each native screen, so the style is set
  // here rather than with RN's StatusBar component.
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        statusBarStyle: mode === 'dark' ? 'light' : 'dark',
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  route: {
    flex: 1,
  },
});
