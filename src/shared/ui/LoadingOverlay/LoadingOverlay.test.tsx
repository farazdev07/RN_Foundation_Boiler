import { screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { LoadingOverlay } from './index';

describe('LoadingOverlay', () => {
  it('announces progress with its message', async () => {
    await renderWithTheme(<LoadingOverlay visible message="Signing in" />);

    expect(screen.getByLabelText('Signing in')).toBeOnTheScreen();
    expect(screen.getByText('Signing in')).toBeOnTheScreen();
  });

  it('has a default label', async () => {
    await renderWithTheme(<LoadingOverlay visible />);

    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
  });
});
