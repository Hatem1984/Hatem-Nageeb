# KENZ G4.19 — independent security review candidate (QA ONLY)

**Date:** 18 October 2026 · **Area:** customer receipt and paid-product email via Resend · **Status:** security review requested, NOT AUTHORIZED, NOT DEPLOYED.

## Evidence and decision provenance
- On 17 Oct the owner approved ongoing NEW consented email delivery. The former G4.17 pilot closed by its watchdog at 21:49 Cairo and G4.19 permanent migration was **blocked by execution-tool safety**, with no deployment. This package neither retries nor works around that blocked operation.
- On 18 Oct, read-only production check confirmed `kenz_g414_cutover_gate_v1=false`, `kenz_g417_pilot_control_v1=false`, Cron 14/15 disabled, watchdog 16 enabled, zero unsettled delivery rows, zero open exceptions. Current verified test emails were previously delivered to the owner; **no proof of long-running live customer dispatch**.
- Read of live `kenz-customer-receipt-resend-worker v2` and `kenz-customer-product-resend-worker v4` found both per-worker gate checks but no direct freshness check on independent central monitor or emergency stop. Existing workers have Bearer auth, consent/payment validation, conditional claim, and idempotency; those must not be removed.

## Proposed control (not present in Production)
An **independently monitored short-lived central lease** is needed, not just Cron 14/15 reactivation. The candidate `central-email-guard.mjs` is pure; it checks a 3-row **new** control-plane state:

| Key | Required state | Purpose |
|---|---|---|
| `kenz_g419_permanent_dispatch_gate_v1` | enabled, `G419_DURABLE_DISPATCH_APPROVED`, owner approval, scope, unique generation, valid activation, max 120s lease, no backfill/no retry | Explicit, expiring permission |
| `kenz_g419_monitor_heartbeat_v1` | enabled, `G419_MONITOR_HEALTHY`, identical generation, independent observer, <=75s old, validated Cron/queue/auth/provider checks | Health-driven expiry |
| `kenz_g419_emergency_stop_v1` | explicitly disabled, `G419_STOP_CLEAR`, identical generation | Kill switch; **missing row denies** |

The independently authorized monitor needs a *separate* security design and privilege boundary. It must check both Cron jobs and queues, and renew leases only when healthy. Never let the send worker forge or self-renew its monitor heartbeat; neither browser requests nor clients may modify these rows. For read-only proof, they are **absent**, so no email would pass this QA guard today.

The `build-worker-candidates.mjs` program patches **one pinned, read-only actual receipt worker v2 source fixture** and **one clearly labeled synthetic product-v4 contract**. Saving the full product worker source to GitHub was denied by a safety check; that operation was not retried or routed elsewhere. Product-v4 source compatibility is therefore NOT yet verified or approved. The builder refuses mismatches to its fixture contracts. It inserts checks before queue claim, in the health display, and immediately before Resend API call. It does **not** deploy. The original worker authentication, provider idempotency, consent, paid/order checks and SMTP legacy routing remain untouched.

## Scope and known review blockers
1. **Not a production-ready migration.** No DB roles/grants/monitor rollout or live Cron changes are included.
2. This first candidate covers the two new-customer G4.10/G4.11 workers only. The alternative legacy `factory-resend-queue-worker` owner-pilot path and any newly discovered customer-facing paths must be inventoried before go-live; **do not claim global Resend egress enforcement**.
3. Two phase checks reduce risk but cannot reverse an already-submitted provider request or eliminate the tiny check-to-send race. Emergency stop prevents new sends after effective cutoff, not cancellation of in-flight HTTP.
4. Failures after provider acceptance remain no-auto-retry/manual provider reconciliation; no historical queue replay or money/status changes.
5. Existing approved G4.17/old G4.14 gate has a <=24h lease; do **not** disable watchdog 16 or extend old gate. G4.19 future central lease design must be reviewed and approved as a distinct, new deployment.
6. No credentials, API keys, customer records or PII belong in this repository package. Synthetic emails use `example.invalid`.

## Validation and approvals still required
- Run `node --test *.test.mjs` and `node build-worker-candidates.mjs` on the QA fixtures. Only the receipt source is an actual pinned live worker snapshot; the product fixture is synthetic. A CI workflow should run those steps with network-independent tests. All QA fixtures are source-only (no actual Resend calls).
- Independent review: validate correctness and privilege boundaries of monitor/lease producer, domain/sender, false-positive backlog shutoff, emergency stop and operational rollback; test late/stale/duplicate and consented-only cases in a **separate approved staging environment**.
- Tool-level security approval of the **previously blocked G4.19 action** cannot be issued via this PR. An authorized security/deployment reviewer must explicitly accept a safe *new* production change request. Do **not** merge/deploy/retry an earlier rejected operation.
- After approval, owner-controlled go-live authorization, staged HTTP test with **owner-only** recipient, full download E2E, then separate decision to reopen Checkout. No production effect occurs from this PR.

## QA process
`Part: Pure guard → Test → Verify → Close` (test pass is QA-only); `Part: receipt source adapter + synthetic product adapter → Test → Verify → QA-only Close; actual product integration still OPEN`; `Part: independent monitor + egress inventory + authorized security review → [pending]`; `Part: live approval / rollout → [blocked]`.
