# KENZ G4.26 — XPay QA guarded patch, NOT PRODUCTION

**Source:** Actual Supabase shared `xpay-webhook` v23, verified 2026-10-18 (Cairo). The real XPay configuration invokes `/functions/v1/xpay-webhook` (not the separate `factory-xpay-webhook` v19). The function also handles a separate business integration; DO NOT replace, move, or silently redeploy this shared endpoint.

Use `node build-candidate.mjs ./index.ts ./candidate-xpay-webhook.ts` with a fresh **locally saved copy** of the deployed function's `index.ts` obtained through an authorized tool. This is a fail-closed, exact-source patcher limited to `handleFactoryEvent`; it preserves everything before this function and after `Deno.serve` byte-for-byte.

The patch:
- Records provider events under the existing provider+event idempotency unique index.
- Returns without changing an order that is already Paid, even for a later signed, unpaid/failed event.
- Restricts unpaid/failure updates to orders still pending and not paid.
- Allows only one Paid update winner using `.eq(status,pending).neq(payment_status,paid).select(id)`. Only that winner queues a delivery.
- Flags valid-but-late Paid events for owner review if order is no longer pending, rather than blindly re-opening cancelled/expired orders.
- Drops the incompatible additional `bucket:'sales'` INSERT, relying on the existing DB `trg_factory_ensure_xpay_revenue_ledger` which inserts bucket NULL during paid state transition.

## Release BLOCKERS (no live deploy authorized by this QA artifact)
1. **The source has no unit of work around recording provider event then transitioning order and queuing delivery.** If an error occurs after the event is inserted, a later provider replay sees duplicate and can be prematurely ACKed. Need recoverable event-state/idempotent transition designed and tested at the database level before Production.
2. Need isolated branch/database with actual XPay signed-event fixture tests and trigger/ledger/delivery race regression; DB branch currently unavailable and would cost compute to create.
3. Need verified rollback snapshot of `xpay-webhook v23` and production transport/analytics checks. Explicitly review shared unrelated route (do not let KENZ fixes change its behavior).
4. Need actual authenticated provider Test Mode and verified customer email delivery cutover; staged Resend receipt/product gates are OFF, jobs 14/15 OFF.
5. **Never** approve a real payment, resend a real event, unpause Checkout or change Meta/Telegram as part of this QA patch.

Latest 2026-10-18 09:05 Cairo: Supabase orders 46, Paid 20, unsettled delivery 0, wallet enabled 0, email dispatch Cron 14/15 disabled. These are historical record counts, not current genuine sales.

## Verified isolated QA evidence — 2026-10-18 06:20 UTC / 09:20 Cairo
- GitHub Actions run 39103686952, commit da07979c8cecc249effa64cb44f3647dc9c0a415: 23/23 PASS, 0 failures.
- 12 tests cover fail-closed source patching, exact KENZ-only live xpay-webhook v23 handler snapshot, and byte-for-byte preservation outside the handler.
- 11 additional tests execute the patched handler under a mocked, in-memory Supabase client: pending -> paid once, repeat different event, repeat same ID, late unpaid/failure after Paid, late paid after expiry/failure -> exception, wrong amount/currency/session -> reject.
- Verified against deployed v23 source that 11/11 exact pre-patch source markers match. No credentials or other business handler code are persisted in the QA fixture.
- This does NOT validate real XPay signature implementation, actual database race/trigger atomicity, Resend delivery, or provider acceptance. The provider-event-insert followed by separate payment update / delivery enqueue gap remains production BLOCKER.
- Live finances untouched: no order changed, no provider event replayed, no checkout, cron, Telegram, Meta or Resend send enabled. This repository PR contains only isolated QA files, NOT a production replacement function.
