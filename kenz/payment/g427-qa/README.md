# G4.27: database-atomic settlement prototype (QA ONLY)

This staged SQL candidate replaces fragmented factory payment settlement with **one PostgreSQL transaction** for (1) verified event, (2) order transition, (3) existing paid-trigger revenue ledger, (4) access token + idempotent email-delivery queue, (5) audit. It is NOT yet deployed or called by any production Edge Function.

**Critical integration contract**: caller must verify XPay `XPay-Signature` HMAC over raw body with timestamp, ensure live mode and `metadata.source=digital_factory_v1`, and validate the expected names and fields before invoking this service-role-only RPC. No client/anon/authenticated access. This SQL function DOES NOT verify XPay signatures or independently validate payment with XPay, and is unsafe if exposed to customer credentials.

**Approval gate**: no direct production migration or shared webhook re-deploy. Use isolated Postgres 16 in CI as syntactic/semantic regression and staging before provider-signed test on approved instance.

**Known limitations**: the historical old `xpay-webhook` must be updated to call this RPC instead of doing its own `factory_payment_events` writes; otherwise there is no benefit. Existing old partial states and historical Paid orders MUST be reconciled read-only and explicitly, without backfill or replay. Current Resend dispatch and checkout remain OFF. Signature verification, Meta Purchase side effects, customer binding, token delivery UX, and strict ledger trigger behavior need environment-specific E2E prior to cutover.
