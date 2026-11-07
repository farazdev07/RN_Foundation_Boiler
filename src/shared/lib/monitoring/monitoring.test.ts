import { reportError, setErrorReporter } from '@shared/lib/monitoring';

describe('monitoring', () => {
  afterEach(() => {
    setErrorReporter(null);
  });

  it('does nothing without a reporter', () => {
    expect(() => reportError(new Error('boom'))).not.toThrow();
  });

  it('forwards to the reporter', () => {
    const reporter = jest.fn();
    const error = new Error('boom');
    setErrorReporter(reporter);

    reportError(error, { screen: 'Home' });

    expect(reporter).toHaveBeenCalledWith(error, { screen: 'Home' });
  });
});
