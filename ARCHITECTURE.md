# Architecture

How RN Foundation is put together, and why. The reasons behind the larger choices are in
[docs/adr/](docs/adr/). The rules here are enforced by lint and tests, so this document describes what the code
already does.

## Layers

The code under `src/` is a trimmed [Feature-Sliced Design](https://feature-sliced.design/). Five layers, each
importing only from the layers below it:

```mermaid
flowchart TD
  app["app<br/><small>store, navigation, providers, app services</small>"]
  screens["screens<br/><small>one slice per screen; composes and navigates</small>"]
  features["features<br/><small>one user action each: log in, toggle a favourite</small>"]
  entities["entities<br/><small>business objects: session, user, product</small>"]
  shared["shared<br/><small>no business knowledge: api, storage, ui, lib, config</small>"]
  app --> screens --> features --> entities --> shared
  app --> features
  app --> entities
  app --> shared
  screens --> entities
  screens --> shared
  features --> shared
```

| Layer      | Holds                                                                                                     | May import                 |
| ---------- | --------------------------------------------------------------------------------------------------------- | -------------------------- |
| `app`      | Store setup, the root navigator, providers, app-lifetime services (session restore, realtime), i18n setup | everything below           |
| `screens`  | One slice per screen. Composes features and entities, owns navigation for that screen                     | features, entities, shared |
| `features` | One user-facing action, with its UI, state and API calls                                                  | entities, shared           |
| `entities` | A business object: its schema, API endpoints, model logic and a display component                         | shared                     |
| `shared`   | Everything without business knowledge: HTTP, storage, UI kit, helpers, env config                         | shared                     |

Three rules hold across all layers:

1. **Downward only.** A layer never imports a layer above it.
2. **No sideways imports.** Two slices on the same layer never import each other: no feature imports a feature,
   no entity imports an entity. When two need each other, the layer above composes them. The products feature
   shows this: `ProductCard` (entity) takes an `action` slot, and the screen passes in `FavoriteButton` (feature).
3. **Public API only.** Code outside a slice imports it through its `index.ts`, never a file inside it.

`eslint-plugin-boundaries` enforces all three. Lint also fails on user-facing text written into a component
instead of i18n, and on one shared UI component importing an optional UI unit. `tools/boundary-fixtures/` holds a deliberately violating file for
each rule, and `tools/check-boundaries.js` asserts that lint reports exactly the expected rule on each one, so a
plugin upgrade that quietly weakens a rule fails CI. Lint runs in the pre-commit hook and in CI.

Lint also limits where some packages may be imported, so each one has a single owner:

| Package                            | Only in                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `react-native-mmkv`                | `shared/storage/kv`                                                        |
| `react-native-keychain`            | `shared/storage/secure`                                                    |
| `@react-native-community/netinfo`  | `shared/lib/network`                                                       |
| `@sentry/react-native`             | `app/monitoring`                                                           |
| `socket.io-client`                 | `shared/api/socket`                                                        |
| `react-native-image-crop-picker`   | `shared/lib/media-picker`                                                  |
| `react-native-blob-util`           | `features/file-transfer`                                                   |
| `react-hook-form`, `@hookform/*`   | `shared/lib/form`                                                          |
| `@shopify/flash-list`              | `shared/ui/List`                                                           |
| `react-native-turbo-image`         | `shared/ui/Image`                                                          |
| `react-native-webview`             | `shared/ui/WebView`                                                        |
| `@lodev09/react-native-true-sheet` | `shared/ui/BottomSheet`                                                    |
| `@react-navigation/*`              | not in `features` or `entities`                                            |
| AsyncStorage                       | nowhere; `tools/check-repo.js` also fails CI if it appears in the lockfile |

Entities and features never navigate. They take callbacks, and the screen decides where to go. Route params are
typed through React Navigation's global `RootParamList`, so a screen gets typed navigation without importing
`app`.

## Anatomy of a slice

```text
src/features/toggle-favorite/
├── index.ts              the public API; nothing else is importable from outside
├── model/                state, selectors, hooks, persistence (with tests next to them)
├── ui/                   components
├── api/                  RTK Query endpoints, injected into the shared baseApi
├── lib/                  pure helpers
└── i18n/                 en.ts, optional ar.ts, and an index that pairs them; registered by app/i18n
```

`yarn new <feature|entity|screen> <name>` creates this shape. A slice has only the folders it needs. Each slice owns its strings, and `app/i18n` registers them, so deleting a
slice deletes its strings too.

## Data flow

The products unit is the reference for how a feature moves data. Server data and client data take different
paths.

```mermaid
flowchart LR
  subgraph server["Server data (online-first)"]
    API["dummyjson"] -->|fetch| BQ["shared/api baseQuery<br/><small>timeout, auth header,<br/>single-flight refresh, AppError</small>"]
    BQ --> RTKQ["RTK Query cache<br/><small>endpoints injected by<br/>entities/product</small>"]
    RTKQ -->|"responseSchema (zod)"| Hook["useGetProductsInfiniteQuery"]
  end
  subgraph client["Client data (persisted)"]
    Slice["favoritesSlice"] -->|listener middleware| KV["shared/storage kv<br/><small>MMKV, account scope</small>"]
    KV -->|"sync read at store creation"| Pre["preloadedState"]
    Pre --> Slice
  end
  Hook --> Screen["screens/product-list"]
  Slice --> Screen
  Screen -->|tap heart| Slice
```

- **Server data** lives in RTK Query. Entities inject their endpoints into `shared/api`'s `baseApi`, so `shared`
  never learns a business name. Every endpoint validates its response with a zod `responseSchema`; a mismatch
  becomes an `AppError` of kind `parse` rather than bad data in the UI.
- **Client data that must survive a restart** lives in a Redux slice. A listener middleware writes it to MMKV
  after each change. When the store is created, `app/store` reads it back synchronously into `preloadedState`, so
  the first frame already has it. There is no rehydration step and no loading gate. This replaces redux-persist
  ([ADR 0002](docs/adr/0002-state-and-persistence.md)).
- **Offline:** the app is online-first. The product list shows a retry state with no connection. Favourites keep
  the product summary, not just the ID, so the Favourites tab and a favourite's details screen work fully offline.
  A shared banner shows connection status.

### Errors

The base query turns every failure into one `AppError` union: `network`, `timeout`, `http`, `parse` or `unknown`.
`getErrorMessage` turns that into user-facing text. Each route has its own `ErrorBoundary`, so one broken screen
leaves the rest of the app usable. Unexpected errors go to `reportError` in `shared/lib/monitoring`, which forwards
to Sentry only when a DSN is configured ([ADR 0007](docs/adr/0007-crash-reporting.md)).

## Storage

```mermaid
flowchart TD
  subgraph mmkv["MMKV via defineKey (typed, zod-validated)"]
    device["device scope<br/><small>theme, language, remembered username,<br/>install marker</small>"]
    account["account scope<br/><small>favourites, biometric setting</small>"]
  end
  subgraph keychain["Keychain / Keystore (THIS_DEVICE_ONLY)"]
    token["refresh token<br/><small>only with Remember Me</small>"]
    gate["biometric gate<br/><small>optional unit</small>"]
  end
```

Every MMKV value goes through `defineKey`, which declares a zod schema, a version, a **kind** and a **scope**:

| Kind    | Meaning             | Version change                                              |
| ------- | ------------------- | ----------------------------------------------------------- |
| `cache` | Disposable          | A miss; the value is deleted                                |
| `user`  | The user's own data | Runs `migrate`, or leaves the value on disk for a later fix |

| Scope     | Lives in            | Logout                    |
| --------- | ------------------- | ------------------------- |
| `device`  | the `device` store  | Survives                  |
| `account` | the `account` store | Wiped with one `clearAll` |

Unreadable or wrongly shaped data is a cache miss, never a crash. Secrets go to the Keychain only. Access tokens
stay in memory. With Remember Me on, the refresh token is persisted to the Keychain; with it off, nothing is
persisted and the session ends with the process.

`android:allowBackup` is `false` (checked in CI), so a restored backup can never pair MMKV data with Keystore keys
that no longer exist. On iOS the Keychain survives an uninstall, so an install marker in MMKV detects a fresh
install and clears any token left behind.

## Session lifecycle

```mermaid
stateDiagram-v2
  [*] --> unknown: launch
  unknown --> signedOut: no saved token (wipes account data)
  unknown --> signedOut: biometric unlock fails (full logout)
  unknown --> signedIn: saved token found
  signedOut --> signedIn: login
  signedIn --> signedOut: logout
  signedIn --> signedOut: refresh rejected by server (sessionExpired)
```

- While the status is `unknown`, the native splash stays up and the navigator renders nothing, so the wrong screen
  never flashes.
- Navigation swaps the whole screen set by status (conditional groups), so after logout there is no signed-in
  screen in the history to go back to.
- **Every way out of a session wipes the same things:** the Redux state (the root reducer resets every slice,
  including ones added later), the RTK Query cache and its running queries, account-scope MMKV, the Keychain
  tokens, and anything a slice registered with `onSessionEnd` (the biometric gate, for example). Wipes are
  serialised, and sign-in waits for any wipe still running. `App.test.tsx` checks that nothing from one account
  reaches the next.
- **Token refresh** is single-flight: concurrent 401s share one refresh call. Only a server rejection (`4xx`) ends
  the session. A network failure or `5xx` leaves it intact for the next attempt.

## Boot sequence

```mermaid
sequenceDiagram
  participant N as Native splash
  participant S as Store
  participant R as restoreSession
  participant Nav as Navigator
  Note over S: index.js imports the app.<br/>The store is created with MMKV state<br/>(theme, favourites) read synchronously.
  N->>N: held by react-native-bootsplash
  R->>R: install marker check, read Keychain
  R->>S: sessionChecked(signedIn)
  S->>Nav: status known, render the right group
  Nav->>N: onReady, hide (optional 220 ms fade)
```

## Forms, lists and images

- **Forms** use react-hook-form with a zod schema through `useZodForm` (`shared/lib/form`) and the `Form*` fields
  in `shared/ui`. The schema is both the validation and the type the submit handler receives. `LoginForm` is the
  reference.
- **Screen lists** use `List`, a wrapper over FlashList, fed by `useInfiniteQueryList`
  ([ADR 0012](docs/adr/0012-flashlist-for-screen-lists.md)). Rows are memoised and recycled.
- **Remote images** go through `shared/ui/Image`, which caches them
  ([ADR 0011](docs/adr/0011-image-caching.md)).

## Languages and layout

- Each slice exports `{ en, ar? }`. `app/i18n` collects them into one object, passes it to `initI18n`, and
  declares its English shape as i18next's resource type, so every `t()` key is checked by TypeScript.
- English is the fallback. Arabic is typed as `typeof` the English strings, so a missing key fails typecheck.
- The language is a device-scope key. `setLanguage` changes text and direction at once.
- **Direction is a style, not a restart.** `useDirection()` gives the current language's direction. The app root,
  `Modal` and `BottomSheet` (each its own native root) set it as their `direction` style, and the navigator takes
  it as its `direction` prop. `I18nManager.forceRTL` is still called, only so native views match on the next
  launch. Read `useDirection()`, never `I18nManager.isRTL`, which keeps its startup value. A new native root (a
  raw RN `Modal`) must set the style itself.
- A language change remounts the navigator with its current state, because the static navigator config reads tab
  and header titles once per mount.
- **Breakpoints** are window-width classes in the theme: `compact`, `medium` (600 pt) and `expanded` (840 pt).
  `useBreakpoint` and `useResponsiveValue` read them. `Screen` caps content at `layout.maxContentWidth`.

## Optional units

Several parts of the foundation are optional: `products`, `biometric-unlock`, `splash-animation`, `media`,
`sentry`, `socket`, `date-time`, `phone-input`, `carousel`, `range-slider`, `image-viewer`, `otp-input`,
`webview`, `bottom-sheet`, `onboarding`, `version-gate`, `device-integrity`, `screen-protection` and
`cert-pinning`.
[`units.json`](units.json) declares each unit's folders, packages and **touchpoints** (files outside its folders
that mention it), plus the units it `uses`. In touchpoints, the lines belonging to a unit are tagged:

```ts
import { FavoritesScreen } from '@screens/favorites'; // @unit:products

// @unit-start:products
Products: { screen: ProductListScreen },
// @unit-end:products
```

`scripts/create-app.js --remove <units>` deletes the folders, the tagged lines and the packages. It refuses a
touchpoint that has lost its marker, a tag on the last line of a wrapped statement, and the removal of a unit that
a kept unit `uses`. CI generates an app with every unit removed and builds it, so a missing tag fails CI
([ADR 0009](docs/adr/0009-optional-units.md)).

## Testing

| Level              | Tool                            | What it covers                                                                                                                                                                |
| ------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit and component | Jest, RNTL 14                   | Pure logic, slices and component behaviour. Theme switching is tested in `ThemeProvider` and `Text`; most components are tested in light mode only. Co-located `*.test.ts(x)` |
| Integration        | Jest, the whole `<App />`       | Only the network is faked. Auth, Remember Me, logout wipe, deep links, products                                                                                               |
| Architecture       | Lint fixtures                   | Each layer rule, each package owner, the hard-coded-text rules and UI unit isolation, by exact rule ID                                                                        |
| Repo hygiene       | `tools/check-repo.js`           | No AsyncStorage, `allowBackup` off, no signing material or env file tracked                                                                                                   |
| Generated app      | CI `create-app` jobs            | An app with every unit removed typechecks, passes its tests and builds for Android and iOS                                                                                    |
| Device             | Maestro (`.maestro/smoke.yaml`) | Login, products, favourites across a relaunch, gestures, deep links, logout. Run locally                                                                                      |

Coverage must stay at 70% or above for lines, branches, functions and statements.
