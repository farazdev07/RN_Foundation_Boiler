# CLAUDE.md

Rules for working in this repo. [ARCHITECTURE.md](ARCHITECTURE.md) explains them. [docs/adr/](docs/adr/) records
why. Lint and tests enforce most of them, so a violation shows up as a failing check, not a review comment.

## Non-negotiables

- **The repo is public.** Never commit secrets, keystores, certificates, provisioning profiles, `.env.*` files
  (only the `.env.*.example` files are tracked) or client code. `tools/check-repo.js` fails CI on signing material.
- **No AsyncStorage**, directly or through a library. Persist through `defineKey` from `@shared/storage`.
- **Secrets go in the Keychain only,** through `secureStorage`. Never put a token, password or key in MMKV, Redux
  or logs. Never store the password at all.
- **Release signing comes from CI secrets** through environment variables (see `docs/release.md`). Never fall back
  to the debug keystore for a release build.

## Layers

`app → screens → features → entities → shared`, each importing only from layers below.

- No imports between slices on the same layer: feature to feature, entity to entity, screen to screen. Compose in
  the layer above, using slots and callbacks.
- Import a slice only through its `index.ts`, never a deep path.
- Entities and features never import `@react-navigation/*`. They take callbacks, and screens navigate.
- Each package with a native or vendor surface has one owning folder (MMKV, Keychain, NetInfo, Sentry, socket.io,
  the image picker, blob-util). Use the wrapper it exports.
- Do not loosen `eslint.config.js` or the boundary fixtures to make an import pass. Restructure the code instead.

## Patterns

- **Server data:** RTK Query endpoints injected into `baseApi`, each with a zod `responseSchema`. Errors are
  `AppError`; show them with `getErrorMessage`.
- **Persisted client state:** a slice, a listener middleware that writes it, and a sync `load` used in
  `loadPersistedState` in `src/app/store/store.ts`. Pick the key's kind (`cache` or `user`) and scope (`device`
  or `account`) on purpose: account data must be wiped on logout.
- **Per-user data outside Redux and MMKV** (a Keychain entry, a file) registers a cleanup with `onSessionEnd`.
- **Strings** live in the slice's `i18n/en.ts` and are registered in `src/app/i18n/index.ts`. No hard-coded
  user-facing text.
- **Styles** come from theme tokens through `makeStyles` or `useTheme`. Use start/end rather than left/right.
  No raw colours in components, except where a colour must ignore the theme (the image viewer's black backdrop).
- **Optional units:** every line a unit adds outside its folders carries `@unit:<name>`. Use
  `@unit-start:<name>` / `@unit-end:<name>` for anything that spans lines or that Prettier may wrap. Keep
  `units.json` in step: `paths`, `touchpoints`, `packages`, `uses`.

## Working rules

- Small conventional commits (`feat(scope): ...`, `fix(...)`, `docs:`, `test(...)`, `build(...)`, `chore:`). The
  commit-msg hook checks them.
- Before committing, run `yarn format:check`, `yarn lint`, `yarn typecheck` and `yarn test`. The pre-commit hook
  runs a subset of them.
- For a change to a unit or its markers, generate an app with that unit removed
  (`node scripts/create-app.js ... --remove <unit>` in a copy) and typecheck it. CI does this with `--remove all`.
- Pin dependency versions exactly, at least two weeks old unless a fix needs newer. Check New Architecture support
  before adding a native package. A native patch or pin needs a comment saying why.
- Report only what was actually run. If something was not verified on a device, say so.
- Tests: co-located unit tests, and `<App />` integration tests with only `fetch` faked. Render `<App />` once per
  test. With RNTL 14, repeated unmount-and-render cycles inside one test left later renders empty, even in the
  next test.
