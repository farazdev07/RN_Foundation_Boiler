# 0002. Redux Toolkit and RTK Query; sync MMKV hydration

- Status: Accepted
- Date: 2026-11-04

## Context

Both earlier codebases used Redux Toolkit. RN_Arch persisted state with redux-persist over AsyncStorage. That
hydrates asynchronously, so the first frame renders empty and needs a loading gate. redux-persist's only release
is 6.0.0, from 2019.

## Decision

- **Server state** lives in RTK Query. Entities inject endpoints into one `baseApi` and validate every response
  with a zod `responseSchema`.
- **Client state** lives in RTK slices.
- **Persisted client state** uses two pieces. A listener middleware writes a slice to MMKV after the actions that
  change it. When the store is created, the slice is read back synchronously from MMKV into `preloadedState`.
  Each slice owns its storage key, schema and load function. `app/store` only lists them.
- The serializable and immutability checks stay on, except for the RTK Query cache. RTK writes that cache itself,
  through Immer, from parsed JSON. Walking a long product list on every action made the checks slow enough to warn
  on an Android emulator.

## Consequences

- The first frame already has persisted data (theme, favourites), so there is no rehydration flash and no
  `PersistGate`.
- Persistence is explicit per slice: what is saved, when, and in what shape is all visible in the slice's own
  file.
- Reading at store creation means MMKV is read before the session is restored. A launch that finds no saved
  session therefore resets the store and wipes account storage, so data persisted by a session that was not
  remembered never reaches the next user.

## Alternatives

- **redux-persist.** Built around AsyncStorage, async hydration, and no release since 2019.
- **TanStack Query plus Zustand.** Good libraries, and stronger for offline mutations. But that means two state
  systems, async persistence again, and both earlier codebases already used RTK.
- **Persisting the RTK Query cache.** It would give offline lists, but it couples cache internals to disk. A slice
  that keeps exactly the data needed offline (favourites keep the product summary) is simpler and testable.
