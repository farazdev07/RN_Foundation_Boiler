import { z } from 'zod';
import type { RefreshHandler, Tokens } from '@shared/api';
import { env } from '@shared/config';
import { err, ok } from '@shared/lib/result';

const REFRESH_TIMEOUT_MS = 15_000;
const TOKEN_LIFETIME_MINUTES = 30;

const tokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

// Plain fetch, not RTK Query: this runs inside the base query's 401 handling,
// so going through the base query again could recurse.
export const refreshTokens: RefreshHandler = async refreshToken => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshToken,
        expiresInMins: TOKEN_LIFETIME_MINUTES,
      }),
      signal: controller.signal,
    });

    // 4xx means the server looked at the token and said no.
    if (response.status >= 400 && response.status < 500) {
      return err('rejected');
    }
    if (!response.ok) {
      return err('unavailable');
    }

    const parsed = tokensSchema.safeParse(await response.json());
    return parsed.success ? ok<Tokens>(parsed.data) : err('unavailable');
  } catch {
    return err('unavailable');
  } finally {
    clearTimeout(timer);
  }
};
