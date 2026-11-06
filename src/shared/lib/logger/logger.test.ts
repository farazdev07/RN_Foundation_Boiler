import { devError, devLog, devWarn } from '@shared/lib/logger';

const silence = (method: 'log' | 'warn' | 'error') =>
  jest.spyOn(console, method).mockImplementation(() => undefined);

describe('logger', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    Object.assign(globalThis, { __DEV__: true });
  });

  it.each([
    ['log', devLog],
    ['warn', devWarn],
    ['error', devError],
  ] as const)('forwards %s in development', (method, log) => {
    const spy = silence(method);

    log('message', 1);

    expect(spy).toHaveBeenCalledWith('message', 1);
  });

  it.each([
    ['log', devLog],
    ['warn', devWarn],
    ['error', devError],
  ] as const)('stays silent for %s in release', (method, log) => {
    Object.assign(globalThis, { __DEV__: false });
    const spy = silence(method);

    log('message');

    expect(spy).not.toHaveBeenCalled();
  });
});
