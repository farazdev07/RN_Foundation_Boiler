# RN Foundation

A React Native 0.88 (New Architecture, TypeScript) base for production apps. The full guide arrives with the
reference feature; this covers what you need to build and start from it today.

## Prerequisites

| Tool        | Version                                   |
| ----------- | ----------------------------------------- |
| Node        | 22.11+                                    |
| Yarn        | 4, through corepack (`corepack enable`)   |
| Ruby        | 3.2, for Bundler and CocoaPods            |
| JDK         | 17                                        |
| Android SDK | Platform 37, Build-Tools 37.0.0, NDK 27.1 |
| Xcode       | 27                                        |

## Setup

```sh
corepack enable
yarn install          # also installs git hooks and creates local .env.* files
bundle install
cd ios && bundle exec pod install && cd ..
```

## Running

```sh
yarn start            # Metro, in one terminal
yarn android          # or android:staging, android:prod
yarn ios              # or ios:staging, ios:prod
```

Dev, staging and prod have separate bundle IDs, so all three install side by side. Their values live in
`.env.development`, `.env.staging` and `.env.production`. Those are public build-time values: never put a secret
in them, because they end up in the JS bundle.

## Checks

`yarn lint` (includes the boundary fixtures) · `yarn typecheck` · `yarn test` · `yarn format:check`

`maestro test .maestro/smoke.yaml` runs the on-device smoke flow against a running dev build.

## Starting a new app

From a fresh copy of this repo:

```sh
node scripts/create-app.js --name Acme --bundle-id com.acme.app --display-name "Acme"
```

This sets the app name and bundle IDs across Android and iOS. To also drop optional units, add
`--remove socket,media` or `--remove all`; `units.json` lists them. Then follow the steps the script prints.

## Good to know

- `ios/build` holds generated codegen as well as build output. If you delete it, run `pod install` again.
- If your machine has a different r27 NDK, pass `-PndkVersion=<version>` to Gradle.
- Releases are covered in [docs/release.md](docs/release.md).
