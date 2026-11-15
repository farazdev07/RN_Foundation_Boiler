# 0012. FlashList for screen lists

- Status: Accepted
- Date: 2026-11-15

## Context

The product list is the reference a team copies for every list in a client app. It used `FlatList`, which mounts
a component per row and unmounts it off screen. The review also found that every search keystroke re-rendered
every visible row, because `renderItem` and the row's props were rebuilt on each render.

## Decision

- Screen-level lists use `List` from `shared/ui`, a thin wrapper over `@shopify/flash-list` 2.3.3. Lint allows the
  import only in `src/shared/ui/List`.
- `useInfiniteQueryList` (same folder) turns an RTK Query infinite query into list props: flattened items with a
  stable identity, a guarded `onEndReached`, `onRefresh`, and the `refreshing` and `loadingMore` flags. It replaces
  RN_Arch's hook of the same name, which was never used and typed with `any`.
- The reference screens memoise their row component and pass stable callbacks. That fix is independent of the
  library: FlashList recycles views, it does not stop needless renders.
- Short lists inside a modal (`Select`, the phone country list) and the horizontal pagers (`Carousel`,
  `ImageViewer`) stay on `FlatList`.

## Consequences

- FlashList 2 is JavaScript only: no native code, no pods, nothing for the New Architecture to reject. It does
  require the New Architecture, which this repo always uses.
- Rows are recycled. A row component must not keep state that belongs to its item in `useState`, or the next item
  to reuse the view inherits it. Keep such state in the store or keyed by item ID.
- `contentContainerStyle` takes padding only. Gaps between rows are padding on the row.
- Jest needs `@shopify/flash-list/jestSetup` (in `jest.config.js`) so rows render under test.

## Alternatives

- **Stay on `FlatList` with memoised rows.** Enough for a few hundred rows. Client catalogues and feeds go past
  that, and the team would switch per app, inconsistently.
- **Legend List.** Newer and promising. FlashList is the one already proven in the case study.
