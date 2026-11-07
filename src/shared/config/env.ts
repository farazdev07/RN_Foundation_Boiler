import Config from 'react-native-config';
import { z } from 'zod';

const envSchema = z.object({
  APP_ENV: z.enum(['dev', 'staging', 'prod']),
  API_URL: z.url(),
  CDN_URL: z.url(),
  SENTRY_DSN: z.string().optional(),
  // Empty or missing turns the realtime connection off.
  SOCKET_URL: z.union([z.url(), z.literal('')]).optional(),
});

export type Env = z.infer<typeof envSchema>;

// A bad env is a build mistake, so it stops the app at startup instead of
// surfacing later as requests to a wrong or undefined host.
export const parseEnv = (source: unknown): Env => {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${z.prettifyError(parsed.error)}`);
  }
  if (
    parsed.data.APP_ENV !== 'dev' &&
    !parsed.data.API_URL.startsWith('https://')
  ) {
    throw new Error('API_URL must use HTTPS outside the dev environment');
  }
  if (
    parsed.data.APP_ENV !== 'dev' &&
    parsed.data.SOCKET_URL &&
    !parsed.data.SOCKET_URL.startsWith('https://')
  ) {
    throw new Error('SOCKET_URL must use HTTPS outside the dev environment');
  }
  return parsed.data;
};

export const env = parseEnv(Config);
