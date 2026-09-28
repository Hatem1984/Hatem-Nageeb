# KENZ Wallet Listener

Android bridge for KENZ ELYOM mobile-wallet verification.

## What it does
- Receives new wallet-related SMS messages only after the app is installed.
- Applies a local wallet-message filter before anything leaves the phone.
- Queues matching events locally if the internet is unavailable.
- Sends queued wallet events to the KENZ backend over HTTPS.
- Uses a revocable, one-device bearer token obtained through a one-time pairing code.
- Requires only RECEIVE_SMS, INTERNET, and boot scheduling permissions.

## Payment safety
The backend remains the source of truth. A customer order is not marked paid until verified wallet receipts add up to the full order amount. Partial payments remain pending.

## Build
GitHub Actions builds an APK for direct sideloading.
