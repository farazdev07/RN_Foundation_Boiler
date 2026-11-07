import { screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { ListFooterSpinner, Spinner } from './index';

describe('Spinner', () => {
  it('renders', async () => {
    await renderWithTheme(<Spinner testID="spinner" size="large" />);

    expect(screen.getByTestId('spinner')).toBeOnTheScreen();
  });
});

describe('ListFooterSpinner', () => {
  it('shows while loading and forwards spinner props', async () => {
    await renderWithTheme(<ListFooterSpinner loading testID="footer" />);

    expect(screen.getByTestId('footer')).toBeOnTheScreen();
  });

  it('renders nothing when idle', async () => {
    await renderWithTheme(
      <ListFooterSpinner loading={false} testID="footer" />,
    );

    expect(screen.queryByTestId('footer')).toBeNull();
  });
});
