// The factories replace native modules, which cannot load under Node.
jest.mock('react-native-mmkv', () => {
  const instances = new Map<string, Map<string, unknown>>();

  // Instances with the same id share data, as they do on a device.
  const createMMKV = ({ id = 'default' }: { id?: string } = {}) => {
    const values = instances.get(id) ?? new Map<string, unknown>();
    instances.set(id, values);

    return {
      set: (key: string, value: unknown) => {
        values.set(key, value);
      },
      getString: (key: string) => {
        const value = values.get(key);
        return typeof value === 'string' ? value : undefined;
      },
      contains: (key: string) => values.has(key),
      remove: (key: string) => values.delete(key),
      clearAll: () => values.clear(),
      getAllKeys: () => [...values.keys()],
    };
  };

  return { createMMKV };
});

jest.mock('react-native-keychain', () => ({
  ...jest.requireActual('react-native-keychain/lib/commonjs/enums'),
  setGenericPassword: jest.fn(() => Promise.resolve({ service: 'mock' })),
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('react-native-config', () => ({
  __esModule: true,
  default: {
    APP_ENV: 'dev',
    API_URL: 'https://api.test',
    CDN_URL: 'https://cdn.test',
    SENTRY_DSN: '',
  },
}));

jest.mock('@react-native-community/netinfo', () => {
  const online = { isConnected: true, isInternetReachable: true };
  const netInfo = {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn(() => Promise.resolve(online)),
  };

  return { __esModule: true, default: netInfo, ...netInfo };
});

jest.mock('react-native-keyboard-controller', () =>
  jest.requireActual('react-native-keyboard-controller/jest'),
);

// SafeAreaProvider renders nothing until the native side reports insets.
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

// Gesture Handler schedules this against the native UI runtime, which the web
// Worklets build used under Jest rejects. Its own web variant is the same no-op.
jest.mock(
  'react-native-gesture-handler/lib/module/handlers/gestures/installUIRuntimeBindings',
  () => ({ installUIRuntimeBindings: jest.fn() }),
);
