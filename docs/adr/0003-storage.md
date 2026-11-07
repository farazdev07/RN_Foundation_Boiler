# 0003. MMKV for data, Keychain for secrets

- Status: Accepted
- Date: 2026-11-04

## Context

AsyncStorage is asynchronous and unencrypted. RN_Arch kept tokens and the user profile in it, and parsed stored
data without checking its shape.

## Decision

- **No AsyncStorage anywhere**, including through a library. Lint bans the import, and `tools/check-repo.js`
  fails CI if it appears in the lockfile.
- **MMKV** for all non-secret data, only through `defineKey` in `shared/storage/kv`. Each key declares:
  - a zod schema;
  - a version;
  - a **kind**: `cache`, where a version change is a miss, or `user`, where a version change runs `migrate`, or
    leaves the value on disk for a later fix;
  - a **scope**: `device`, which survives logout, or `account`, which is wiped on logout.

  Unreadable data is a miss, never a crash. Each scope is its own MMKV instance, so logout is one `clearAll`.

- **Keychain/Keystore** for secrets, only through `shared/storage/secure`, with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
  A read or decrypt failure counts as signed out.
- Access tokens stay in memory. The refresh token is persisted only with Remember Me.
- `android:allowBackup="false"`, checked in CI, so a restored backup cannot pair MMKV data with Keystore keys that
  no longer exist.
- An install marker in MMKV detects a fresh install. On iOS, the Keychain outlives the app, so a token found
  without the marker is cleared.

## Consequences

- Reads are synchronous, which is what makes sync hydration possible ([0002](0002-state-and-persistence.md)).
- An account-scope key cannot survive logout, because the wipe does not depend on a list of keys.
- User data is never silently thrown away by a schema change.

## Alternatives

- **Encrypting MMKV.** Secrets are already in the Keychain, so encryption would add key management with nothing to
  protect.
- **The user profile in the Keychain** (RN_Arch). It isn't a secret, and the Keychain is slow.
- **Hand-written type guards.** They drift from the types; a zod schema is the type.
