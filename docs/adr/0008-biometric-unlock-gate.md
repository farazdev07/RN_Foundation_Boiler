# 0008. Biometric unlock as a separate Keychain gate

- Status: Accepted
- Date: 2026-11-07

## Context

Optional biometric unlock must protect a remembered session, fall back to the login screen when biometrics
change or fail, and never crash. The obvious design would store the refresh token itself behind biometric access
control. But the token rotates on every refresh, and on Android a write or read of a biometric-protected Keystore
entry asks for authentication. The user would be prompted at unpredictable moments, not just at launch.

## Decision

- The refresh token stays in its normal Keychain entry.
- Enabling biometric unlock writes a separate entry, `biometric.gate`, with `BIOMETRY_CURRENT_SET` access
  control. Enabling then reads it back once, which proves the prompt works.
- At launch, `restoreSession` reads the gate before resuming the session. A cancelled prompt, a failed match or an
  invalidated gate ends the session as a full logout, which wipes the same things an explicit logout does.
- The on/off setting is account scope, and the gate is removed through `onSessionEnd`. So logout always turns
  biometric unlock off, and it never restores a session after an explicit logout.
- It can be turned on only for a remembered session.
- **Re-lock (added 2026-11-16).** While the feature is on, `BiometricLock` covers the app as it goes to the
  background, so the app switcher shows the cover. On return, an absence shorter than `RELOCK_AFTER_MS` (60 s)
  lifts the cover; a longer one asks for biometrics. A failed or cancelled check keeps the app covered with
  "Unlock" and "Log out"; it does not end the session, because a mis-read finger is not a reason to wipe data.

## Consequences

- One prompt at launch, and none during token refresh.
- `BIOMETRY_CURRENT_SET` invalidates the gate when the enrolled biometrics change. The next launch then falls back
  to login, which is the required behaviour.
- **The trade-off:** the gate is policy, not encryption of the token. It stops someone who picks up an unlocked
  phone and opens the app. It does not stop an attacker who can read the app's Keychain entries on a compromised
  device, because the token itself is not biometric-bound. For apps that need that, bind the token itself and
  accept the extra prompts.
- The cover is a view above the navigator. It does not cover an open RN `Modal`, which is its own native window.
  Whether iOS takes its app-switcher snapshot before or after the cover renders has not been checked.
- **Not verified on a device:** the logic is covered by Jest tests. The iOS simulator did not show the prompt,
  even after un-enrolment, so enforcement has not been seen on real hardware.

## Alternatives

- **Biometric-protected refresh token.** Stronger, but it prompts on rotation on Android.
- **A local PIN.** More UI and more to get wrong, and it adds nothing over device biometrics for this purpose.
