# KENZ Admin + Wallet Listener | QA-only integration branch
Date: 2026-10-16 | Owner-approved direction: TWO apps only (KENZ customer, KENZ Admin owner).

Source baselines
- Admin: `kenz-admin-apk` at `e0477a62cb8f90f8b07468fc0f005ff70248622d`
- Wallet Listener: `kenz-wallet-listener-v1` at `ca146a5bd80d734fffba3650e93b16a404119696`
- Deployed web admin remains separate, no changes to production from this branch.

## Important safety gates

0. **Current state:** wallet auto-verification is disabled, zero wallet devices enabled, original standalone Wallet stays installed. Never delete backend audit/receipts.
1. **This commit — source recovery + offline classification QA only:** The Java classifier and JUnit tests use synthetic messages. It reads NO SMS, requests NO SMS permission, makes NO network call, and cannot mark payments Paid.
2. **Future gated receiver:** Add Android RECEIVE_SMS only with a clear native owner opt-in, a permission request, and an off-by-default switch. Keep the receiver disabled until opt-in; do not read inbox history. Only incoming Vodafone Cash candidates.
3. **Future transport:** Port Wallet Listener queue and WorkManager with bounded retry and encrypted per-device pairing. Old Wallet Listener tokens/data cannot automatically be read by Admin (different Android app sandbox); explicitly re-pair Admin to backend. NEVER embed server secrets.
4. **Future owner dashboard:** Add “المحافظ” to KENZ Admin with connection status, queued/needs-review receipts, safe opt-in, and a no-automation fallback. Never let parsed SMS alone approve a payment.
5. **Server safety:** Keep `factory_payment_methods.wallet.public_config.auto_verification=false` until evidence-backed end-to-end tests of partial, duplicate, forged, wrong-recipient, and ambiguous transfers; never change payment or delivery status during dry run.
6. **Install safety:** Current Admin release `signingConfig signingConfigs.debug` in GitHub Actions: a new runner's debug key is NOT a durable upgrade key. Debug QA build uses `applicationIdSuffix '.walletqa'` to install side-by-side. Do not replace the existing `com.kenzelyom.admin` APK until a stable release key and verified upgrade path are established. Do not share keystore contents or passwords through chat.
7. **Retirement gate:** Keep standalone KENZ Wallet and its historic records until the merged Admin has passed device QA, pairing and actual isolated transfer verification. Then revoke old device tokens and uninstall only the redundant APK. Do NOT drop wallet receipt tables.

## QA commands (GitHub Actions)
`gradle :app:testDebugUnitTest :app:assembleDebug` (inside `android/kenz-admin`).

The resulting app ID is `com.kenzelyom.admin.walletqa`, separate from production.
This stage is NOT a deployable Wallet integration. No receiver, no Android SMS permission, no account pairing.
