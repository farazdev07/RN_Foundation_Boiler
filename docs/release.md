# Release signing

Keystores, certificates and passwords are never committed. They come from CI secrets, and `tools/check-repo.js`
fails the build if signing material is tracked. Store deployment is not wired up yet; the pipeline decision
(Fastlane and Codemagic vs GitHub Actions) is recorded in an ADR.

## Android

`android/app/build.gradle` reads these environment variables:

| Variable                    | Meaning                      |
| --------------------------- | ---------------------------- |
| `ANDROID_KEYSTORE_PATH`     | Path to the release keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password            |
| `ANDROID_KEY_ALIAS`         | Key alias                    |
| `ANDROID_KEY_PASSWORD`      | Key password                 |

Without `ANDROID_KEYSTORE_PATH`, a release build produces an unsigned artifact. It never falls back to the debug
keystore. In CI, decode the keystore from a base64 secret into a temporary file and point the variable at it.

```sh
cd android && ./gradlew bundleProdRelease
```

## iOS

Signing is passed to `xcodebuild` at archive time, so no team or profile is committed:

```sh
cd ios && xcodebuild archive \
  -workspace RNFoundation.xcworkspace -scheme RNFoundation-Prod -configuration Prod-Release \
  -archivePath build/RNFoundation.xcarchive \
  DEVELOPMENT_TEAM="$APPLE_TEAM_ID" CODE_SIGN_STYLE=Manual \
  CODE_SIGN_IDENTITY="Apple Distribution" PROVISIONING_PROFILE_SPECIFIER="$IOS_PROFILE_NAME"
```

CI imports the certificate and profile from secrets into a temporary keychain first.

**Not yet verified:** this needs an Apple Developer team, certificate and profile, so an iOS archive has not been
signed with it.

## Before a release

- `API_URL` is HTTPS in `.env.production`.
- `versionCode` / `versionName` and the iOS marketing version are bumped.
- iOS privacy usage strings exist for every permission the app uses.
- `minifyEnabled` is reviewed; it is off in the template.
