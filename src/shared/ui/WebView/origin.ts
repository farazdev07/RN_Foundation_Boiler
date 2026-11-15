// "https://pay.example.com/x?y" becomes "https://pay.example.com". Only HTTPS,
// and nothing with user info, so "https://pay.example.com@evil.io" has no
// origin here. Written by hand because Hermes' URL has no `origin`.
export const originOf = (url: string): string | null => {
  const match = /^https:\/\/([a-z0-9.-]+)(:\d+)?(?=[/?#]|$)/i.exec(url.trim());
  return match
    ? `https://${(match[1] ?? '').toLowerCase()}${match[2] ?? ''}`
    : null;
};

// An exact origin match. A subdomain must be listed on its own.
export const isAllowedUrl = (
  url: string,
  allowedOrigins: readonly string[],
): boolean => {
  const origin = originOf(url);
  return (
    origin !== null &&
    allowedOrigins.some(allowed => originOf(allowed) === origin)
  );
};
