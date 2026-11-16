# Architecture decision records

Each record states one decision, the options weighed and what follows from it. A record is not edited once
accepted; a later decision that changes it gets a new record that supersedes it.

| #                                                      | Decision                                                           | Status   |
| ------------------------------------------------------ | ------------------------------------------------------------------ | -------- |
| [0001](0001-feature-sliced-layers.md)                  | Trimmed Feature-Sliced Design, enforced by lint                    | Accepted |
| [0002](0002-state-and-persistence.md)                  | Redux Toolkit and RTK Query; sync MMKV hydration                   | Accepted |
| [0003](0003-storage.md)                                | MMKV for data, Keychain for secrets                                | Accepted |
| [0004](0004-react-navigation-7.md)                     | Stay on React Navigation 7                                         | Accepted |
| [0005](0005-release-pipeline.md)                       | Release pipeline on GitHub Actions, Fastlane later                 | Accepted |
| [0006](0006-ota-updates.md)                            | No OTA updates in the foundation                                   | Accepted |
| [0007](0007-crash-reporting.md)                        | Sentry behind a monitoring interface, off without DSN              | Accepted |
| [0008](0008-biometric-unlock-gate.md)                  | Biometric unlock as a separate Keychain gate                       | Accepted |
| [0009](0009-optional-units.md)                         | Optional units removed by marker                                   | Accepted |
| [0010](0010-push-notifications.md)                     | Push notifications are out of scope, and how they would plug in    | Accepted |
| [0011](0011-image-caching.md)                          | Remote images through react-native-turbo-image, behind one wrapper | Accepted |
| [0012](0012-flashlist-for-screen-lists.md)             | FlashList for screen lists                                         | Accepted |
| [0013](0013-bottom-sheet.md)                           | Bottom sheet on the platform's own sheet                           | Accepted |
| [0014](0014-device-integrity-and-screen-protection.md) | Device integrity and screen protection as optional units           | Accepted |
| [0015](0015-version-gate.md)                           | Version gate from a static document, failing open                  | Accepted |

New record: copy the shape of an existing one, take the next number, and add it to this table.
