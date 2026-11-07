import * as Sentry from '@sentry/react-native';
import { env } from '@shared/config';
import { setErrorReporter } from '@shared/lib/monitoring';

// The only file that knows about Sentry. Everything else reports through
// @shared/lib/monitoring, so swapping vendors or deleting this unit touches
// nothing outside src/app/monitoring and index.js.
export const initMonitoring = (dsn = env.SENTRY_DSN): boolean => {
  if (!dsn) {
    return false;
  }

  Sentry.init({
    dsn,
    environment: env.APP_ENV,
    // No IP address, cookies or user details unless a later change sets them on purpose.
    sendDefaultPii: false,
  });

  setErrorReporter((error, context) => {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  });

  return true;
};
