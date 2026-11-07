import { Text } from 'react-native';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { stackScreenOptions } from './RootNavigator';

// The app's stack hides headers by default. A screen must still be able to opt
// into a header of its own.
const Stack = createNativeStackNavigator({
  screenOptions: stackScreenOptions('light'),
  initialRouteName: 'Custom',
  screens: {
    Custom: {
      screen: () => <Text>Body</Text>,
      options: {
        headerShown: true,
        header: () => <Text>Custom header</Text>,
      },
    },
    Plain: { screen: () => <Text>Plain body</Text> },
  },
});

const Navigation = createStaticNavigation(Stack);

describe('stack header', () => {
  it('renders a custom header for a screen that asks for one', async () => {
    await render(
      <SafeAreaProvider>
        <Navigation />
      </SafeAreaProvider>,
    );

    expect(await screen.findByText('Custom header')).toBeOnTheScreen();
    expect(screen.getByText('Body')).toBeOnTheScreen();
  });

  it('hides the header by default and follows the theme for the status bar', () => {
    expect(stackScreenOptions('dark')).toEqual({
      headerShown: false,
      statusBarStyle: 'light',
    });
  });
});
