# 0014. Device integrity, screen protection and certificate pinning as optional units

- Status: Accepted
- Date: 2026-11-16

## Context

Fintech and health clients are asked for three things in a security review: a root or jailbreak check, protection
against screenshots, and certificate pinning. A logistics client needs none of them. Each one also has a way of
hurting real users when it is wrong, so none can be on by default.

## Decision

Three optional units, each off until an env value turns it on, each behind one owner folder that lint enforces.

- **`device-integrity`** uses `jail-monkey` 3 (a TurboModule). `DEVICE_INTEGRITY` is `off`, `warn` or `block`.
  `warn` shows a dialog once per install; `block` shows a screen with no way through. Only root, jailbreak and
  hooking frameworks count. Mock location and developer options are ignored, because testers have them on.
- **`screen-protection`** uses `react-native-capture-protection` 2 (a TurboModule). `protectScreen()` and
  `useScreenProtection()` are counted, so nested protected screens do not undo each other. The login screen uses
  it. `SCREEN_PROTECTION=on` enables it; it is off in development so screenshots still work for bug reports.
- **`cert-pinning`** uses `react-native-ssl-public-key-pinning` 1 (a TurboModule; OkHttp `CertificatePinner` on
  Android, TrustKit on iOS). `API_PIN_HASHES` lists public key hashes for the API host. Every API request awaits
  the setup. Fewer than two pins is a startup error.

## Consequences

- **A root check is a speed bump, not a control.** It runs on the device an attacker owns and can be patched out.
  It satisfies an audit line and stops casual cases. The real control is server-side attestation (Play Integrity,
  App Attest), which needs a backend and is not built here.
- **A check that cannot run lets the user in.** A crash in the native check is reported, not treated as "rooted".
- **iOS cannot refuse a screenshot.** The library makes the capture come out blank and covers the app while it is
  recorded or in the app switcher. Android sets `FLAG_SECURE`, which the system enforces.
- **Pinning can lock every user out.** If the server's key changes and no shipped pin matches, the app cannot
  reach its API until a new build is installed. That is why two pins are required, and why the version gate
  (ADR 0015) reads its document from a different host. Pin an intermediate or a backup key, not only the leaf.
- **Pinning covers the API host only.** Images loaded natively, a `WebView` and the app config document use
  their own connections and are not pinned.
- **A failed pinning setup leaves requests unpinned** and is reported. The alternative is an app that cannot
  start.

## Alternatives

- **freeRASP or a commercial RASP SDK.** Broader checks, but a closed binary with its own telemetry and terms.
  A client that needs it can swap it in behind `features/device-integrity`.
- **Native code written here for `FLAG_SECURE` and the iOS cover.** Small, but per-screen control needs a native
  module, and the library already is one.
- **Pinning in native config** (Android network security config, `Info.plist`). No library, but the pins live in
  two files per platform and cannot be read from the env.

## Verification

See the README's known limitations for what was and was not seen on a device.
