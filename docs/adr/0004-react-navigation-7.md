# 0004. Stay on React Navigation 7

- Status: Accepted
- Date: 2026-11-04, rechecked 2026-11-07

## Context

React Navigation 8 is in development. Moving early would avoid a migration later, but only if it is stable.

## Decision

Stay on React Navigation 7 and use its static API:

- native-stack plus bottom-tabs;
- typed params through the global `RootParamList`;
- linking generated from the screen config;
- auth gating with conditional groups.

On 2026-11-07, npm's `latest` for `@react-navigation/native` was `7.5.1` and `next` was `8.0.0-alpha.51`. An alpha
is not a base for production apps.

## Consequences

- Move to 8 once it is stable and at least two weeks old, the project's dependency age rule. The static API is the
  direction 8 continues, so the move should be mostly mechanical.
- Each screen chooses its own header; the default is none. The stack header test covers the default and a custom
  header.

## Alternatives

- **React Navigation 8 alpha.** Not stable.
- **Expo Router.** File-based routes would tie navigation to the folder structure and conflict with the layers.
- **react-native-navigation (Wix).** Heavier native integration and a smaller ecosystem.
