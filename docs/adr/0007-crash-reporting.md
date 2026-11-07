# 0007. Sentry behind a monitoring interface, off without DSN

- Status: Accepted
- Date: 2026-11-07

## Context

Production apps need crash reporting, but the template has no Sentry project. Code that reports errors should not
depend on one vendor.

## Decision

- `shared/lib/monitoring` exposes `reportError` and `setErrorReporter`. Everything reports through it. With no
  reporter set, reporting does nothing.
- `app/monitoring/sentry.ts` is the only file that imports Sentry, which lint enforces. It initialises only when
  `SENTRY_DSN` is set, with `sendDefaultPii: false`, and then registers itself as the reporter.
- It is the optional unit `sentry`: `--remove sentry` deletes the folder, the call in `index.js` and the package.

## Consequences

- Without a DSN nothing leaves the device, so the template is safe to run as it is.
- Swapping vendors means changing one file.
- Source maps are not uploaded. Sentry's Gradle plugin and Xcode build phase fail without an auth token, so they
  are left out. [release.md](../release.md) describes adding the upload to the release job.
- **Not verified:** delivery to a real Sentry project has not been tested, because the template has no DSN.

## Alternatives

- **Firebase Crashlytics.** Needs `google-services.json` and `GoogleService-Info.plist` per app, which a public
  template cannot ship, and pulls in Firebase.
- **Bugsnag or others.** Viable. The interface keeps that a one-file change.
- **No crash reporting in the template.** Every app would add it, inconsistently.
