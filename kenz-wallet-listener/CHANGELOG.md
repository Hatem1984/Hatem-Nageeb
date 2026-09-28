# Changelog

## 2.0.0
- Replaced the custom JobScheduler path with AndroidX WorkManager.
- Permission grant is now manual and lifecycle-safe.
- Added on-device crash diagnostics shown in the app.
- Added retry-safe background queue handling.
- Hardened wallet SMS filtering.
- Removed the boot receiver and custom JobService from the active manifest.
- Added unit tests for wallet-message classification.
