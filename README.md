# RN Foundation

A React Native 0.88 base for production apps: New Architecture, Hermes, TypeScript, strict layering enforced by
lint, and a full auth and session lifecycle. It includes a removable reference feature (products and favourites)
that shows the pattern for new features.

- [ARCHITECTURE.md](ARCHITECTURE.md): layers, data flow, storage, session lifecycle, with diagrams
- [docs/adr/](docs/adr/): why the major choices were made
- [docs/release.md](docs/release.md): release signing and the pre-release checklist
- [CLAUDE.md](CLAUDE.md): the rules in short form, for AI assistants and reviewers

## What's included

| Area       | Choice                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------- |
| Structure  | Trimmed Feature-Sliced Design: `app → screens → features → entities → shared`                 |
| State      | Redux Toolkit, RTK Query, zod-validated responses                                             |
| Storage    | MMKV through typed keys (`defineKey`); Keychain/Keystore for secrets. No AsyncStorage         |
| Auth       | Login, Remember Me, single-flight token refresh, a logout wipe tested end to end              |
| Navigation | React Navigation 7, static API, auth-gated groups, deep links per environment                 |
| UI         | Theme tokens with light and dark modes, Open Sans, Lucide icons, a component kit              |
| i18n       | i18next, English, strings owned by each slice                                                 |
| Quality    | ESLint with boundary rules and fixtures, Jest and RNTL, a Maestro smoke flow, 70% coverage    |
| CI         | GitHub Actions: verify, Android build, iOS build, and a generated app with every unit removed |

Optional units, each removable with one command: `products`, `biometric-unlock`, `splash-animation`, `media`
(picker, upload, download), `sentry`, `socket`, `date-time`, `phone-input`, `carousel`, `range-slider`,
`image-viewer`.

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

Dev, staging and prod have separate bundle IDs and deep-link schemes (`rn-foundation-dev://`,
`rn-foundation-staging://`, `rn-foundation://`), so all three install side by side. Their values live in
`.env.development`, `.env.staging` and `.env.production`. Those are public build-time values: never put a secret
in them, because they end up in the JS bundle.

The template talks to [dummyjson](https://dummyjson.com). Sign in with `emilys` / `emilyspass`.

## Checks

| Command                            | What it does                                          |
| ---------------------------------- | ----------------------------------------------------- |
| `yarn lint`                        | ESLint, then the boundary fixtures                    |
| `yarn typecheck`                   | TypeScript                                            |
| `yarn test`                        | Jest                                                  |
| `yarn format:check`                | Prettier                                              |
| `maestro test .maestro/smoke.yaml` | The on-device smoke flow, against a running dev build |

The pre-commit hook lints and formats staged files, checks the boundaries and runs related tests. Commit messages
follow [Conventional Commits](https://www.conventionalcommits.org/).

## Starting a new app

From a fresh copy of this repo:

```sh
node scripts/create-app.js --name Acme --bundle-id com.acme.app --display-name "Acme"
```

This sets the app name, bundle IDs and URL schemes across Android and iOS. To also drop optional units, add
`--remove socket,media` or `--remove all`. [`units.json`](units.json) lists them. A unit that another unit uses
can only go together with it: `carousel` and `image-viewer` are used by `products`. Then follow the steps the
script prints.

## Adding a feature

Use the products unit as the worked example: `src/entities/product`, `src/features/toggle-favorite`, and the
screens `product-list`, `product-details` and `favorites`.

1. **Decide the layer.**
   - A business object, with its schema, endpoints and display component, is an **entity**.
   - One thing the user does, such as favouriting or logging in, is a **feature**.
   - A whole screen is a **screen**.
   - Anything without business knowledge goes in **shared**.
2. **Create the slice** with only the folders it needs (`model/`, `ui/`, `api/`, `lib/`, `i18n/`) and an
   `index.ts` that exports its public API.
3. **Server data:** inject endpoints into `baseApi` from `@shared/api`, and give every endpoint a zod
   `responseSchema`.
4. **Persisted client data:** define a key with `defineKey` and choose its kind (`cache` or `user`) and scope
   (`device` or `account`). Write it from a listener middleware, and export a `load` function. In `app/store`,
   add the reducer, the middleware and the `load` call to `loadPersistedState`.
5. **Strings:** put them in the slice's `i18n/en.ts`, export them, and register the namespace in `app/i18n`.
6. **Screens:** add the route in `app/navigation/RootNavigator.tsx`. For a deep link, set `linking` on the screen.
   Navigate with `useNavigation()`; params are typed globally, so there is nothing to import from `app`.
7. **Never import sideways.** If a feature needs another feature, compose them in the screen. Entities and
   features never navigate; they take callbacks.
8. **Tests:** co-locate unit tests with the code. For a flow, add an integration test that renders `<App />` with
   a faked `fetch` (see `src/app/products.test.tsx`).
9. **To make it removable:** add it to `units.json` and tag its lines in each touchpoint with `@unit:<name>`, or
   `@unit-start:<name>` and `@unit-end:<name>` for blocks.

`yarn lint` reports any layer violation with the rule that was broken.

## Removing the reference feature

```sh
node scripts/create-app.js --name Acme --bundle-id com.acme.app --display-name "Acme" --remove products
```

This leaves the minimal Home screen, which is the place to start the app's own home.

## Known limitations

- **Biometric unlock is not verified on a device.** The logic is covered by tests, but the iOS simulator did not
  show the prompt, so enforcement has not been seen on real hardware. It is a policy gate rather than encryption
  of the token; see [ADR 0008](docs/adr/0008-biometric-unlock-gate.md).
- **Sentry delivery is untested,** because the template has no DSN. Source maps are not uploaded
  ([ADR 0007](docs/adr/0007-crash-reporting.md)).
- **iOS release signing is untested.** It needs an Apple Developer team ([docs/release.md](docs/release.md)).
- **No OTA updates.** The options are compared in [ADR 0006](docs/adr/0006-ota-updates.md).
- **Hermes has no `Intl.DisplayNames`,** so the phone input uses a bundled English country-name table. Other
  languages need their own table.
- **Removing the `media` unit leaves its iOS privacy-manifest entries,** which its pods added during `pod install`.
  They are harmless, and can be deleted from `ios/RNFoundation/PrivacyInfo.xcprivacy` by hand.
- **English only.** Layouts use start and end styles so RTL is cheap to add, but no RTL QA has been done.
- **The splash screen has no dark variant.** The free bootsplash generator does not make one.
- **The Maestro smoke flow runs locally,** not in CI.
- **Offline is read-only.** Lists show a retry state with no connection, and favourites work offline. There is no
  queue for offline writes, because conflict handling is specific to each domain.

## Good to know

- `ios/build` holds generated codegen as well as build output. If you delete it, run `pod install` again.
- The Sentry iOS SDK is downloaded into `~/Library/Caches/sentry-react-native` during `pod install`. If you clear
  that folder, the iOS build fails with `'Sentry/Sentry.h' file not found` until you run `pod install` again.
- If your machine has a different r27 NDK, pass `-PndkVersion=<version>` to Gradle.
- Crash reporting uses Sentry and starts only when `SENTRY_DSN` is set in the `.env.*` file. Without it, nothing is
  sent.
- To change the launch screen, replace `src/shared/assets/brand/logo.svg` and run
  `yarn react-native-bootsplash generate src/shared/assets/brand/logo.svg --platforms=android,ios --background=F6F7F9 --logo-width=100 --assets-output=src/shared/assets/bootsplash --plist=ios/RNFoundation/Info.plist`.
- If Metro serves old code after a branch switch, reset its watcher: `watchman watch-del-all`, then
  `yarn start --reset-cache`.
