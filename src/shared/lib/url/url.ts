import { env } from '@shared/config';

// Absolute URLs pass through; a relative path is resolved against the CDN.
export const resolveAssetUrl = (
  path: string | null | undefined,
  base: string = env.CDN_URL,
): string | null => {
  if (!path) {
    return null;
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};
