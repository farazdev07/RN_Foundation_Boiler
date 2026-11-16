import {
  addSslPinningErrorListener,
  initializeSslPinning,
} from 'react-native-ssl-public-key-pinning';
import { env } from '@shared/config';
import { reportError } from '@shared/lib/monitoring';

// iOS refuses a single pin, and a single pin is also how apps lock their own
// users out when a certificate is renewed.
const MIN_PINS = 2;

// "a=,b=" from the env becomes ["a=", "b="].
export const parsePins = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map(pin => pin.trim())
    .filter(Boolean);

// The pins apply to the API host only. A CDN, a WebView and natively loaded
// images use their own connections and are not pinned.
export const pinningConfig = (
  apiUrl: string,
  pins: readonly string[],
): Record<
  string,
  { includeSubdomains: boolean; publicKeyHashes: string[] }
> => {
  if (pins.length === 0) {
    return {};
  }
  if (pins.length < MIN_PINS) {
    throw new Error(
      'API_PIN_HASHES needs at least two pins: the current key and a backup',
    );
  }
  return {
    [new URL(apiUrl).hostname]: {
      includeSubdomains: false,
      publicKeyHashes: [...pins],
    },
  };
};

const start = async (): Promise<void> => {
  const config = pinningConfig(env.API_URL, parsePins(env.API_PIN_HASHES));
  if (Object.keys(config).length === 0) {
    return;
  }
  // A mismatch fails the request like any network error. This makes it show
  // up in crash reporting as what it is: an attack, or a pin that needs
  // rotating.
  addSslPinningErrorListener(({ serverHostname }) =>
    reportError(new Error(`Certificate pin mismatch for ${serverHostname}`), {
      where: 'pinning',
    }),
  );
  await initializeSslPinning(config);
};

// The base query awaits this, so no request leaves before pinning is in
// place. A setup failure is reported and requests go on unpinned, because the
// other choice is an app that cannot reach its API at all.
export const pinningReady: Promise<void> = start().catch(error => {
  reportError(error, { where: 'pinning.init' });
});
