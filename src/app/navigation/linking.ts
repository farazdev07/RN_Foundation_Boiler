import { env } from '@shared/config';

// Matches the scheme each native build registers (Info.plist APP_URL_SCHEME,
// Android manifestPlaceholders), so dev, staging and prod do not share links.
export const urlScheme = `rn-foundation${env.APP_ENV === 'prod' ? '' : `-${env.APP_ENV}`}`;

// Paths are generated from the static navigator config: `<scheme>://settings`
// opens Settings. A link to a screen outside the current auth group is ignored.
export const linking = {
  enabled: 'auto' as const,
  prefixes: [`${urlScheme}://`],
};
