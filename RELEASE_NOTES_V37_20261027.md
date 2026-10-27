# V37 informational release — 27 October 2026

## Authorized scope
Owner approved replacing the obsolete 24-session promotional landing with the current 3-session / 6-hour informational landing and keeping new checkout closed.

This release **does not sell a course, collect payment, deploy the LMS, record lessons, or change advertisements**.

## User-facing changes
- New V37 home page describing 3 sessions × 2 hours in one week; start date, price and delivery mode are not offered as finalized.
- Free six-question diagnosis, local report and PDF download at `/diagnosis/quick/`.
- Previous diagnostic at `/diagnosis/` remains accessible for legacy users but no longer advertises prices, creates a checkout or initializes Meta/Google advertising tracking.
- Historical `/manual-payment/` and `/complete-payment/` public pages display an explicit pause notice instead of accepting new checkout submissions.
- Previous booking/refund terms remain readable with clear historical-only notices. Existing customer obligations are not altered.
- Payment-success return route, admin review page, legacy payment backend, historic orders, and Meta Ads are untouched.

## QA before production merge
- Offer/source consistency: 34/34 pass (`qa_short_course_offer.py`).
- Retired checkout surface: 27/27 pass (`qa_legacy_payment_paused.py`).
- Paused public-route browser smoke tests desktop/mobile: 36/36 pass (external E-drive audit).
- V37 desktop/mobile full-flow browser tests: 42/42 pass (external E-drive audit).
- Six-question diagnostic PDF and reporting tests previously verified locally; production-domain retest required.

## Limits and rollback
This work closes new payment **through the website's current public entry points**. It does not disable the old provider endpoints or invalidate payments already made.

Rollback anchor: pre-release main `8399872e3462f463abdd693c1f016cfffb6a6c05`. If a production regression occurs, use a targeted revert of the release merge commit, not a force-push; assess any new submissions first.

## Post-merge acceptance
Verify the public domain homepage and the six-question route return HTTP 200, contain no old offer/pricing, and permit PDF download. Confirm historical payment pages are non-transactional, preview tests pass on desktop and mobile, and no new advertising calls are made automatically. Keep the actual course and LMS gated until commercial requirements are approved.
