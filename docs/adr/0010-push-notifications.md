# 0010. Push notifications are out of scope, and how they would plug in

- Status: Accepted
- Date: 2026-11-15

## Context

Every client app so far has needed push notifications, and the foundation has none. RN_Arch carried only a
commented-out FCM and notifee block and an `fcmToken` field.

Push cannot be proven in this repo:

- Delivery needs a Firebase project (Android) and an APNs key (iOS). Their config files, `google-services.json`
  and `GoogleService-Info.plist`, belong to one app and cannot live in a public template. ADR 0007 rejected
  Crashlytics for the same reason.
- Foreground, background and quit-state delivery, and the tap that opens a screen, can only be checked on real
  devices.

The 2026-11 review asked for less unverified code, not more.

## Decision

Do not build push in the foundation. When an app needs it, add it as the optional unit `push`, shaped like crash
reporting ([0007](0007-crash-reporting.md)):

| Piece              | Where                                                                                                           | What it does                                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Interface          | `src/shared/lib/push/`                                                                                          | `setPushProvider`, `requestPushPermission`, `getPushToken`, `onPushOpened`. With no provider set, every call is a no-op, as `reportError` is |
| Adapter            | `src/app/push/` (the unit's folder)                                                                             | The only files that import the vendor SDK, enforced by an owner entry in `eslint.config.js`                                                  |
| Token registration | `src/features/register-push-token/`                                                                             | An RTK Query mutation that sends the token to the app's backend after sign-in                                                                |
| Session end        | the same feature                                                                                                | Registers a cleanup with `onSessionEnd` that unregisters the token, so a signed-out device stops receiving the last account's messages       |
| Opening a screen   | `src/app/services/AppServices.tsx`                                                                              | `onPushOpened` hands the payload's link to `navigationRef`, through the same linking config deep links use                                   |
| Touchpoints to tag | `index.js`, `AppServices.tsx`, `AndroidManifest.xml`, `Info.plist`, `android/app/build.gradle`, `jest.setup.ts` | Background handler registration, the effect above, permissions and entitlements, the Google services plugin, the mock                        |

Rules for that unit:

- The permission prompt is asked from a screen, at a moment the user understands, never at launch.
- A payload is untrusted input: validate it with zod before acting on it, and never put personal data in it.
- The token is not a secret, but it identifies a device. Send it only to the app's backend.

## Consequences

- An app that needs push does about two days of work, most of it console setup and device testing.
- The seams it needs already exist: `onSessionEnd`, `navigationRef`, the linking config and the unit system.
- **Not verified:** nothing in this record has been built or run. Library names are left out on purpose; on
  2026-11-13 `@react-native-firebase/messaging` was at 27.1.1 and `@notifee/react-native` had not published since
  2024-12, so the choice must be made, with a New Architecture check, when the unit is written.

## Alternatives

- **Build the interface now, without an adapter.** An interface with no implementation and no caller is the kind of
  unused code the review flagged.
- **Build the adapter now.** It could not be tested, and every generated app would need Firebase files to compile.
- **A hosted service such as OneSignal.** Viable per client. It would sit behind the same interface.
