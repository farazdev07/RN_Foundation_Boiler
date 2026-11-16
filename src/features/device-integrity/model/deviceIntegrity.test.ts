import JailMonkey from 'jail-monkey';
import { decideIntegrity, isDeviceCompromised } from './deviceIntegrity';

const jailMonkey = jest.mocked(JailMonkey);

describe('device integrity', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['off', true, false, 'ok'],
    ['warn', false, false, 'ok'],
    ['warn', true, false, 'warn'],
    ['warn', true, true, 'ok'],
    ['block', false, false, 'ok'],
    ['block', true, false, 'block'],
    // Acknowledging a warning never unlocks a blocking policy.
    ['block', true, true, 'block'],
  ] as const)(
    'policy %s, compromised %s, acknowledged %s gives %s',
    (policy, compromised, acknowledged, expected) => {
      expect(decideIntegrity(policy, compromised, acknowledged)).toBe(expected);
    },
  );

  it('flags a rooted device and a hooked one', () => {
    expect(isDeviceCompromised()).toBe(false);

    jailMonkey.isJailBroken.mockReturnValueOnce(true);
    expect(isDeviceCompromised()).toBe(true);

    jailMonkey.hookDetected.mockReturnValueOnce(true);
    expect(isDeviceCompromised()).toBe(true);
  });

  it('lets the app through when the check itself fails', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jailMonkey.isJailBroken.mockImplementationOnce(() => {
      throw new Error('native module missing');
    });

    expect(isDeviceCompromised()).toBe(false);
  });
});
