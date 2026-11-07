import { Text } from 'react-native';
import { screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { Screen } from './index';

describe('Screen', () => {
  it.each([
    ['plain', {}],
    ['below a header', { belowHeader: true }],
    ['scrollable', { scrollable: true }],
    ['keyboard aware', { keyboardAware: true }],
    ['unpadded', { padded: false }],
  ])('renders children when %s', async (_name, props) => {
    await renderWithTheme(
      <Screen {...props}>
        <Text>Body</Text>
      </Screen>,
    );

    expect(screen.getByText('Body')).toBeOnTheScreen();
  });
});
