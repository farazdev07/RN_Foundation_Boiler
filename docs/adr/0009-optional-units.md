# 0009. Optional units removed by marker

- Status: Accepted
- Date: 2026-11-04

## Context

The foundation ships features that many apps will not want, such as sockets, media upload, phone input and the
products reference feature. Deleting one by hand means finding every file that mentions it, its packages and its
native settings. Missing one breaks the build, possibly long after the deletion.

## Decision

- [`units.json`](../../units.json) declares each unit's folders, packages, **touchpoints** (files outside its
  folders that mention it), and the other units it `uses`.
- In each touchpoint, the unit's lines carry `@unit:<name>`, or sit between `@unit-start:<name>` and
  `@unit-end:<name>`. This works in TypeScript, Gradle, XML and plist files alike.
- `scripts/create-app.js --remove <units|all>` deletes the folders and tagged lines and drops the packages. It
  refuses to run when:
  - a touchpoint has no marker, meaning the manifest has drifted;
  - an `@unit:` tag sits on the closing line of a statement Prettier has wrapped;
  - a unit is removed while a kept unit `uses` it (for example `carousel` while keeping `products`). This check
    runs before anything is deleted.
- CI generates an app with every unit removed, then typechecks it, runs its tests and builds it for Android.

## Consequences

- Removing a feature is one command, and CI proves the result still builds.
- Adding a unit has a cost: tag every touchpoint, list it in `units.json`, and keep its tests inside its folders
  or under `paths` so they go with it.
- The markers are plain comments, so a careless edit can move code out of a block. The marker checks and the CI
  job catch the usual cases.
- **Known gap:** iOS privacy-manifest entries that a unit's pods add during `pod install` (for example
  `react-native-blob-util`'s required-reason APIs) are not removed with the unit. Leftover declarations are
  harmless, but can be cleaned by hand.

## Alternatives

- **Separate packages per unit.** True isolation, but a monorepo and package publishing for a single app.
- **A code generator that adds units.** It would have to stay in step with every unit's code. Removing tagged lines
  from working code is simpler, and CI tests it.
- **Feature flags at runtime.** The code and native dependencies would still ship.
