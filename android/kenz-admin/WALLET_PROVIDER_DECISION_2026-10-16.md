# KENZ ELYOM | Owner Wallet Integration Decision — 2026-10-16

**Scope:** Internal-only KENZ Admin Android app, plus KENZ customer storefront. No MONTEJ, Business Game, or unrelated infrastructure changes.

## Confirmed owner intent

One customer app (KENZ) and one owner app (KENZ Admin) on the same phone that receives Vodafone Cash notifications. Retire standalone Wallet **only after** safe functional parity and device acceptance. Preserve original payments and audit trails.

## Latest verified state

- GitHub source: `kenz-admin-apk` and `kenz-wallet-listener-v1` exist in `Hatem1984/Hatem-Nageeb`.
- QA-only branch: `feat/kenz-admin-wallet-qa-20261016`; commit `a1d90d8a385f0d6636ece0219c258a931f835c00`. The separate package `com.kenzelyom.admin.walletqa` builds; read-only Android wallet preview only. No SMS permission, receiver, payment submission or payment approval.
- Supabase read-only check 2026-10-16 18:42 UTC: **zero enabled wallet devices**, `wallet.public_config.auto_verification=false`, zero new wallet receipts in seven days, 42 orders, 19 with paid status, zero unsettled deliveries. These are system counts, not clean sales.
- An attempted SMS receiver integration was blocked by tool safety checks; it has NOT been committed. **Do not use another tool or alternative phone data-access permission as a workaround.**
- Debug release signature from GitHub Actions is not a stable guaranteed upgrade signature for the installed Admin APK. Keep production app installed and unchanged.

## Provider & permission review (NOT commercial approval)

- Google Play SMS permissions `RECEIVE_SMS` and `READ_SMS` are highly restricted. Some finance/automation exceptions are described in Play policy, but exception requires Google Play review/approval and appropriate declared core functionality. KENZ Admin has no verified entitlement or exception.
- SMS content or a local notification is not a cryptographically authenticated funds-settlement signal. Never automatically mark a payment Paid using only a candidate SMS, screenshot, or customer-entered reference.
- XPay's older `xpayeg.github.io/docs/pay/` describes `mobile wallets` as an available payment method and a transaction callback. XPay's newer docs describe signed webhooks and settled payment status. **No proof exists that the user's *current* XPay merchant account or existing KENZ store integration has mobile-wallet acquiring enabled.** Confirm from vendor dashboard/support and sandbox first; do not turn it on or change payment methods without owner approval.

Official references:
- https://support.google.com/googleplay/android-developer/answer/10208820
- https://xpayeg.github.io/docs/pay/
- https://docs.xpay.app/en/integrate/webhooks/setting-up-an-endpoint
- https://docs.xpay.app/en/integrate/asynchronous-payments

## Preferred path — conditional on provider evidence

1. **Keep current payment services untouched.** XPay verified webhook remains for its supported transactions; InstaPay and direct wallet stay in the existing manual-proof approval workflow.
2. **Verify with XPay support/dashboard (read only)** whether Vodafone Cash/mobile wallet acceptance is contractually enabled for this merchant, provider API version, fee structure, confirmation event types, status polling and signed event verification. Record evidence and date, but do not copy secrets into notes.
3. If actually supported: implement **provider-confirmed wallet checkout** as a separate isolated feature with sandbox transactions, idempotency, equal-amount guard, refund/replay handling and delivery gates. Requires explicit approval to activate any live method. Owner Admin wallet tab becomes read-only telemetry and exceptions view.
4. If not supported: retain manual proof + owner review and investigate a separate authorized provider / merchant API. No automatic approvals based on unverified SMS.
5. Only after a supported real integration passes device UAT, charge/pay/delivery end-to-end tests, durable APK signing, and rollback checks may the redundant standalone Wallet APK be uninstalled. Do NOT delete `factory_wallet_receipts`, `factory_wallet_devices`, original logs, audit, backups, or customer transaction history. Old tokens may be revoked only after verification and separate authorized cutover.

## Acceptance / sign-off gates

- Read-only provider capability documented — **OPEN**.
- New provider sandbox for eligible wallet method — **OPEN / CONDITIONAL**.
- Payment status integrity and idempotency tests — **OPEN**.
- Stable Admin APK signing + installation parity — **OPEN**.
- Real QA checkout path with authorized test transaction — **OPEN; no user authorization yet**.
- Wallet app retirement — **NO-GO** until all preceding gates pass.
- SMS receiver / notification interception — **NOT IMPLEMENTED; safety blocked**.
- New ads, budget, Meta CAPI and Resend live Canary are outside this task and remain untouched.

**Next execution task:** determine *actual merchant-account* Vodafone Cash support by XPay using read-only evidence; meanwhile Admin QA wallet screen can show existing server-confirmed and owner-reviewed statuses without SMS access. No automatic financial write.
