# RN Foundation: independent review

- Date: 2026-11-13
- Reviewed: `main` at `f9d24a8`, working tree clean
- Scope: Phase 1 only. No code was changed. This file is the only thing added.

## Verdict

The core is sound. The layer rules are enforced and proven by fixtures, the session lifecycle is careful, storage is
typed, and most tests check behaviour through the real app. I would start a client app from it.

It is not yet a team boilerplate. Three things stop it:

1. **A rule the docs call non-negotiable is broken in the shared kit.** About 25 user-facing English strings are
   hard-coded in 13 shared files, and nothing in lint catches it.
2. **The patterns a team needs in week one are missing:** a form pattern, a slice generator, breakpoints, a second
   locale, a release workflow, push notifications.
3. **Several doc claims are stronger than the code.** They are listed in section 1.

## What was run, and what was not

| Check                         | Result                                                                 |
| ----------------------------- | ---------------------------------------------------------------------- |
| `yarn lint`                   | Pass. ESLint reported nothing; boundary fixtures 56/56                 |
| `yarn typecheck`              | Pass, no output                                                        |
| `yarn format:check`           | **Not run**                                                            |
| `yarn test`                   | **Not run**                                                            |
| `create-app --remove all`     | **Not run**                                                            |
| Android, iOS builds, Maestro  | **Not run**                                                            |
| CI history on GitHub          | **Not checked.** `gh` is not installed on this machine                 |
| npm registry, 61 dependencies | Queried on 2026-11-13 for latest version, publish date and peer ranges |
| Library changelogs            | **Not read.** Section 3.9 relies on registry data only                 |

The brief asked for `format:check`, `test` and `create-app` in item 1, and then said to run only lint and typecheck
in this phase. I followed the stricter instruction. Those three run in Phase 3.

One environment note: the plain `yarn` on this machine is 1.22.22, and it refuses the repo. I ran the checks with
`corepack yarn`. A new developer who has not run `corepack enable` hits this error on their first command; the
README does say to run it.

All of `src/` was read in full, except tests. Tests were read as their case names, mocks and assertions, with the
full file opened where something looked weak.

---

## 1. Docs vs reality

Most claims hold. I checked the layer rules, package ownership table, storage kinds and scopes, the session wipe,
single-flight refresh, sync hydration, per-route error boundaries, Sentry gating, unsigned release fallback,
`allowBackup`, flavours and schemes, and the unit list against `units.json`. All match the code.

The mismatches:

| #   | Claim                                                                                         | Reality                                                                                                                                                                                                                                                                         |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | CLAUDE.md: "No hard-coded user-facing text"                                                   | Broken in 13 shared files. Full list in 2.1                                                                                                                                                                                                                                     |
| 2   | CLAUDE.md: "a violation shows up as a failing check, not a review comment"                    | True for layers and package ownership only. Strings, start/end styles, raw colours and exact pins have no check                                                                                                                                                                 |
| 3   | ADR 0003: "User data is never silently thrown away by a schema change"                        | `kv.ts:116-117` deletes any value that fails its schema at the current version, for `user` keys too. Tightening a schema without bumping the version deletes user data. Only the version-change path keeps it. The corrupt-data test (`kv.test.ts:47`) covers `cache` keys only |
| 4   | migration-map: "No shared component imports another optional component... Lint enforces this" | No such rule exists. `eslint.config.js` treats all of `src/shared/*` as one element and allows shared to shared. Only the CI `create-app` typecheck would catch it                                                                                                              |
| 5   | migration-map: `react-native-size-matters` dropped for "theme tokens + breakpoints instead"   | No breakpoints anywhere. `theme.ts` has spacing, radii, typography, elevations                                                                                                                                                                                                  |
| 6   | ARCHITECTURE testing table: "components in both themes"                                       | Four test files touch dark mode: `Text`, `ThemeProvider`, `RadioGroup`, `stackHeader`. The other 20 components are tested in light only                                                                                                                                         |
| 7   | ADR 0005: "CI decodes them from secrets into temporary files"                                 | No workflow does this. `ci.yml` is the only workflow and has no release job. See 3.7                                                                                                                                                                                            |
| 8   | CLAUDE.md: "Pin dependency versions exactly"                                                  | Four devDependencies use `^`. See 3.6                                                                                                                                                                                                                                           |
| 9   | ARCHITECTURE: token refresh, "Only a server rejection (4xx) ends the session"                 | Accurate, and that is the problem: `refreshTokens.ts:32` treats 408 and 429 as rejection, so a rate-limited refresh logs the user out and wipes their data                                                                                                                      |
| 10  | migration-map: `navigationRef` lives in `src/app/navigation/navigationRef.ts`                 | The file does not exist. It is declared in `RootNavigator.tsx:144`, and nothing uses it                                                                                                                                                                                         |
| 11  | migration-map: fonts in `src/shared/assets/fonts/`                                            | They are in `src/shared/assets/native/fonts/`                                                                                                                                                                                                                                   |
| 12  | migration-map: the user profile is held "in user-scoped storage"                              | It is only in the RTK Query cache                                                                                                                                                                                                                                               |
| 13  | `jest.config.js:26` excludes `src/screens/home/ui/RuntimeCheck.tsx` from coverage             | The file does not exist                                                                                                                                                                                                                                                         |
| 14  | `.gitignore` lists `.DS_Store`                                                                | The root `.DS_Store` is tracked                                                                                                                                                                                                                                                 |
| 15  | README: i18n "strings owned by each slice", RTL "cheap to add"                                | `initI18n` hard-wires `resources: { en: namespaces }` (`i18n.ts:37`). A second locale needs an API change in every slice and in `app/i18n`. See 3.4                                                                                                                             |
| 16  | ARCHITECTURE: generated app "builds for Android"                                              | Understated. CI also builds it for iOS (`create-app-ios`)                                                                                                                                                                                                                       |
| 17  | `yarn lint` described as the lint check                                                       | It runs `eslint src`. `scripts/`, `tools/`, `index.js`, `jest.setup.ts` and the config files are never linted                                                                                                                                                                   |

Unverified, not wrong: ADR 0005 says the iOS job "runs today" on hosted runners. `ci.yml` uses `runs-on: xcode-27`.
I could not confirm that label exists or that the job has run. Check the Actions tab.

---

## 2. Code quality

### 2.1 Hard-coded strings (breaks a CLAUDE.md rule)

| File                                                | Strings                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------- |
| `shared/api/errors.ts:42-52`                        | All four messages from `getErrorMessage`, shown on every failed request |
| `shared/ui/Select/Select.tsx:55,134,166`            | `Select`, `Search`, `Done`                                              |
| `shared/ui/TextInput/TextInput.tsx:109`             | `Hide password`, `Show password`                                        |
| `shared/ui/Modal/Modal.tsx:57`                      | `Close`                                                                 |
| `shared/ui/LoadingOverlay/LoadingOverlay.tsx:33`    | `Loading`                                                               |
| `shared/ui/ImageViewer/ImageViewer.tsx:40`          | `Close`                                                                 |
| `shared/ui/PhoneInput/PhoneInput.tsx:55-56`         | `Search country or code`, `Choose country`                              |
| `shared/ui/RangeSlider/RangeSlider.tsx:201,220,234` | `to`, `minimum`, `maximum`                                              |
| `shared/ui/Toast/ToastViewport.tsx:102`             | `Swipe up or tap to dismiss`                                            |
| `shared/ui/date-time/Calendar.tsx:76-78`            | `Previous month`, `Next month`, `marked`                                |
| `shared/ui/date-time/DateTimeField.tsx:65`          | `Done`                                                                  |
| `app/navigation/RootNavigator.tsx:49-55`            | The Home tab has no `title`, so it shows the route name `Home`          |
| `shared/ui/Carousel/Carousel.tsx:158`               | `1 / 3` as a screen-reader label, with no words                         |

Some are prop defaults, so a caller can override them. The default is still what ships. `ConfirmDialog` and
`ErrorBoundary` already do it right with `useTranslation()` and the `common` namespace.

### 2.2 Things a senior reviewer would reject

| #   | Where                                                                       | Finding                                                                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `screens/product-list/ui/ProductListScreen.tsx:37-134`                      | Re-renders. Search text is screen state, so each keystroke re-renders the list with a new `renderItem`, `onEndReached`, `refreshControl` and footer. `ProductCard` is not memoised and gets a new `action` element each time. This is the reference screen the team will copy |
| 2   | `useLogin.ts:40`, `ProductListScreen.tsx:63`, `ProductDetailsScreen.tsx:65` | `error as AppError`. RTK Query types the error as `AppError \| SerializedError`. The cast hides the second case. One `toAppError(unknown)` in `shared/api` removes all three                                                                                                  |
| 3   | `features/auth-by-credentials/ui/LoginForm.tsx`                             | Hand-rolled form. See 3.1. Also `submit(...)` at line 31 is a floating promise                                                                                                                                                                                                |
| 4   | `entities/session/api/refreshTokens.ts:32`                                  | 408 and 429 end the session. Only 400, 401 and 403 should                                                                                                                                                                                                                     |
| 5   | `shared/api/tokens.ts:31`                                                   | `setTokens` ignores the `Result` from the Keychain write. If a rotated token fails to save, memory has the new one and the Keychain the old, revoked one. The next cold start logs the user out with no trace. At minimum call `reportError`                                  |
| 6   | `shared/storage/kv/kv.ts:116`                                               | Mismatch 3 above. For a `user` key, a failed parse at the current version should `keep`, not `discard`                                                                                                                                                                        |
| 7   | `shared/ui/Button/Button.tsx:73`                                            | The inner `View` reuses `styles.base`, so padding, border and `minHeight` are applied twice. Buttons are wider and taller than the tokens say                                                                                                                                 |
| 8   | `shared/ui/Carousel/Carousel.tsx:100-108`                                   | Side effects inside a `setIndex` updater: it scrolls the list and calls `onIndexChange`. Updaters must be pure; React may run them twice                                                                                                                                      |
| 9   | `shared/api/baseQuery.ts:21-23,132`                                         | A GET that times out waits 15 s, three times, plus backoff. The user sees a skeleton for about 46 s before an error. Retry timeouts once at most, or shorten the timeout                                                                                                      |
| 10  | `shared/lib/i18n`                                                           | No typed keys. There is no `CustomTypeOptions` declaration, so `t('typo')` compiles                                                                                                                                                                                           |
| 11  | `eslint.config.js:95-166`                                                   | Eleven hand-written copies of the banned-package list. Adding one owned package means editing every list correctly. Generate them from one `owner -> package` map. The fixtures would catch a slip, but only for cases someone wrote                                          |
| 12  | `shared/ui/testing/themePreference.ts`                                      | Redefines the `theme.preference` key that `ThemeProvider.tsx:26` owns. Two definitions of one key will drift                                                                                                                                                                  |
| 13  | `features/biometric-unlock`                                                 | The gate runs only in `restoreSession`, at cold start. Backgrounding the app and returning an hour later asks for nothing. For fintech or health that is not "biometric unlock"                                                                                               |
| 14  | `screens/product-details/ui/ProductDetailsScreen.tsx:42`                    | `useFavorites().find(...)` subscribes the screen to the whole list. Minor                                                                                                                                                                                                     |
| 15  | `screens/home/ui/HomeScreen.tsx:9`                                          | Ignores the user query's loading and error states. Minor, but it is the first screen people read                                                                                                                                                                              |

### 2.3 Accessibility gaps

- `TextInput`: the error text is not tied to the input. A screen reader on the field does not hear it.
- `Modal`: no `accessibilityViewIsModal`, so VoiceOver can reach content behind it.
- `Toast`: role `alert` but no live region, so Android may not announce it.
- `PhoneInput.tsx:117`, the country search field: placeholder only, no label.
- `Text`: no font-scaling policy. `Calendar` day cells are a fixed 36 pt and will clip at large text sizes.
- `Checkbox`, `EmptyState`, `Select`, `RadioGroup`: no `testID` prop, so Maestro has to match on text.

Otherwise the kit is better than most: roles, states, 44 pt targets and `adjustable` actions on the slider are there.

### 2.4 Over-engineering and single-caller code

Less than I expected. The abstractions mostly earn their place.

- `navigationRef` (`RootNavigator.tsx:144`): exported "for a notification handler", zero callers. Either push
  notifications arrive (section 4) or it goes.
- `setLanguage`, `hideToast`, `LoadingOverlay`, `resolveAssetUrl`, `images` (an empty registry), the `linking`,
  `date`, `number` and `file` helpers, `Select`: no caller in the app. Acceptable for a kit, but they sit in the
  non-optional core and each one is something a new developer must learn is unused.
- The `socket` unit connects on sign-in when `SOCKET_URL` is set, with no listener anywhere. Fine as a unit.
- `uploadFiles` takes `put` as an injectable dependency only for tests. Acceptable.

### 2.5 Tests

Good overall. `App.test.tsx`, `products.test.tsx`, `baseQuery.test.ts`, `socketClient.test.ts` and `kv.test.ts`
test real behaviour and would catch real regressions.

Weak or unable to fail:

| Test                                                                              | Problem                                                                        |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `AnimatedSplash.test.tsx:17`                                                      | Asserts a constant is at most 500. It fails only if someone edits the constant |
| `stackHeader.test.tsx:39`                                                         | `toEqual` on a literal copy of the function's return value                     |
| `Spinner.test.tsx:6`, `Screen.test.tsx`, `Modal.test.tsx:7`, `Button.test.tsx:36` | Render-only                                                                    |
| `result.test.ts`                                                                  | Tests two one-line constructors                                                |
| `date.test.ts:6,26`                                                               | `expect.any(String)` and `/\d/`. Almost any output passes                      |
| `TextInput.test.tsx:27-41`                                                        | Reads `props.editable` and `props.secureTextEntry`: implementation detail      |
| `tokens.test.ts:23`                                                               | Counts calls on the Keychain mock                                              |

Missing: a `user` key with an invalid shape, a 429 on refresh, a Keychain write failure during rotation, any RTL or
second-locale case, any tablet width.

### 2.6 Structural rules I would argue with (not acting on these)

- **The UI kit is one lint element.** That is why mismatch 4 exists. Making each `shared/ui/<Component>` its own
  element, as `shared/lib/*` already is, would let lint enforce unit isolation for real. This is a rule change, not
  a restructure.
- **No `widgets` layer.** `<ProductCard action={<FavoriteButton />} />` is composed identically in two screens
  (`ProductListScreen.tsx:105`, `FavoritesScreen.tsx:28`), and screens cannot share. ADR 0001 says nothing needs
  the layer yet. Two copies is tolerable. I would revisit at the third.
- **MMKV is unencrypted by decision (ADR 0003).** Right for this template, where account storage holds favourites.
  A health app will put PHI there. `defineKey` should offer an encrypted account store, keyed from the Keychain,
  as an opt-in with its own ADR.

---

## 3. Leads

### 3.1 Forms: confirmed

There is no form library. `LoginForm.tsx` is hand-rolled: four `useState` calls, a manual required check at line
27, a `showRequired` flag, and an `edit` wrapper to clear the server error. It works for two fields. It gives the
team nothing to copy for a ten-field KYC form with async validation.

Recommendation: `react-hook-form` (7.92.0) with `@hookform/resolvers` (7.0.6, peer `zod ^3.25 || ^4`, which fits zod
4.6.7). Both are JS only, so there is no New Architecture question. Add thin `Form*` field wrappers over the
existing inputs, migrate `LoginForm` as the worked example, and document it in the README. Both latest versions
were published on 2026-11-11, so pin the newest release that is two weeks old.

### 3.2 Theme: confirmed

No breakpoints, no tablet handling, no `useWindowDimensions` outside `ImageViewer`. The migration map promised
breakpoints when it dropped `react-native-size-matters`.

Recommendation: `breakpoints` tokens in the theme, a `useBreakpoint` hook on `useWindowDimensions`, a
`maxContentWidth` on `Screen`, and two columns on a tablet in the product list as the example. Do not bring back
`size-matters`.

### 3.3 Lists and images: confirmed; adopt both

`FlatList` is used in both product screens and four kit components. `shared/ui/Image` is a themed `RN.Image` with
no cache control.

- **FlashList: yes, for screen-level lists.** `@shopify/flash-list` 2.3.3, the version the case study used. Wrap it
  in `shared/ui/List` with a lint owner rule. Keep `FlatList` for the short lists inside modals and the pagers.
  The re-render problem in 2.2 #1 must be fixed either way; FlashList does not fix it.
- **Image caching: yes, behind the existing wrapper.** `react-native-turbo-image` 1.24.3, also from the case study.
  Its last publish was 2026-07-23. `expo-image` is the alternative, but it needs Expo modules in a bare app, which
  ADR 0006 already declined for OTA.

Both need a New Architecture build check on 0.88 that I cannot do without building. The case study proves them on
0.80 only. Each gets an ADR.

### 3.4 i18n and RTL: assumed, not proven

- One locale. `SUPPORTED_LANGUAGES = ['en']`, and `initI18n` accepts one language's namespaces.
- No use of `I18nManager` anywhere. `setLanguage` has no caller.
- Android has `supportsRtl="true"`, and styles do use start/end. That part is real.
- Four components would be wrong in RTL: `RangeSlider` (`left` and `translateX`), `Carousel` and `ImageViewer`
  (`contentOffset.x` paging maths), `Calendar` (chevrons do not flip).
- No test covers a second language or RTL.

Recommendation: add a second, right-to-left locale with at least the `common` and `auth` namespaces, change
`initI18n` to take `{ en, ar }`, add typed keys, a language row in Settings, and fix the four components.

### 3.5 Scaffolding: confirmed

`scripts/` has `create-app.js`, its test, and `init-env.js`. Adding a slice by hand takes six steps across three
files (README "Adding a feature"). Recommendation: `scripts/new-slice.js` in plain Node, no generator dependency,
tested the way `create-app` is. It creates `index.ts`, `i18n/en.ts`, a `ui` component and a co-located test, and
registers the namespace in `src/app/i18n/index.ts`.

### 3.6 Dependency pinning: confirmed

Four devDependencies use `^`: `@babel/core`, `@babel/preset-env`, `@babel/runtime`, `@types/react`. All four are
template leftovers. Every runtime dependency is exact.

The "two weeks old" rule holds. I checked eight pins against their publish dates and commit dates; each was 14 days
or older, apart from React Native 0.88.1, which the map records as an exception.

### 3.7 CI: confirmed

- **Maestro runs only locally.** Nothing in `ci.yml` references it. The README says so.
- **No release workflow and no OTA workflow.** ADR 0006 decides against OTA, so that part is consistent. ADR 0005
  describes a release pipeline that does not exist; Gradle is ready for it, and no job calls it. There are no
  Fastlane files.
- Smaller gaps: the generated app is typechecked and tested but never linted; actions are pinned by tag, not SHA,
  in a public repo; no dependency or Pods cache.

### 3.8 Stray files: dismissed, with one new finding

`android-build.log` and `coverage/` are both ignored (`.gitignore:92` and `:67`) and not tracked. They are safe to
delete locally. The root **`.DS_Store` is tracked**, which was not on the list.

### 3.9 Versions

React Native **0.88.1 is the current stable** (published 2026-10-27). `0.89.0-rc.1` is on the `next` tag. Nothing
to do.

Behind, and safe to take now (patch or minor, two weeks old on 2026-11-13, peers satisfied):

| Package                   | Pinned | Latest | Published  | Note                                               |
| ------------------------- | ------ | ------ | ---------- | -------------------------------------------------- |
| `react`                   | 19.3.0 | 19.3.1 | 2026-10-14 | React Native 0.88.1 peers `^19.3.0`                |
| `react-redux`             | 9.3.0  | 9.3.1  | 2026-10-27 |                                                    |
| `react-native-screens`    | 4.30.0 | 4.30.1 | 2026-10-28 |                                                    |
| `react-native-worklets`   | 0.13.0 | 0.13.1 | 2026-10-26 | Check Reanimated 4.7.1's compatibility table first |
| `react-native-bootsplash` | 7.3.4  | 7.3.5  | 2026-10-30 | Exactly 14 days                                    |

Behind, but under two weeks old, so the repo's own rule says wait: `datetimepicker` 9.3.0, `@reduxjs/toolkit`
2.14.0, `@sentry/react-native` 8.35.0, `libphonenumber-js` 1.13.16, `react-native-blob-util` 1.1.1,
`react-native-gesture-handler` 3.5.0, `react-native-keyboard-controller` 1.23.0, `react-native-nitro-modules`
0.37.2, `react-native-safe-area-context` 5.11.1, `eslint-plugin-boundaries` 7.4.3, `prettier` 3.10.1,
`typescript-eslint` 8.72.2.

Major versions:

| Package                        | Pinned  | Latest          | Status                                                                                                            |
| ------------------------------ | ------- | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| `react-native-keychain`        | 10.0.0  | 11.0.0          | Published 2026-11-06. Peers `react-native >=0.82`. Wait, and read the changelog: the biometric gate depends on it |
| `i18next` and `react-i18next`  | 26 / 17 | 27.1.1 / 18.0.1 | Must move together (`react-i18next` 18 peers `i18next >=27.0.1`). Both under a week old                           |
| `@react-native-community/cli*` | 20.2.0  | 21.0.0          | Published 2026-11-12. Check which React Native it targets                                                         |
| `typescript`                   | 6.0.3   | 7.0.2           | Blocked: `typescript-eslint` peers `<6.1.0`                                                                       |
| `eslint`                       | 9.39.5  | 10.14.0         | Blocked: `@react-native/eslint-config` 0.88.1 peers `^8 \|\| ^9`                                                  |
| `@babel/*`                     | 7.x     | 8.x             | Blocked: `@react-native/babel-preset` 0.88.1 depends on `@babel/core ^7.25.2`                                     |

The migration map's reasons for staying on TypeScript 6 and ESLint 9 are confirmed by the peer ranges.

Limit of this check: versions, dates and peers come from the npm registry. I did not read the changelogs, so
"safe" above means "patch or minor with satisfied peers", not "no behaviour change".

---

## 4. Dropped items from RN_Arch

The map drops 58 rows. Below is every dropped component, hook and library. The remaining dropped rows are editor
files, a second lockfile, old review docs, unused constants, demo data and type files; all should stay dropped.

Registry facts are from 2026-11-13. "NA check" means a New Architecture build on 0.88, which Phase 2 would need
and which I cannot run.

### Asked about specifically

| Item                                   | What it did in RN_Arch                                                                 | Why dropped                                   | Recommendation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bottom sheet (`@gorhom/bottom-sheet`)  | Provider mounted; only `BottomSheetTextInput` was used, inside input fields            | No real sheet existed                         | **Restore as unit `bottom-sheet`.** Every client app wants one. Two candidates: `@lodev09/react-native-true-sheet` 4.1.0 (native sheets, peers `react-native >=0.82`, published 2026-11-07) or `@gorhom/bottom-sheet` 5.2.14 (last publish 2026-05-09; its Gesture Handler peer is `>=2.16.1` and this repo is on 3.4). I lean to true-sheet. ADR needed                                                                                                                                                     |
| OTP input (`confirmation-code-field`)  | Installed, never imported                                                              | Unused                                        | **Restore as unit `otp-input`, with no library.** A hidden `TextInput` plus cells is about 150 lines, with `oneTimeCode` autofill. Keep `cellCount`, `value`, `onChangeText`. Fintech needs it in week one                                                                                                                                                                                                                                                                                                   |
| WebView                                | Installed, never imported                                                              | Unused                                        | **Restore as unit `webview`** on `react-native-webview` (14.0.1, published 2026-11-04; pin the previous release). Wrapper in `shared/ui/WebView`, owner lint rule, origin allow-list. Needed for 3-D Secure, payment pages, terms                                                                                                                                                                                                                                                                            |
| Drawer navigation (`CustomDrawer`)     | Custom drawer content; imported `@react-navigation/drawer`, which was not installed    | Broken import; dropped in Q6                  | **Stay dropped; add a README recipe.** `@react-navigation/drawer` 7.14.4 fits the installed peers. As a unit it would have to swap the root `Tabs` navigator, and markers around a navigator swap are fragile                                                                                                                                                                                                                                                                                                |
| Video player (`CustomVideoPlayer`)     | 331-line player; imported `react-native-video`, not installed                          | Broken import; dropped in Q6                  | **Stay dropped.** Add `react-native-video` (6.19.3) when a client needs it. It is a heavy native dependency to carry in every app                                                                                                                                                                                                                                                                                                                                                                            |
| Google Places input                    | 370-line autocomplete calling the Places web API from the app with a bundled key       | Dropped in Q6; keys removed from env          | **Stay dropped.** A key in the bundle is extractable. The right design proxies through the client's backend, which is app-specific. Recipe only                                                                                                                                                                                                                                                                                                                                                              |
| Colour picker (input and modal)        | Colour field and modal; imported `reanimated-color-picker`, not installed              | Broken import; dropped in Q6                  | **Stay dropped.** Niche. `reanimated-color-picker` 5.1.3 exists when needed                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Popup menu (`react-native-popup-menu`) | Provider mounted, never used                                                           | Unused                                        | **Stay dropped.** The bottom-sheet unit covers action menus. `@react-native-menu/menu` 2.0.0 is the native option, but its last publish was 2025-09                                                                                                                                                                                                                                                                                                                                                          |
| `useInfiniteQueryList`                 | 175-line adapter from an RTK infinite query to list props; typed with `any`            | Never used                                    | **Restore as a small rewrite, not the hook.** `ProductListScreen` has about 20 lines of glue (flatten pages, refreshing flag, guarded `onEndReached`) that every list will repeat. A typed helper of about 30 lines, paired with the `List` wrapper from 3.3                                                                                                                                                                                                                                                 |
| `useLocationChangeTracker`             | Watched position every 30 s or 100 m; imported a geolocation package, not installed    | Broken import; location out of scope          | **Stay dropped for now.** Logistics will need location, but the libraries look stale (`@react-native-community/geolocation` last published 2024-09, `react-native-geolocation-service` 2022), and background tracking is a product decision. Write an ADR when a logistics client lands                                                                                                                                                                                                                      |
| File and media chat items              | Chat bubbles for images, video and documents, a grouped grid, and a media viewer modal | Chat-specific; depended on the dropped player | **Stay dropped as chat UI.** One generic piece is worth restoring into the `media` unit if you use it: a `FileTile` (thumbnail or type icon, name, progress, download) built on `categorizeFile` and `downloadFile`. `ImageViewer` already replaces the image half of `ViewMediaModal`                                                                                                                                                                                                                       |
| Push notifications                     | A commented-out FCM and notifee block, plus an `fcmToken` field in a slice             | Never in scope                                | **Add as unit `push`. It is the largest gap for all three verticals.** Design it like monitoring: an interface in `shared/lib/push`, an adapter in `app/push`, token registration, tap-to-deep-link through `navigationRef`, and `onSessionEnd` to unregister. Problems: Firebase config files cannot live in a public repo (the reason ADR 0007 rejected Crashlytics); `@notifee/react-native` 9.1.8 was last published 2024-12; and none of it can be verified without a Firebase project and real devices |

### Other dropped libraries

| Item                             | What it did                   | Why dropped                              | Recommendation                                                                                                                  |
| -------------------------------- | ----------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `formik`, `yup`                  | Nothing; not imported         | Unused                                   | **Replace** with `react-hook-form` and the zod resolver (3.1)                                                                   |
| `react-native-size-matters`      | Scaled sizes by screen width  | Oversizes tablets                        | Stay dropped, but deliver the breakpoints that were promised (3.2)                                                              |
| `react-native-linear-gradient`   | Shimmer effect                | Skeleton is an opacity pulse             | Stay dropped                                                                                                                    |
| `react-native-image-zoom-viewer` | Zoomable image modal          | Unmaintained; rewritten as `ImageViewer` | Stay dropped                                                                                                                    |
| `react-native-navigation-mode`   | Bottom margin for gesture nav | Safe-area insets do it                   | Stay dropped                                                                                                                    |
| `react-native-restart`           | Restart after a crash         | Error boundary reset                     | Stay dropped                                                                                                                    |
| `jail-monkey`                    | Root and jailbreak check      | Easy to bypass (Q17)                     | Stay dropped. Note in the README that fintech pen tests ask for it, and that Play Integrity and App Attest are the real control |
| `axios`                          | Configured, never imported    | RTK Query uses `fetch`                   | Stay dropped                                                                                                                    |
| `@react-native-picker/picker`    | Nothing; not imported         | Unused                                   | Stay dropped; `Select` covers it                                                                                                |
| `react-dom`                      | Nothing                       | Not needed                               | Stay dropped                                                                                                                    |

### Other dropped components, screens and helpers

| Item                                                                                                                                           | What it did                          | Recommendation                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------- |
| `MessageField`, `ListFooterComponent`                                                                                                          | Multiline input; list footer spinner | Stay dropped. Both are folded into `TextInput` and `ListFooterSpinner`, with tests |
| Five decorative loaders                                                                                                                        | Animated loading variants            | Stay dropped                                                                       |
| `SkeletonComponent` presets                                                                                                                    | Card-shaped skeleton layouts         | Stay dropped; screens compose `Skeleton`                                           |
| `BlockedScreen`, jailbreak check in `MainWrapper`                                                                                              | Blocked rooted devices               | Stay dropped (see `jail-monkey`)                                                   |
| `ChatRoom`, `DUMMY_CHAT_ROOM`                                                                                                                  | Demo chat over dummy data            | Stay dropped                                                                       |
| `axios/axios.ts`, `unwrapData`, `createInfiniteQuery`                                                                                          | Unused or harmful API helpers        | Stay dropped                                                                       |
| `isOnBoarding`, `persistCurrency`                                                                                                              | Persisted flags                      | Stay dropped. An onboarding flag is five lines with `defineKey` when needed        |
| `styles.ts` flex helpers, `numberInputOnly`, `generateRandomNumber`, `isNonEmptyArray`, `validateAndScrollToError`, `FALSE_ARRAY`, `LOG_STYLE` | Assorted helpers                     | Stay dropped                                                                       |
| User profile and password in the Keychain                                                                                                      | Stored both                          | Stay dropped. Correct call                                                         |

---

## 5. Prioritised fix list

Effort is for one developer who knows the repo. "Unverifiable here" means it needs a device, a store account or a
third-party project that I do not have.

### P0: wrong or broken

| #   | Fix                                                                                                                          | Effort |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Move the hard-coded strings in 2.1 to the `common` namespace; give the Home tab a title                                      | 3 h    |
| 2   | `kv.ts`: keep a `user` value that fails its schema instead of deleting it; add the test                                      | 1 h    |
| 3   | `refreshTokens.ts`: end the session on 400, 401 and 403 only; 408 and 429 are `unavailable`                                  | 30 min |
| 4   | `Button.tsx`: stop applying `styles.base` twice                                                                              | 30 min |
| 5   | Untrack `.DS_Store`; pin the four `^` devDependencies; drop the stale `RuntimeCheck` coverage exclusion                      | 30 min |
| 6   | Correct the doc claims in section 1 (rows 2, 4, 6, 7, 10, 11, 12, 16), or enforce row 4 with a lint element per UI component | 1-2 h  |

### P1: gaps a real project hits in week one

| #   | Fix                                                                                                                                                      | Effort                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 7   | Form pattern: `react-hook-form`, zod resolver, `Form*` wrappers, `LoginForm` migrated, README section                                                    | 1 day                         |
| 8   | Slice generator `scripts/new-slice.js` with tests                                                                                                        | 0.5-1 day                     |
| 9   | Breakpoints, `useBreakpoint`, `Screen` max width, tablet columns in the product list                                                                     | 0.5 day                       |
| 10  | Second (RTL) locale, multi-locale `initI18n`, typed keys, language setting, RTL fixes in four components                                                 | 1-1.5 days                    |
| 11  | Fix product-list re-renders; `List` wrapper on FlashList; list-props helper                                                                              | 0.5 day, plus NA check        |
| 12  | Image caching behind `shared/ui/Image`                                                                                                                   | 0.5 day, plus NA check        |
| 13  | `toAppError(unknown)` to remove the three casts; report Keychain write failures in `setTokens`                                                           | 2 h                           |
| 14  | Unit `otp-input`                                                                                                                                         | 0.5 day                       |
| 15  | Unit `bottom-sheet`, with ADR                                                                                                                            | 1 day, plus NA check          |
| 16  | Unit `webview`                                                                                                                                           | 0.5 day, plus NA check        |
| 17  | Unit `push`: interface, adapter, docs                                                                                                                    | 1.5-2 days, unverifiable here |
| 18  | Release workflow on tags (signed AAB from secrets; iOS archive) and a Maestro job on an Android emulator                                                 | 1 day, unverifiable here      |
| 19  | Security baseline for fintech and health: re-lock on return from background, hide content in the app switcher, optional encrypted account store. One ADR | 1-2 days                      |
| 20  | Lint `scripts/`, `tools/` and root JS; generate the restricted-import lists from one map                                                                 | 2 h                           |

### P2: polish

| #   | Fix                                                                                        | Effort           |
| --- | ------------------------------------------------------------------------------------------ | ---------------- |
| 21  | Accessibility gaps in 2.3                                                                  | 3 h              |
| 22  | `Carousel`: move side effects out of the state updater                                     | 30 min           |
| 23  | Retry policy: do not repeat a timed-out GET three times                                    | 1 h              |
| 24  | Replace or delete the weak tests in 2.5; add the missing cases                             | 2 h              |
| 25  | One definition of the theme preference key                                                 | 15 min           |
| 26  | CI: lint the generated app, pin actions by SHA, cache Yarn and Pods                        | 2 h              |
| 27  | Take the five safe upgrades in 3.9                                                         | 1 h, plus builds |
| 28  | `create-app`: update or strip the unit list in the generated app's README and ARCHITECTURE | 1 h              |
| 29  | Remove `navigationRef` if `push` is not approved                                           | 10 min           |
| 30  | Review `minifyEnabled` (off) and add a dark splash                                         | 2 h, plus builds |

---

## Decisions I need before Phase 2

1. **Which P1 items are in.** My suggested first pass: 7 to 13, plus 14 (OTP). That is about five days and needs no
   new native code except FlashList and the image library.
2. **Bottom sheet library:** true-sheet (native, newer) or gorhom (familiar, older).
3. **Push:** build the interface and adapter now, unverified, or wait for a client with a Firebase project.
4. **RTL locale:** which language. Arabic is the usual choice; say if a client needs Urdu or Hebrew.
5. **Row 4 of section 1:** enforce UI component isolation in lint, or correct the sentence in the map.
6. **Image library:** confirm `react-native-turbo-image`, given its last release was in July.
