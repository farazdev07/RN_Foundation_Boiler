import { err, ok, type Result } from '@shared/lib/result';
import { appConfigSchema, type AppConfig } from '../model/versionGate';

const TIMEOUT_MS = 5_000;

// A plain fetch, not the API client: the document is public, lives on another
// host, and must load without a session.
export const fetchAppConfig = async (
  url: string,
): Promise<Result<AppConfig>> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!response.ok) {
      return err(new Error(`App config responded ${response.status}`));
    }
    const parsed = appConfigSchema.safeParse(await response.json());
    return parsed.success ? ok(parsed.data) : err(parsed.error);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  } finally {
    clearTimeout(timer);
  }
};
