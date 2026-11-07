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

// Stateful per service, so tests can check what is actually left in the Keychain.
jest.mock('react-native-keychain', () => {
  const entries = new Map<string, string>();
  const serviceOf = (options?: { service?: string }) =>
    options?.service ?? 'default';

  return {
    ...jest.requireActual('react-native-keychain/lib/commonjs/enums'),
    setGenericPassword: jest.fn(
      (_username: string, password: string, options?: { service?: string }) => {
        entries.set(serviceOf(options), password);
        return Promise.resolve({ service: serviceOf(options) });
      },
    ),
    getGenericPassword: jest.fn((options?: { service?: string }) => {
      const password = entries.get(serviceOf(options));
      return Promise.resolve(
        password === undefined
          ? false
          : { username: '', password, service: serviceOf(options) },
      );
    }),
    getSupportedBiometryType: jest.fn(() => Promise.resolve('FaceID')),
    resetGenericPassword: jest.fn((options?: { service?: string }) => {
      entries.delete(serviceOf(options));
      return Promise.resolve(true);
    }),
  };
});

jest.mock('react-native-config', () => ({
  __esModule: true,
  default: {
    APP_ENV: 'dev',
    API_URL: 'https://api.test',
    CDN_URL: 'https://cdn.test',
    SENTRY_DSN: '',
  },
}));

jest.mock('react-native-localize', () => ({
  findBestLanguageTag: jest.fn(() => ({
    languageTag: 'en',
    isRTL: false,
  })),
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

jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn(() => Promise.resolve()),
  isVisible: jest.fn(() => true),
  // Runs `animate` once, when ready, as the real hook does after layout.
  useHideAnimation: jest.fn(
    ({ ready = true, animate }: { ready?: boolean; animate: () => void }) => {
      const { useEffect, useRef } =
        jest.requireActual<typeof import('react')>('react');
      const started = useRef(false);
      useEffect(() => {
        if (ready && !started.current) {
          started.current = true;
          animate();
        }
      });
      return { container: { style: {} }, logo: { source: 0, style: {} } };
    },
  ),
}));

// @unit-start:date-time
// The picker is native. The iOS component becomes a View that tests can fire
// onChange on; the Android dialog becomes a spy.
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: View,
    DateTimePickerAndroid: { open: jest.fn(), dismiss: jest.fn() },
  };
});
// @unit-end:date-time

// @unit-start:media
jest.mock('react-native-image-crop-picker', () => ({
  __esModule: true,
  default: {
    openPicker: jest.fn(),
    openCamera: jest.fn(),
    clean: jest.fn(() => Promise.resolve()),
  },
}));

// fetch returns a promise with the progress hooks the library adds to it.
jest.mock('react-native-blob-util', () => {
  const request = (status = 200) => {
    const promise = Promise.resolve({ respInfo: { status } }) as Promise<{
      respInfo: { status: number };
    }> & { progress: jest.Mock; uploadProgress: jest.Mock };
    promise.progress = jest.fn(() => promise);
    promise.uploadProgress = jest.fn(() => promise);
    return promise;
  };
  const fetch = jest.fn(() => request());
  return {
    __esModule: true,
    default: {
      fetch,
      config: jest.fn(() => ({ fetch })),
      wrap: jest.fn((path: string) => `ReactNativeBlobUtil-file://${path}`),
      fs: {
        dirs: { DocumentDir: '/docs', CacheDir: '/cache' },
        unlink: jest.fn(() => Promise.resolve()),
      },
      media: {
        copyToMediaStore: jest.fn(() =>
          Promise.resolve('content://downloads/1'),
        ),
      },
      open: {
        optionsMenu: jest.fn(() => Promise.resolve()),
        chooser: jest.fn(() => Promise.resolve()),
      },
      __request: request,
    },
  };
});
// @unit-end:media
