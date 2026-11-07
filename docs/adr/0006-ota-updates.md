# 0006. No OTA updates in the foundation

- Status: Accepted
- Date: 2026-11-07

## Context

Over-the-air updates ship JS and asset changes without a store release. Microsoft's CodePush is gone: App Center
was retired in March 2025. Every replacement needs a host and release channels, which belong to a specific app
rather than to the template.

The options, checked on 2026-11-07:

| Option           | Package and latest version                                       | Hosting                                                                         | Notes                                                                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Revopush**     | `@revopush/react-native-code-push` 2.6.2 (2026-09-13)            | Hosted, paid                                                                    | A CodePush-compatible SDK, so migrating is mostly an import change. The vendor says it supports React Native 0.76+ on both architectures. Third-party roundups say there is no free tier. |
| **hot-updater**  | `hot-updater` and `@hot-updater/react-native` 1.1.8 (2026-11-05) | Self-hosted, MIT. Plugins for S3, Cloudflare R2 with D1, Supabase and Firebase  | No per-user fees. Documents automatic rollback to the last stable bundle after a crash.                                                                                                   |
| **expo-updates** | `expo-updates` 58.0.21 (2026-11-03)                              | EAS Update (hosted, paid), or any server implementing the Expo Updates protocol | A bare React Native app must install Expo modules first. Best if the app already uses Expo modules or EAS.                                                                                |

## Decision

Do not wire OTA into the foundation. Wiring it without a host and release channels would ship dead code and a
dependency nobody uses. When an app needs OTA:

- Choose **hot-updater** when the client wants to own the infrastructure and avoid per-user pricing.
- Choose **Revopush** when the client wants a hosted service with the least operational work, or is migrating from
  CodePush.
- Choose **expo-updates** when the app already uses Expo modules or EAS.

## Consequences

Whichever option is chosen:

- An OTA update can change only JS and assets. A native change, which includes adding or removing an optional unit
  with native code, needs a store release. Updates must target the binary's runtime version.
- Store rules still apply. An update must not change the app's primary purpose.
- Sentry needs source maps uploaded per OTA bundle, or crash stack traces stay minified.
- **Not verified:** none of these options has been installed or tested in this repo. Vendor claims and prices
  must be checked again at adoption.

## Alternatives

- **Wire hot-updater now.** It would be the default if the template had to pick one. Without a backend to point
  at, it could not be tested, and every app would carry it.
- **CodePush.** Retired.
