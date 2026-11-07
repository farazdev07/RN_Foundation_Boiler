import * as Sentry from '@sentry/react-native';
import { reportError, setErrorReporter } from '@shared/lib/monitoring';
import { initMonitoring } from './sentry';

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
}));

describe('initMonitoring', () => {
  afterEach(() => {
    setErrorReporter(null);
    jest.clearAllMocks();
  });

  it('stays off without a DSN', () => {
    expect(initMonitoring('')).toBe(false);
    expect(initMonitoring(undefined)).toBe(false);

    reportError(new Error('boom'));

    expect(Sentry.init).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('starts Sentry without personal data and routes reported errors to it', () => {
    const error = new Error('boom');

    expect(initMonitoring('https://key@sentry.test/1')).toBe(true);
    reportError(error, { screen: 'Home' });

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://key@sentry.test/1',
        environment: 'dev',
        sendDefaultPii: false,
      }),
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      extra: { screen: 'Home' },
    });
  });

  it('sends errors without context as they are', () => {
    initMonitoring('https://key@sentry.test/1');
    const error = new Error('boom');

    reportError(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(error, undefined);
  });
});
