import { Text } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { common, initI18n } from '@shared/lib/i18n';
import { setErrorReporter } from '@shared/lib/monitoring';
import { renderWithTheme } from '../testing/renderWithTheme';
import { ErrorBoundary } from './index';

let shouldThrow = true;

function Bomb() {
  if (shouldThrow) {
    throw new Error('boom');
  }
  return <Text>Recovered</Text>;
}

describe('ErrorBoundary', () => {
  beforeAll(() => {
    initI18n({ common });
  });

  beforeEach(() => {
    shouldThrow = true;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    setErrorReporter(null);
    jest.restoreAllMocks();
  });

  it('shows a fallback and reports the error', async () => {
    const reporter = jest.fn();
    setErrorReporter(reporter);

    await renderWithTheme(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    expect(reporter).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom' }),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });

  it('remounts the children on retry', async () => {
    await renderWithTheme(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    shouldThrow = false;

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Recovered')).toBeOnTheScreen();
  });
});
