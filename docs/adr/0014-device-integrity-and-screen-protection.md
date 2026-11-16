# 0014. Device integrity and screen protection as optional units

- Status: Accepted
- Date: 2026-11-16

## Context

Fintech and health clients are asked in a security review for a root or jailbreak check and for protection
against screenshots. A logistics client needs none of them. Each one also has a way of
hurting real users when it is wrong, so none can be on by default.

## Decision

Two optional units, each off until an env value turns it on, each behind one owner folder that lint enforces.

- **`device-integrity`** uses `jail-monkey` 3 (a TurboModule). `DEVICE_INTEGRITY` is `off`, `warn` or `block`.
  `warn` shows a dialog once per install; `block` shows a screen with no way through. Only root, jailbreak and
  hooking frameworks count. Mock location and developer options are ignored, because testers have them on.
- **`screen-protection`** uses `react-native-capture-protection` 2 (a TurboModule). `protectScreen()` and
  `useScreenProtection()` are counted, so nested protected screens do not undo each other. The login screen uses
  it. `SCREEN_PROTECTION=on` enables it; it is off in development so screenshots still work for bug reports.

## Consequences

- **A root check is a speed bump, not a control.** It runs on the device an attacker owns and can be patched out.
  It satisfies an audit line and stops casual cases. The real control is server-side attestation (Play Integrity,
  App Attest), which needs a backend and is not built here.
- **A check that cannot run lets the user in.** A crash in the native check is reported, not treated as "rooted".
- **iOS cannot refuse a screenshot.** The library makes the capture come out blank and covers the app while it is
  recorded or in the app switcher. Android sets `FLAG_SECURE`, which the system enforces.

## Alternatives

- **freeRASP or a commercial RASP SDK.** Broader checks, but a closed binary with its own telemetry and terms.
  A client that needs it can swap it in behind `features/device-integrity`.
- **Native code written here for `FLAG_SECURE` and the iOS cover.** Small, but per-screen control needs a native
  module, and the library already is one.
- **Certificate pinning.** Built and then removed on 2026-11-16: the owner judged it more weight than a starter
  should carry. It also has a real cost, since a pin that no longer matches the server locks every user out until
  a new build ships. A client that needs it can add `react-native-ssl-public-key-pinning` behind `shared/api`
  and await its setup in the base query.

## Verification

See the README's known limitations for what was and was not seen on a device.
