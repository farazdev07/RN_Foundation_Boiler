# 0005. Release pipeline on GitHub Actions, Fastlane later

- Status: Accepted
- Date: 2026-11-07

## Context

The foundation needs release signing that never commits a keystore, certificate or password, because the repo is
public. Store deployment is out of scope for now, but where it will run should be decided. The candidates are
GitHub Actions, Codemagic, and Fastlane, which is a tool that runs inside a CI rather than a CI itself.

## Decision

- **Signing is set up now, through the environment.** Android's Gradle reads the keystore path and passwords from
  environment variables. Without them it produces an unsigned artifact, never a debug-signed one. iOS passes team,
  identity and profile to `xcodebuild archive` at build time. CI decodes them from secrets into temporary files.
  `tools/check-repo.js` fails CI if signing material or an env file is tracked. Details are in
  [release.md](../release.md).
- **CI stays on GitHub Actions.** It already runs verify, Android, iOS and generated-app jobs. Hosted macOS runners
  are free for public repositories, and the iOS job runs on them today.
- **Store deployment, when needed, is a tag-triggered GitHub Actions workflow that runs Fastlane lanes:** `supply`
  for Google Play, and `pilot` for TestFlight with an App Store Connect API key from secrets. Certificates and
  profiles come from secrets, or from a private `match` repository. They never go in this public repo.

## Consequences

- One CI system and one place for secrets.
- Private forks pay for macOS minutes, which GitHub bills at a multiple of Linux minutes. A client app on a private
  repo should check the cost of the iOS job and may run it only on PRs to `main`.
- Moving to Codemagic later is cheap. The build commands are the same Gradle and `xcodebuild` steps, and Fastlane
  lanes run there unchanged.
- **Not verified:** no iOS archive has been signed with this setup, because it needs an Apple Developer team.

## Alternatives

- **Codemagic.** A hosted mobile CI with managed code signing and store publishing. It suits a team without
  macOS or signing experience. Adding it here would mean a second CI system and a second place for secrets. Check
  its current pricing before choosing it for a client.
- **Fastlane for everything, including builds.** It adds a Ruby layer over commands CI already runs. It is used
  where it earns its place: store upload and certificate handling.
- **Manual uploads from a developer machine.** Not reproducible, and it puts signing material on laptops.
