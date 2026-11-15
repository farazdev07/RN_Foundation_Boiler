# 0013. Bottom sheet on the platform's own sheet

- Status: Accepted
- Date: 2026-11-15

## Context

RN_Arch mounted `@gorhom/bottom-sheet` but only used its text input. Client apps do need a real sheet: filters,
action menus, confirmations with content. Two libraries were candidates on 2026-11-13:

| Library                            | Version | Last publish | How it works                                                                                                         |
| ---------------------------------- | ------- | ------------ | -------------------------------------------------------------------------------------------------------------------- |
| `@lodev09/react-native-true-sheet` | 4.0.1   | 2026-10-30   | The system sheet (`UISheetPresentationController`, Material bottom sheet). Fabric component with a codegen spec      |
| `@gorhom/bottom-sheet`             | 5.2.14  | 2026-05-09   | A sheet drawn in JS with Reanimated and Gesture Handler. Its Gesture Handler peer is `>=2.16.1`; this repo is on 3.4 |

## Decision

Add the optional unit `bottom-sheet`: `BottomSheet` in `src/shared/ui/BottomSheet`, on
`@lodev09/react-native-true-sheet` 4.0.1.

- The wrapper is declarative, like `Modal`: `visible`, `onClose`, `title`, `snapPoints`, `dismissible`. It
  presents and dismisses the native sheet as `visible` changes, and calls `onClose` when the user closes it.
- Lint allows the library import only in that folder. The unit is removed with `--remove bottom-sheet`.

## Consequences

- The sheet looks and behaves as the platform's does, including the keyboard, the grabber and accessibility.
- It is a native dependency, so adding or removing the unit needs a store release, not an OTA update.
- Content is not a React Native `Modal`: toasts shown while a sheet is open appear behind it. `Modal` mounts its
  own toast viewport; the sheet does not yet.
- **Verified:** Android dev debug build on React Native 0.88.1. **Not verified:** presenting a sheet on a device
  (no screen in the template uses it), and anything on iOS.
- If this library stops building on a future React Native, do not swap silently: the alternative below has a
  different API and different behaviour, so it is a new decision.

## Alternatives

- **`@gorhom/bottom-sheet`.** Familiar from RN_Arch and very flexible, but six months without a release and
  untested against Gesture Handler 3.
- **`Modal` with a slide animation.** No dependency, and no drag, detents or keyboard handling.
