import { z } from 'zod';

const platformSchema = z.object({
  // Below this, the app is blocked until it is updated.
  minVersion: z.string(),
  // Below this, the user is offered an update once per version.
  latestVersion: z.string().optional(),
  storeUrl: z.url(),
});

// The remote document. It can be a static JSON file on a CDN; no backend is
// needed. Unknown fields are ignored, so the document can grow.
export const appConfigSchema = z.object({
  maintenance: z
    .object({ active: z.boolean(), message: z.string().optional() })
    .optional(),
  ios: platformSchema.optional(),
  android: platformSchema.optional(),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

export type GateDecision =
  | { kind: 'ok' }
  | { kind: 'maintenance'; message?: string }
  | { kind: 'required'; storeUrl: string }
  | { kind: 'optional'; storeUrl: string; latestVersion: string };

// "1.4.0-beta.2+7" compares as 1.4.0. A missing part counts as 0, so "1.4" is
// "1.4.0", and anything that is not a number counts as 0.
const parts = (version: string): number[] =>
  (version.split(/[-+]/)[0] ?? '')
    .split('.')
    .map(part => Number.parseInt(part, 10) || 0);

export const compareVersions = (left: string, right: string): -1 | 0 | 1 => {
  const a = parts(left);
  const b = parts(right);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) {
      return difference < 0 ? -1 : 1;
    }
  }
  return 0;
};

export const decide = (
  config: AppConfig,
  currentVersion: string,
  platform: string,
): GateDecision => {
  if (config.maintenance?.active) {
    const { message } = config.maintenance;
    return { kind: 'maintenance', ...(message && { message }) };
  }
  const target =
    platform === 'ios'
      ? config.ios
      : platform === 'android'
        ? config.android
        : undefined;
  if (!target) {
    return { kind: 'ok' };
  }
  if (compareVersions(currentVersion, target.minVersion) < 0) {
    return { kind: 'required', storeUrl: target.storeUrl };
  }
  if (
    target.latestVersion &&
    compareVersions(currentVersion, target.latestVersion) < 0
  ) {
    return {
      kind: 'optional',
      storeUrl: target.storeUrl,
      latestVersion: target.latestVersion,
    };
  }
  return { kind: 'ok' };
};
