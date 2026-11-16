# 0015. Version gate from a static document, failing open

- Status: Accepted
- Date: 2026-11-16

## Context

Every shipped app eventually needs to force an old version to update, or to say "down for maintenance". Adding
that after launch does not reach the versions already installed.

## Decision

- An optional unit, `version-gate`, reads a public JSON document from `APP_CONFIG_URL`:

  ```json
  {
    "maintenance": { "active": false, "message": "Back at 09:00" },
    "ios": {
      "minVersion": "1.2.0",
      "latestVersion": "1.4.0",
      "storeUrl": "https://apps.apple.com/app/id0"
    },
    "android": {
      "minVersion": "1.2.0",
      "storeUrl": "https://play.google.com/store/apps/details?id=com.acme"
    }
  }
  ```

- Below `minVersion` the app is covered by an update screen. Below `latestVersion` an update is offered once per
  version. `maintenance.active` covers the app with a retry screen.
- It is checked at launch and when the app returns to the foreground, at most every five minutes.
- **It fails open.** No URL, no network, a non-200 or a malformed document all let the app through.
- **`package.json` holds the app version.** `tools/check-repo.js` fails CI if Android's `versionName` or iOS's
  `MARKETING_VERSION` differ from it.

## Consequences

- The document can be a file on a CDN or in a bucket; no backend endpoint is needed.
- Failing open means the gate cannot be relied on to block a version while the document's host is down. A config
  outage that locked every user out would be worse.
- The gate stops the app's UI, not its API. A version that must not talk to the server has to be refused by the
  server too.
- Bumping the version means three places. The repo check catches a missed one.

## Alternatives

- **An API endpoint behind the app's own client.** It would share the API's outages and, with pinning on, its
  certificate problems, which is exactly when a maintenance message is needed.
- **Reading the native version with `react-native-device-info`.** One more native dependency for one string.
- **The stores' in-app update APIs.** Android only for a forced flow, and no maintenance state.
