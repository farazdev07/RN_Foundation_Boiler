# 0011. Remote images through react-native-turbo-image, behind one wrapper

- Status: Accepted
- Date: 2026-11-15

## Context

`shared/ui/Image` wrapped React Native's `Image`, which gives no control over the disk cache and re-downloads list
thumbnails more often than a catalogue app can afford. The ProductCatalog case study used
`react-native-turbo-image`, which wraps Nuke on iOS and Coil on Android.

## Decision

- `shared/ui/Image` renders a remote source (`{ uri }`) with `react-native-turbo-image` 1.24.3, and a bundled
  source (`require(...)`) with React Native's `Image`.
- The wrapper's props are its own small set: `source`, `style`, `resizeMode`, `accessibilityLabel`, `testID`.
  Nothing from the library leaks out, and lint allows the import only in `src/shared/ui/Image`. Changing library
  is a change to that one file.
- It is a core dependency, not an optional unit. A wrapper with two implementations, chosen by which unit is
  installed, would be more machinery than the dependency it avoids.

## Consequences

- Thumbnails and detail images are cached on disk and in memory, and fade in over a themed placeholder.
- **The trade-off:** the library registers its view with `requireNativeComponent`. It has no codegen spec, so on
  the New Architecture it runs through React Native's interop layer for legacy view managers, not as a Fabric
  component. Its README states New Architecture support. If React Native removes that interop layer, this is the
  dependency that breaks, and the fix is the one file above.
- Its last release was 2026-07-23. That is acceptable for a thin wrapper over two maintained native libraries, and
  it is the reason the wrapper's props are not the library's props.
- **Verified:** Android dev debug build on React Native 0.88.1 (see the hardening report for what was seen on a
  device). **Not verified:** an iOS build, and image loading on iOS.

## Alternatives

- **expo-image.** Well maintained, but it needs Expo modules in a bare app, which
  [0006](0006-ota-updates.md) already declined for OTA.
- **Keep React Native's `Image`.** No dependency, and no cache control.
- **react-native-fast-image.** Unmaintained.
